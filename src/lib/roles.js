import { supabase } from './supabase';

export const ROLE_DONO = 'dono';
export const ROLE_ATENDENTE = 'atendente';

export async function getUserRole(userId, email) {
  try {
    const { data, error } = await supabase
      .from('perfis')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      const { data: perfilEmail } = await supabase
        .from('perfis')
        .select('role')
        .eq('email', email)
        .maybeSingle();
      
      if (perfilEmail) return perfilEmail.role;
      return null;
    }

    return data.role;
  } catch {
    return null;
  }
}

export function canAccess(role, page) {
  if (role === ROLE_DONO) return true;
  if (role === ROLE_ATENDENTE) {
    return ['/app/pos', '/app/cozinha', '/app'].includes(page);
  }
  return false;
}
