/**
 * tests/unit/stripe-client.test.ts
 *
 * Tests unitarios para constantes de pricing Stripe.
 *
 * Cobertura:
 *   - CORRECTIONS_GRANTED: valores por tier
 *   - STRIPE_PRICES: estructura completa
 *   - StripePriceTier: 5 tiers válidos (C2 + C1 + doble)
 *   - FOUNDER_LIMIT: valor correcto (20 global)
 *   - TIER_TO_OPOSICION: mapeo tier → oposición
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock Stripe constructor to avoid needing STRIPE_SECRET_KEY
vi.mock('stripe', () => ({
  default: class MockStripe {
    constructor() {}
  },
}))

// Import after mock
import {
  CORRECTIONS_GRANTED,
  STRIPE_PRICES,
  FOUNDER_LIMIT,
  TIER_TO_OPOSICION,
  C2_OPOSICION_ID,
  C1_OPOSICION_ID,
} from '@/lib/stripe/client'
import type { StripePriceTier } from '@/lib/stripe/client'

describe('Stripe pricing constants', () => {
  // ─── CORRECTIONS_GRANTED ───────────────────────────────────────────────────

  it('pack otorga 20 correcciones', () => {
    expect(CORRECTIONS_GRANTED.pack).toBe(20)
  })

  it('pack_c1 otorga 20 correcciones', () => {
    expect(CORRECTIONS_GRANTED.pack_c1).toBe(20)
  })

  it('pack_doble otorga 30 correcciones', () => {
    expect(CORRECTIONS_GRANTED.pack_doble).toBe(30)
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

  it('existen 5 tiers', () => {
    expect(Object.keys(CORRECTIONS_GRANTED)).toHaveLength(5)
    expect(Object.keys(CORRECTIONS_GRANTED).sort()).toEqual([
      'fundador', 'pack', 'pack_c1', 'pack_doble', 'recarga',
    ])
  })

  // ─── STRIPE_PRICES ────────────────────────────────────────────────────────

  it('STRIPE_PRICES tiene las 5 keys esperadas', () => {
    expect(Object.keys(STRIPE_PRICES).sort()).toEqual([
      'fundador', 'pack', 'pack_c1', 'pack_doble', 'recarga',
    ])
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

  // ─── TIER_TO_OPOSICION ──────────────────────────────────────────────────────

  it('pack → C2', () => {
    expect(TIER_TO_OPOSICION.pack).toBe(C2_OPOSICION_ID)
  })

  it('pack_c1 → C1', () => {
    expect(TIER_TO_OPOSICION.pack_c1).toBe(C1_OPOSICION_ID)
  })

  it('pack_doble → "doble"', () => {
    expect(TIER_TO_OPOSICION.pack_doble).toBe('doble')
  })

  it('fundador → vacío (global, no vinculado a oposición)', () => {
    expect(TIER_TO_OPOSICION.fundador).toBe('')
  })

  it('recarga → vacío (sin oposición específica)', () => {
    expect(TIER_TO_OPOSICION.recarga).toBe('')
  })

  // ─── Type safety ──────────────────────────────────────────────────────────

  it('StripePriceTier mapea correctamente a CORRECTIONS_GRANTED', () => {
    const tiers: StripePriceTier[] = ['pack', 'pack_c1', 'pack_doble', 'recarga', 'fundador']
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

  it('pack_doble da más correcciones que pack individual', () => {
    expect(CORRECTIONS_GRANTED.pack_doble).toBeGreaterThan(CORRECTIONS_GRANTED.pack)
  })
})
