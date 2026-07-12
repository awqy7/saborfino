import { describe, it, expect } from 'vitest'
import { splitOrder } from '../lib/printer'

describe('splitOrder', () => {
  const order = {
    id: '123',
    mesa: '5',
  

    itens: [
      { name: 'Picanha', category: 'Chapas', quantity: 2 },
      { name: 'Coca-Cola', category: 'Bebidas', quantity: 1 },
      { name: 'Caipirinha', category: 'Drinks', quantity: 1 },
    ]
  }

  it('splits kitchen and bar items', () => {
    const { kitchen, bar } = splitOrder(order)
    expect(kitchen).toHaveLength(1)
    expect(bar).toHaveLength(2)
    expect(kitchen[0].name).toBe('Picanha')
    expect(bar[0].name).toBe('Coca-Cola')
    expect(bar[1].name).toBe('Caipirinha')
  })

  it('handles empty items', () => {
    const { kitchen, bar } = splitOrder({ itens: [] })
    expect(kitchen).toHaveLength(0)
    expect(bar).toHaveLength(0)
  })

  it('handles null items', () => {
    const { kitchen, bar } = splitOrder({})
    expect(kitchen).toHaveLength(0)
    expect(bar).toHaveLength(0)
  })
})
