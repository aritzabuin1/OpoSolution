import Stripe from 'stripe'

/**
 * Cliente Stripe (server-side only).
 *
 * NUNCA importar en componentes cliente — contiene STRIPE_SECRET_KEY.
 * Usar solo en API routes, Server Actions y server components.
 *
 * Modelo de pricing OpoRuta (ADR-0010 — Fuel Tank):
 *   STRIPE_PRICE_PACK     → Pack Oposición   34.99€  one-time  → +20 correcciones
 *   STRIPE_PRICE_RECARGA  → Recarga           8.99€  one-time  → +10 correcciones
 *   STRIPE_PRICE_FOUNDER  → Pack Fundador    24.99€  one-time  → +30 correcciones + is_founder badge
 *
 * Tests: ilimitados para usuarios con compra. Límite silencioso 20/día vía Upstash.
 * Caza-Trampas: 3/día free, ilimitado paid (§2.12.17).
 * Sin suscripciones. Sin caducidad. Pago único.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// ─── Constantes de productos ──────────────────────────────────────────────────

export const STRIPE_PRICES = {
  pack:     process.env.STRIPE_PRICE_PACK     ?? '', // 49.99€ one-time → +20 análisis detallados
  recarga:  process.env.STRIPE_PRICE_RECARGA  ?? '', // 8.99€  one-time → +10 análisis detallados
  fundador: process.env.STRIPE_PRICE_FOUNDER  ?? '', // 24.99€ one-time → +30 análisis detallados + is_founder badge (§1.21.3)
} as const

export type StripePriceTier = keyof typeof STRIPE_PRICES

// Correcciones que otorga cada producto al comprarse
export const CORRECTIONS_GRANTED: Record<StripePriceTier, number> = {
  pack:     20,
  recarga:  10,
  fundador: 30,
}

// Número máximo de plazas de Fundador (escasez real — enforcement en checkout route)
// Cambiar aquí actualiza tanto el banner de la landing como el bloqueo de Stripe
export const FOUNDER_LIMIT = 20
