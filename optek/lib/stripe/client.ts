import Stripe from 'stripe'

/**
 * Cliente Stripe (server-side only).
 *
 * NUNCA importar en componentes cliente — contiene STRIPE_SECRET_KEY.
 * Usar solo en API routes, Server Actions y server components.
 *
 * Precios (test mode) — configurar tras crear productos en Dashboard (0.14.5):
 *   STRIPE_PRICE_TEMA     → Tema Individual (4.99€ one-time)
 *   STRIPE_PRICE_PACK     → Pack Oposición (29.99€ one-time)
 *   STRIPE_PRICE_PREMIUM  → Premium Mensual (12.99€/mes recurring)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

// ─── Constantes de productos ──────────────────────────────────────────────────

export const STRIPE_PRICES = {
  tema: process.env.STRIPE_PRICE_TEMA ?? '',      // 4.99€ / tema
  pack: process.env.STRIPE_PRICE_PACK ?? '',       // 29.99€ / oposición
  premium: process.env.STRIPE_PRICE_PREMIUM ?? '', // 12.99€ / mes
} as const

export type StripePriceTier = keyof typeof STRIPE_PRICES
