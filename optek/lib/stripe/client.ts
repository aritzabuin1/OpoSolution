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
  // AGE
  pack:           process.env.STRIPE_PRICE_PACK           ?? '', // 49.99€ → C2 Auxiliar AGE
  pack_c1:        process.env.STRIPE_PRICE_PACK_C1        ?? '', // 49.99€ → C1 Administrativo AGE
  pack_a2:        process.env.STRIPE_PRICE_PACK_A2        ?? '', // 69.99€ → A2 GACE (incluye supuestos)
  pack_doble:     process.env.STRIPE_PRICE_PACK_DOBLE     ?? '', // 79.99€ → C1 + C2 AGE
  pack_triple:    process.env.STRIPE_PRICE_PACK_TRIPLE    ?? '', // 129.99€ → C1 + C2 + A2 AGE
  // Correos
  pack_correos:   process.env.STRIPE_PRICE_PACK_CORREOS   ?? '', // 49.99€ → Correos Grupo IV
  // Justicia
  pack_auxilio:   process.env.STRIPE_PRICE_PACK_AUXILIO   ?? '', // 49.99€ → Auxilio Judicial C2
  pack_tramitacion: process.env.STRIPE_PRICE_PACK_TRAMITACION ?? '', // 49.99€ → Tramitación C1
  pack_gestion_j: process.env.STRIPE_PRICE_PACK_GESTION_J ?? '', // 79.99€ → Gestión Procesal A2
  pack_doble_justicia: process.env.STRIPE_PRICE_PACK_DOBLE_JUSTICIA ?? '', // 79.99€ → Auxilio + Tramitación
  pack_triple_justicia: process.env.STRIPE_PRICE_PACK_TRIPLE_JUSTICIA ?? '', // 139.99€ → Auxilio + Tramitación + Gestión
  // Recargas + fundador
  recarga:        process.env.STRIPE_PRICE_RECARGA        ?? '', //   8.99€ → +10 análisis
  recarga_sup:    process.env.STRIPE_PRICE_RECARGA_SUP    ?? '', //  14.99€ → +5 supuestos
  fundador:       process.env.STRIPE_PRICE_FOUNDER        ?? '', //  24.99€ → global badge
} as const

export type StripePriceTier = keyof typeof STRIPE_PRICES

// Correcciones (análisis) que otorga cada producto (pool compartido)
export const CORRECTIONS_GRANTED: Record<StripePriceTier, number> = {
  // AGE
  pack:           20,
  pack_c1:        20,
  pack_a2:        20,
  pack_doble:     30,
  pack_triple:    40,
  // Correos
  pack_correos:   20,
  // Justicia
  pack_auxilio:   20,
  pack_tramitacion: 20,
  pack_gestion_j: 20,
  pack_doble_justicia: 30,
  pack_triple_justicia: 40,
  // Recargas + fundador
  recarga:        10,
  recarga_sup:    0,
  fundador:       30,
}

// Supuestos prácticos que otorga cada producto (pool separado: supuestos_balance)
export const SUPUESTOS_GRANTED: Record<StripePriceTier, number> = {
  // AGE
  pack:           0,
  pack_c1:        0,
  pack_a2:        5,
  pack_doble:     0,
  pack_triple:    5,
  // Correos (no tiene supuesto práctico)
  pack_correos:   0,
  // Justicia (Gestión tiene desarrollo escrito → supuestos IA)
  pack_auxilio:   0,
  pack_tramitacion: 0,
  pack_gestion_j: 5,
  pack_doble_justicia: 0,
  pack_triple_justicia: 5,
  // Recargas + fundador
  recarga:        0,
  recarga_sup:    5,
  fundador:       5,
}

// IDs de oposición en BD (seed + migration 030 + migration 040 + futuras 048/049)
export const C2_OPOSICION_ID = 'a0000000-0000-0000-0000-000000000001'  // AGE Auxiliar
export const C1_OPOSICION_ID = 'b0000000-0000-0000-0000-000000000001'  // AGE Administrativo
export const A2_OPOSICION_ID = 'c2000000-0000-0000-0000-000000000001'  // AGE Gestión GACE
// Correos + Justicia IDs (migrations 048/049 pendientes)
export const CORREOS_OPOSICION_ID = 'd0000000-0000-0000-0000-000000000001'
export const AUXILIO_OPOSICION_ID = 'e0000000-0000-0000-0000-000000000001'
export const TRAMITACION_OPOSICION_ID = 'e1000000-0000-0000-0000-000000000001'
export const GESTION_J_OPOSICION_ID = 'e2000000-0000-0000-0000-000000000001'

// Mapeo tier → oposición(es) para checkout metadata
export const TIER_TO_OPOSICION: Record<StripePriceTier, string | string[]> = {
  // AGE
  pack:               C2_OPOSICION_ID,
  pack_c1:            C1_OPOSICION_ID,
  pack_a2:            A2_OPOSICION_ID,
  pack_doble:         [C2_OPOSICION_ID, C1_OPOSICION_ID],
  pack_triple:        [C2_OPOSICION_ID, C1_OPOSICION_ID, A2_OPOSICION_ID],
  // Correos
  pack_correos:       CORREOS_OPOSICION_ID,
  // Justicia
  pack_auxilio:       AUXILIO_OPOSICION_ID,
  pack_tramitacion:   TRAMITACION_OPOSICION_ID,
  pack_gestion_j:     GESTION_J_OPOSICION_ID,
  pack_doble_justicia: [AUXILIO_OPOSICION_ID, TRAMITACION_OPOSICION_ID],
  pack_triple_justicia: [AUXILIO_OPOSICION_ID, TRAMITACION_OPOSICION_ID, GESTION_J_OPOSICION_ID],
  // Recargas + fundador (global)
  recarga:            '',
  recarga_sup:        '',
  fundador:           '',
}

// Número máximo de plazas de Fundador — 20 GLOBALES (no por oposición)
export const FOUNDER_LIMIT = 20
