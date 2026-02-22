import Stripe from 'stripe'

/**
 * Cliente Stripe (server-side only).
 *
 * NUNCA importar en componentes cliente — contiene STRIPE_SECRET_KEY.
 * Usar solo en API routes, Server Actions y server components.
 *
 * Modelo de pricing OPTEK (ADR-0010 — Fuel Tank):
 *   STRIPE_PRICE_TEMA     → Tema Individual   4.99€  one-time  → +5 correcciones
 *   STRIPE_PRICE_PACK     → Pack Oposición   34.99€  one-time  → +20 correcciones
 *   STRIPE_PRICE_RECARGA  → Recarga          8.99€   one-time  → +15 correcciones
 *
 * Tests: ilimitados para usuarios con compra. Límite silencioso 20/día vía Upstash.
 * Sin suscripciones. Sin caducidad. Pago único.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// ─── Constantes de productos ──────────────────────────────────────────────────

export const STRIPE_PRICES = {
  tema:    process.env.STRIPE_PRICE_TEMA    ?? '', // 4.99€  one-time
  pack:    process.env.STRIPE_PRICE_PACK    ?? '', // 34.99€ one-time
  recarga: process.env.STRIPE_PRICE_RECARGA ?? '', // 8.99€  one-time
} as const

export type StripePriceTier = keyof typeof STRIPE_PRICES

// Correcciones que otorga cada producto al comprarse
export const CORRECTIONS_GRANTED: Record<StripePriceTier, number> = {
  tema:    5,
  pack:    20,
  recarga: 15,
}
