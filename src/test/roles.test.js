import { describe, it, expect } from 'vitest'
import { 
  canAccess, 
  ROLE_DONO, 
  ROLE_ATENDENTE 
} from '../lib/roles'
import {
  validateEmail,
  validateTableNumber,
  sanitizeString,
  validateOrderData,
  validatePositiveNumber,
  validateInteger,
  validateCNPJ
} from '../lib/validation'

describe('canAccess', () => {
  it('allows dono to access all pages', () => {
    expect(canAccess(ROLE_DONO, '/app')).toBe(true)
    expect(canAccess(ROLE_DONO, '/app/pos')).toBe(true)
    expect(canAccess(ROLE_DONO, '/app/cozinha')).toBe(true)
    expect(canAccess(ROLE_DONO, '/app/caixa')).toBe(true)
    expect(canAccess(ROLE_DONO, '/app/relatorios')).toBe(true)
    expect(canAccess(ROLE_DONO, '/app/settings')).toBe(true)
  })

  it('allows atendente to access pos and cozinha only', () => {
    expect(canAccess(ROLE_ATENDENTE, '/app/pos')).toBe(true)
    expect(canAccess(ROLE_ATENDENTE, '/app/cozinha')).toBe(true)
    expect(canAccess(ROLE_ATENDENTE, '/app')).toBe(true)
  })

  it('blocks atendente from caixa', () => {
    expect(canAccess(ROLE_ATENDENTE, '/app/caixa')).toBe(false)
  })

  it('blocks atendente from relatorios', () => {
    expect(canAccess(ROLE_ATENDENTE, '/app/relatorios')).toBe(false)
  })

  it('blocks atendente from settings', () => {
    expect(canAccess(ROLE_ATENDENTE, '/app/settings')).toBe(false)
  })

  it('blocks null role', () => {
    expect(canAccess(null, '/app')).toBe(false)
    expect(canAccess(null, '/app/pos')).toBe(false)
  })
})

describe('validation', () => {
  it('validates email', () => {
    expect(validateEmail('test@example.com')).toBe('test@example.com')
    expect(validateEmail('TEST@EXAMPLE.COM')).toBe('test@example.com')
    expect(validateEmail('  test@example.com  ')).toBe('test@example.com')
    expect(validateEmail('invalid')).toBeNull()
    expect(validateEmail('')).toBeNull()
    expect(validateEmail(null)).toBeNull()
  })

  it('validates table number', () => {
    expect(validateTableNumber('1')).toBe(1)
    expect(validateTableNumber('7')).toBe(7)
    expect(validateTableNumber('0')).toBeNull()
    expect(validateTableNumber('8')).toBe(8)
    expect(validateTableNumber('abc')).toBeNull()
  })

  it('sanitizes strings', () => {
    expect(sanitizeString('  hello  ', 10)).toBe('hello')
    expect(sanitizeString('a'.repeat(20), 10)).toBe('a'.repeat(10))
    expect(sanitizeString('', 10)).toBe('')
    expect(sanitizeString(null, 10)).toBe('')
  })

  it('validates order data', () => {
    const validOrder = {
      mesa: '1',
      tipo: 'mesa',

      itens: [{ name: 'X-Burger', price: 25, quantity: 2, category: 'Chapas', cartKey: '1' }],
      total: 50
    }
    expect(validateOrderData(validOrder).valid).toBe(true)

    const invalidOrder = {
      mesa: '',
      tipo: 'mesa',

      itens: [],
      total: 0
    }
    const result = validateOrderData(invalidOrder)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('validates positive numbers', () => {
    expect(validatePositiveNumber('10.50')).toBe(10.50)
    expect(validatePositiveNumber('0')).toBeNull()
    expect(validatePositiveNumber('-5')).toBeNull()
    expect(validatePositiveNumber('abc')).toBeNull()
    expect(validatePositiveNumber('10000000')).toBeNull()
  })

  it('validates integers', () => {
    expect(validateInteger('5', 1, 10)).toBe(5)
    expect(validateInteger('0', 1, 10)).toBeNull()
    expect(validateInteger('11', 1, 10)).toBeNull()
    expect(validateInteger('abc', 1, 10)).toBeNull()
  })

  it('validates CNPJ', () => {
    const validCNPJ = '11222333000181'
    expect(validateCNPJ(validCNPJ)).toBe(validCNPJ)
    expect(validateCNPJ('11222333000182')).toBeNull()
    expect(validateCNPJ('123')).toBeNull()
    expect(validateCNPJ('abc')).toBeNull()
  })
})
