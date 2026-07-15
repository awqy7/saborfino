import { supabase } from './supabase';

export function parseComandaCode(input) {
  if (!input) return null;
  const trimmed = input.trim().toUpperCase();
  const urlMatch = trimmed.match(/\/comanda\/(C\d{3})/i);
  if (urlMatch) return urlMatch[1];
  const codeMatch = trimmed.match(/^C\d{3}$/);
  if (codeMatch) return codeMatch[0];
  const numMatch = trimmed.match(/^(\d{1,3})$/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 0 && num <= 999) return 'C' + String(num).padStart(3, '0');
  }
  return null;
}

export async function getComanda(codigo) {
  const { data, error } = await supabase
    .from('comandas')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createComanda(codigo, precoKg = 48.90) {
  const { data, error } = await supabase
    .from('comandas')
    .insert([{ codigo, status: 'aberta', preco_kg: precoKg }])
    .select()
    .single();
  if (error) {
    if (error.code === '23505') {
      const existing = await getComanda(codigo);
      if (existing && existing.status === 'aberta') return existing;
      await supabase
        .from('pedidos')
        .update({ comanda_codigo: null })
        .eq('comanda_codigo', codigo);
      await supabase
        .from('comandas')
        .update({ status: 'aberta', preco_kg: precoKg, closed_at: null, closed_by: null })
        .eq('codigo', codigo);
      return { ...existing, status: 'aberta', preco_kg: precoKg, closed_at: null, closed_by: null };
    }
    throw error;
  }
  return data;
}

export async function nextComandaCodigo() {
  try {
    const { data, error } = await supabase.rpc('next_comanda_codigo');
    if (!error && data) return data;
  } catch {}
  const { data: all } = await supabase
    .from('comandas')
    .select('codigo')
    .order('codigo', { ascending: false })
    .limit(1);
  const last = all && all.length > 0 ? parseInt(all[0].codigo.slice(1), 10) : 0;
  const next = last >= 999 ? 1 : last + 1;
  return 'C' + String(next).padStart(3, '0');
}

export async function getComandaData(codigo) {
  const { data, error } = await supabase.rpc('get_comanda_data', { p_codigo: codigo });
  if (error) throw error;
  return data;
}

export async function addBuffetToComanda(codigo, pesoKg, precoKg, observacao) {
  const total = pesoKg * precoKg;
  const item = {
    name: 'Buffet por Quilo',
    price: total,
    quantity: 1,
    category: 'Buffet',
    peso: pesoKg,
    preco_kg: precoKg,
  };
  const { data, error } = await supabase
    .from('pedidos')
    .insert([{
      comanda_codigo: codigo,
      status: 'pendente',
      itens: [item],
      total: total,
      tipo: 'buffet',
      observacao: observacao || null,
      mesa: null,
    }])
    .select()
    .single();
  if (error) throw error;
  await supabase
    .from('comandas')
    .update({ preco_kg: precoKg })
    .eq('codigo', codigo);
  return data;
}

export async function closeComanda(codigo) {
  const { data: user } = await supabase.auth.getUser();
  const { error: err1 } = await supabase
    .from('comandas')
    .update({ status: 'fechada', closed_at: new Date().toISOString(), closed_by: user?.user?.id || null })
    .eq('codigo', codigo)
    .eq('status', 'aberta');
  if (err1) throw err1;
  const { error: err2 } = await supabase
    .from('pedidos')
    .update({ status: 'pago' })
    .eq('comanda_codigo', codigo)
    .neq('status', 'pago');
  if (err2) throw err2;
}

export async function cancelComanda(codigo) {
  const { error } = await supabase
    .from('comandas')
    .update({ status: 'cancelada', closed_at: new Date().toISOString() })
    .eq('codigo', codigo)
    .eq('status', 'aberta');
  if (error) throw error;
}

export async function searchComandas(searchTerm) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    const { data, error } = await supabase
      .from('comandas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  }
  const code = parseComandaCode(searchTerm);
  if (!code) return [];
  const { data, error } = await supabase
    .from('comandas')
    .select('*')
    .eq('codigo', code)
    .maybeSingle();
  if (error) throw error;
  return data ? [data] : [];
}

export async function getRecentComandas(limit = 10) {
  const { data, error } = await supabase
    .from('comandas')
    .select('codigo, status, created_at, closed_at')
    .eq('status', 'aberta')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getComandaPedidos(codigo) {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('comanda_codigo', codigo)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
