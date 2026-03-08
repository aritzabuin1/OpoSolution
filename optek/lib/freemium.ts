/**
 * lib/freemium.ts — Freemium gating constants
 *
 * Centraliza todos los límites del plan gratuito.
 * Importar desde aquí para mantener consistencia entre backend y UI.
 */

/** Números de tema accesibles para usuarios free */
export const FREE_TEMA_NUMEROS = [1, 11, 17] as const

/** Límites de uso para usuarios free */
export const FREE_LIMITS = {
  /** Tests de IA en temas permitidos */
  tests: 5,
  /** Tests psicotécnicos (coste IA = 0€, pero creamos necesidad) */
  psicotecnicos: 3,
  /** Simulacros de examen oficial (solo 20 preguntas) */
  simulacros: 3,
  /** Máximo de preguntas por simulacro para free */
  simulacroMaxPreguntas: 20,
  /** Caza-trampas por día */
  cazatrampasDay: 3,
  /** Correcciones de desarrollo */
  corrections: 2,
} as const

/** Rate limits silenciosos para usuarios de pago (anti-abuso) */
export const PAID_LIMITS = {
  testsDay: 20,
  simulacrosDay: 10,
  cazatrampasDay: 20,
} as const

/**
 * Check if a user has paid access (compra OR is_founder).
 * IMPORTANT: is_admin does NOT grant premium — admin is a separate role.
 *
 * Use this in ALL API endpoints that need to distinguish free vs paid.
 * Do NOT check only the compras table — founders have no compra record.
 */
export async function checkPaidAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<boolean> {
  const [{ count: purchaseCount }, { data: profileData }] = await Promise.all([
    supabase
      .from('compras')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .select('is_founder')
      .eq('id', userId)
      .single(),
  ])

  const hasPurchase = (purchaseCount ?? 0) > 0
  const isFounder = (profileData as { is_founder?: boolean } | null)?.is_founder === true

  return hasPurchase || isFounder
}
