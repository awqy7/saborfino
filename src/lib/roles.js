import { supabase } from './supabase';

export const ROLE_DONO = 'dono';
export const ROLE_ATENDENTE = 'atendente';

export async function getUserRole(userId, email) {
  try {
    const { data, error } = await supabase
      .from('perfis')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (data) return data.role;
    if (error) console.error('getUserRole fetch error:', error);
    return null;
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
