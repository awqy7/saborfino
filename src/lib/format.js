export function formatPrice(value) {
  if (value === null || value === undefined) return '—';
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}
