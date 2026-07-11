import { describe, it, expect } from 'vitest'
import { formatPrice } from '../lib/format'

describe('formatPrice', () => {
  it('formats integer correctly', () => {
    expect(formatPrice(10)).toBe('R$ 10,00')
  })

  it('formats decimal correctly', () => {
    expect(formatPrice(25.5)).toBe('R$ 25,50')
  })

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('R$ 0,00')
  })

  it('handles null', () => {
    expect(formatPrice(null)).toBe('—')
  })

  it('handles undefined', () => {
    expect(formatPrice(undefined)).toBe('—')
  })

  it('formats large numbers', () => {
    expect(formatPrice(1234.56)).toBe('R$ 1234,56')
  })
})
