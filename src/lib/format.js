export function formatPrice(value) {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '—';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}
