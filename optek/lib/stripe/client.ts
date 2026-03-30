import Stripe from 'stripe'

/**
 * Cliente Stripe (server-side only).
 *
 * NUNCA importar en componentes cliente — contiene STRIPE_SECRET_KEY.
 * Usar solo en API routes, Server Actions y server components.
 *
 * Modelo de pricing OpoRuta — Créditos IA unificados:
 *   STRIPE_PRICE_PACK         → Pack C2 (Auxiliar)            49.99€  one-time  → +20 créditos IA
 *   STRIPE_PRICE_PACK_C1      → Pack C1 (Administrativo)      49.99€  one-time  → +20 créditos IA
 *   STRIPE_PRICE_PACK_A2      → Pack A2 (GACE)                69.99€  one-time  → +25 créditos IA
 *   STRIPE_PRICE_PACK_DOBLE   → Pack Doble (C1+C2)            79.99€  one-time  → +30 créditos IA
 *   STRIPE_PRICE_PACK_TRIPLE  → Pack Triple AGE (C1+C2+A2)   129.99€  one-time  → +40 créditos IA
 *   STRIPE_PRICE_RECARGA      → Recarga créditos IA             9.99€  one-time  → +10 créditos IA
 *
 * 1 crédito IA = 1 sesión Tutor IA (errores, informe, flashcard).
 * Supuesto desarrollo = 2 créditos IA (generar caso + corregir).
 * Tests: ilimitados para usuarios con compra. Límite silencioso 20/día vía Upstash.
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
  // Hacienda
  pack_hacienda:  process.env.STRIPE_PRICE_PACK_HACIENDA  ?? '', // 49.99€ → Agente Hacienda C1
  // Penitenciarias
  pack_penitenciarias: process.env.STRIPE_PRICE_PACK_PENITENCIARIAS ?? '', // 49.99€ → Ayudante IIPP C1
  // Recarga única
  recarga:        process.env.STRIPE_PRICE_RECARGA        ?? '', //   9.99€ → +10 créditos IA
} as const

export type StripePriceTier = keyof typeof STRIPE_PRICES

// Créditos IA que otorga cada producto (pool unificado: corrections_balance)
// A2 packs include extra créditos for supuesto desarrollo (2 créditos × 5 supuestos = 10 extra)
export const CORRECTIONS_GRANTED: Record<StripePriceTier, number> = {
  // AGE
  pack:           20,
  pack_c1:        20,
  pack_a2:        25,  // 20 base + 5 extra (≈2.5 supuestos desarrollo)
  pack_doble:     30,
  pack_triple:    40,
  // Correos
  pack_correos:   20,
  // Justicia
  pack_auxilio:   20,
  pack_tramitacion: 20,
  pack_gestion_j: 25,  // 20 base + 5 extra
  pack_doble_justicia: 30,
  pack_triple_justicia: 45,  // 40 base + 5 extra
  // Hacienda
  pack_hacienda:  20,
  // Penitenciarias
  pack_penitenciarias: 20,
  // Recarga
  recarga:        10,
}

// SUPUESTOS_GRANTED removed — supuesto desarrollo now costs 2 créditos IA
// from the unified corrections_balance pool. No separate supuestos_balance needed.

// IDs de oposición en BD (seed + migration 030 + migration 040 + futuras 048/049)
export const C2_OPOSICION_ID = 'a0000000-0000-0000-0000-000000000001'  // AGE Auxiliar
export const C1_OPOSICION_ID = 'b0000000-0000-0000-0000-000000000001'  // AGE Administrativo
export const A2_OPOSICION_ID = 'c2000000-0000-0000-0000-000000000001'  // AGE Gestión GACE
// Correos + Justicia IDs (migrations 048/049 pendientes)
export const CORREOS_OPOSICION_ID = 'd0000000-0000-0000-0000-000000000001'
export const AUXILIO_OPOSICION_ID = 'e0000000-0000-0000-0000-000000000001'
export const TRAMITACION_OPOSICION_ID = 'e1000000-0000-0000-0000-000000000001'
export const GESTION_J_OPOSICION_ID = 'e2000000-0000-0000-0000-000000000001'
// Hacienda + Penitenciarias IDs (migration 064)
export const HACIENDA_OPOSICION_ID = 'f0000000-0000-0000-0000-000000000001'
export const PENITENCIARIAS_OPOSICION_ID = 'f1000000-0000-0000-0000-000000000001'

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
  // Hacienda
  pack_hacienda:      HACIENDA_OPOSICION_ID,
  // Penitenciarias
  pack_penitenciarias: PENITENCIARIAS_OPOSICION_ID,
  // Recarga (global — no vinculada a oposición específica)
  recarga:            '',
}

