import Stripe from 'stripe'

/**
 * Cliente Stripe (server-side only).
 *
 * NUNCA importar en componentes cliente — contiene STRIPE_SECRET_KEY.
 * Usar solo en API routes, Server Actions y server components.
 *
 * Modelo de pricing OpoRuta (ADR-0010 — Fuel Tank):
 *   STRIPE_PRICE_PACK         → Pack C2 (Auxiliar)        49.99€  one-time  → +20 análisis
 *   STRIPE_PRICE_PACK_C1      → Pack C1 (Administrativo)  49.99€  one-time  → +20 análisis
 *   STRIPE_PRICE_PACK_DOBLE   → Pack Doble (C1+C2)        79.99€  one-time  → +30 análisis
 *   STRIPE_PRICE_RECARGA      → Recarga                    8.99€  one-time  → +10 análisis
 *   STRIPE_PRICE_FOUNDER      → Fundador (global)          24.99€  one-time  → +30 análisis + badge
 *
 * Tests: ilimitados para usuarios con compra. Límite silencioso 20/día vía Upstash.
 * Caza-Trampas: 3/día free, ilimitado paid (§2.12.17).
 * Créditos de análisis: pool compartido entre oposiciones.
 * Sin suscripciones. Sin caducidad. Pago único.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// ─── Constantes de productos ──────────────────────────────────────────────────

export const STRIPE_PRICES = {
  pack:         process.env.STRIPE_PRICE_PACK         ?? '', // 49.99€ → C2 Auxiliar
  pack_c1:      process.env.STRIPE_PRICE_PACK_C1      ?? '', // 49.99€ → C1 Administrativo
  pack_doble:   process.env.STRIPE_PRICE_PACK_DOBLE   ?? '', // 79.99€ → C1 + C2
  recarga:      process.env.STRIPE_PRICE_RECARGA      ?? '', //  8.99€ → +10 análisis
  fundador:     process.env.STRIPE_PRICE_FOUNDER      ?? '', // 24.99€ → global badge
} as const

export type StripePriceTier = keyof typeof STRIPE_PRICES

// Correcciones que otorga cada producto al comprarse (pool compartido)
export const CORRECTIONS_GRANTED: Record<StripePriceTier, number> = {
  pack:         20,
  pack_c1:      20,
  pack_doble:   30,
  recarga:      10,
  fundador:     30,
}

// IDs de oposición en BD (seed + migration 030)
export const C2_OPOSICION_ID = 'a0000000-0000-0000-0000-000000000001'
export const C1_OPOSICION_ID = 'b0000000-0000-0000-0000-000000000001'

// Mapeo tier → oposición(es) para checkout metadata
export const TIER_TO_OPOSICION: Record<StripePriceTier, string | 'doble'> = {
  pack:         C2_OPOSICION_ID,
  pack_c1:      C1_OPOSICION_ID,
  pack_doble:   'doble',
  recarga:      '',           // Recarga no está vinculada a oposición
  fundador:     '',           // Fundador es global — oposición se determina en checkout
}

// Número máximo de plazas de Fundador — 20 GLOBALES (no por oposición)
// Cambiar aquí actualiza tanto el banner de la landing como el bloqueo de Stripe
export const FOUNDER_LIMIT = 20
