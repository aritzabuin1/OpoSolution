/**
 * tests/unit/stripe-client.test.ts
 *
 * Tests unitarios para constantes de pricing Stripe.
 *
 * Cobertura:
 *   - CORRECTIONS_GRANTED: valores por tier
 *   - STRIPE_PRICES: estructura completa
 *   - StripePriceTier: solo 3 valores válidos
 *   - FOUNDER_LIMIT: valor correcto
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock Stripe constructor to avoid needing STRIPE_SECRET_KEY
vi.mock('stripe', () => ({
  default: class MockStripe {
    constructor() {}
  },
}))

// Import after mock
import { CORRECTIONS_GRANTED, STRIPE_PRICES, FOUNDER_LIMIT } from '@/lib/stripe/client'
import type { StripePriceTier } from '@/lib/stripe/client'

describe('Stripe pricing constants', () => {
  // ─── CORRECTIONS_GRANTED ───────────────────────────────────────────────────

  it('pack otorga 20 correcciones', () => {
    expect(CORRECTIONS_GRANTED.pack).toBe(20)
  })

  it('recarga otorga 10 correcciones', () => {
    expect(CORRECTIONS_GRANTED.recarga).toBe(10)
  })

  it('fundador otorga 30 correcciones', () => {
    expect(CORRECTIONS_GRANTED.fundador).toBe(30)
  })

  it('no existe tier "tema" (eliminado)', () => {
    expect('tema' in CORRECTIONS_GRANTED).toBe(false)
  })

  it('solo existen 3 tiers', () => {
    expect(Object.keys(CORRECTIONS_GRANTED)).toHaveLength(3)
    expect(Object.keys(CORRECTIONS_GRANTED).sort()).toEqual(['fundador', 'pack', 'recarga'])
  })

  // ─── STRIPE_PRICES ────────────────────────────────────────────────────────

  it('STRIPE_PRICES tiene las 3 keys esperadas', () => {
    expect(Object.keys(STRIPE_PRICES).sort()).toEqual(['fundador', 'pack', 'recarga'])
  })

  it('STRIPE_PRICES values son strings (price IDs o vacío)', () => {
    for (const val of Object.values(STRIPE_PRICES)) {
      expect(typeof val).toBe('string')
    }
  })

  // ─── FOUNDER_LIMIT ────────────────────────────────────────────────────────

  it('FOUNDER_LIMIT es 20', () => {
    expect(FOUNDER_LIMIT).toBe(20)
  })

  it('FOUNDER_LIMIT es un número positivo', () => {
    expect(FOUNDER_LIMIT).toBeGreaterThan(0)
  })

  // ─── Type safety ──────────────────────────────────────────────────────────

  it('StripePriceTier mapea correctamente a CORRECTIONS_GRANTED', () => {
    const tiers: StripePriceTier[] = ['pack', 'recarga', 'fundador']
    for (const tier of tiers) {
      expect(CORRECTIONS_GRANTED[tier]).toBeGreaterThan(0)
    }
  })

  it('fundador siempre da más correcciones que pack', () => {
    expect(CORRECTIONS_GRANTED.fundador).toBeGreaterThan(CORRECTIONS_GRANTED.pack)
  })

  it('pack siempre da más correcciones que recarga', () => {
    expect(CORRECTIONS_GRANTED.pack).toBeGreaterThan(CORRECTIONS_GRANTED.recarga)
  })
})
