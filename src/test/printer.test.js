import { describe, it, expect } from 'vitest'
import { splitOrder } from '../lib/printer'

describe('splitOrder', () => {
  const order = {
    id: '123',
    mesa: '5',
    itens: [
      { name: 'Picanha', category: 'Chapas', quantity: 2, serving_time: 'with_food' },
      { name: 'Coca-Cola', category: 'Bebidas', quantity: 1, serving_time: 'now' },
      { name: 'Caipirinha', category: 'Drinks', quantity: 1, serving_time: 'now' },
    ]
  }

  it('splits kitchen and bar items', () => {
    const { cozinha, barcaixa, pendingFood } = splitOrder(order)
    expect(cozinha).toHaveLength(1)
    expect(barcaixa).toHaveLength(2)
    expect(pendingFood).toHaveLength(0)
    expect(cozinha[0].name).toBe('Picanha')
    expect(barcaixa[0].name).toBe('Coca-Cola')
    expect(barcaixa[1].name).toBe('Caipirinha')
  })

  it('handles empty items', () => {
    const { cozinha, barcaixa, pendingFood } = splitOrder({ itens: [] })
    expect(cozinha).toHaveLength(0)
    expect(barcaixa).toHaveLength(0)
    expect(pendingFood).toHaveLength(0)
  })

  it('handles null items', () => {
    const { cozinha, barcaixa, pendingFood } = splitOrder({})
    expect(cozinha).toHaveLength(0)
    expect(barcaixa).toHaveLength(0)
    expect(pendingFood).toHaveLength(0)
  })
})
