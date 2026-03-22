import Stripe from 'stripe'

/**
 * Cliente Stripe (server-side only).
 *
 * NUNCA importar en componentes cliente — contiene STRIPE_SECRET_KEY.
 * Usar solo en API routes, Server Actions y server components.
 *
 * Modelo de pricing OpoRuta (ADR-0010 — Fuel Tank):
 *   STRIPE_PRICE_PACK         → Pack C2 (Auxiliar)            49.99€  one-time  → +20 análisis
 *   STRIPE_PRICE_PACK_C1      → Pack C1 (Administrativo)      49.99€  one-time  → +20 análisis
 *   STRIPE_PRICE_PACK_A2      → Pack A2 (GACE)                69.99€  one-time  → +20 análisis + 5 supuestos
 *   STRIPE_PRICE_PACK_DOBLE   → Pack Doble (C1+C2)            79.99€  one-time  → +30 análisis
 *   STRIPE_PRICE_PACK_TRIPLE  → Pack Triple AGE (C1+C2+A2)   129.99€  one-time  → +40 análisis + 5 supuestos
 *   STRIPE_PRICE_RECARGA      → Recarga análisis                8.99€  one-time  → +10 análisis
 *   STRIPE_PRICE_RECARGA_SUP  → Recarga supuestos              14.99€  one-time  → +5 supuestos
 *   STRIPE_PRICE_FOUNDER      → Fundador (global)              24.99€  one-time  → +30 análisis + badge
 *
 * Tests: ilimitados para usuarios con compra. Límite silencioso 20/día vía Upstash.
 * Caza-Trampas: 3/día free, ilimitado paid (§2.12.17).
 * Créditos de análisis: pool compartido entre oposiciones.
 * Supuestos prácticos: pool separado (supuestos_balance).
 * Sin suscripciones. Sin caducidad. Pago único.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// ─── Constantes de productos ──────────────────────────────────────────────────

export const STRIPE_PRICES = {
  pack:           process.env.STRIPE_PRICE_PACK           ?? '', // 49.99€ → C2 Auxiliar
  pack_c1:        process.env.STRIPE_PRICE_PACK_C1        ?? '', // 49.99€ → C1 Administrativo
  pack_a2:        process.env.STRIPE_PRICE_PACK_A2        ?? '', // 69.99€ → A2 GACE (incluye supuestos)
  pack_doble:     process.env.STRIPE_PRICE_PACK_DOBLE     ?? '', // 79.99€ → C1 + C2
  pack_triple:    process.env.STRIPE_PRICE_PACK_TRIPLE    ?? '', // 129.99€ → C1 + C2 + A2
  recarga:        process.env.STRIPE_PRICE_RECARGA        ?? '', //   8.99€ → +10 análisis
  recarga_sup:    process.env.STRIPE_PRICE_RECARGA_SUP    ?? '', //  14.99€ → +5 supuestos
  fundador:       process.env.STRIPE_PRICE_FOUNDER        ?? '', //  24.99€ → global badge
} as const

export type StripePriceTier = keyof typeof STRIPE_PRICES

// Correcciones (análisis) que otorga cada producto (pool compartido)
export const CORRECTIONS_GRANTED: Record<StripePriceTier, number> = {
  pack:           20,
  pack_c1:        20,
  pack_a2:        20,
  pack_doble:     30,
  pack_triple:    40,
  recarga:        10,
  recarga_sup:    0,  // Recarga supuestos no da análisis
  fundador:       30,
}

// Supuestos prácticos que otorga cada producto (pool separado: supuestos_balance)
export const SUPUESTOS_GRANTED: Record<StripePriceTier, number> = {
  pack:           0,
  pack_c1:        0,
  pack_a2:        5,
  pack_doble:     0,
  pack_triple:    5,
  recarga:        0,
  recarga_sup:    5,
  fundador:       5,
}

// IDs de oposición en BD (seed + migration 030 + migration 040)
export const C2_OPOSICION_ID = 'a0000000-0000-0000-0000-000000000001'
export const C1_OPOSICION_ID = 'b0000000-0000-0000-0000-000000000001'
export const A2_OPOSICION_ID = 'c2000000-0000-0000-0000-000000000001'

// Mapeo tier → oposición(es) para checkout metadata
export const TIER_TO_OPOSICION: Record<StripePriceTier, string | 'doble' | 'triple'> = {
  pack:           C2_OPOSICION_ID,
  pack_c1:        C1_OPOSICION_ID,
  pack_a2:        A2_OPOSICION_ID,
  pack_doble:     'doble',
  pack_triple:    'triple',
  recarga:        '',           // Recarga no está vinculada a oposición
  recarga_sup:    '',           // Recarga supuestos no está vinculada
  fundador:       '',           // Fundador es global
}

// Número máximo de plazas de Fundador — 20 GLOBALES (no por oposición)
export const FOUNDER_LIMIT = 20
