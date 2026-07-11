export function normalizeOrder(order) {
  if (!order) return order
  return {
    ...order,
    total: Number(order.total) || 0,
    itens: (order.itens || []).map(normalizeItem),
  }
}

export function normalizeItem(item) {
  if (!item) return { id: null, name: 'Item', quantity: 1, price: 0, category: 'Outros' }
  return {
    ...item,
    id: item.id ?? null,
    name: item.name || 'Item',
    quantity: Math.max(1, Number(item.quantity) || 1),
    price: Number(item.price) || 0,
    category: item.category || 'Outros',
  }
}

export function safeTotal(itens) {
  return (itens || []).reduce((acc, i) => {
    const item = normalizeItem(i)
    return acc + item.price * item.quantity
  }, 0)
}
