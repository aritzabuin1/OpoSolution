/**
 * lib/freemium.ts — Freemium gating constants
 *
 * Centraliza todos los límites del plan gratuito.
 * Importar desde aquí para mantener consistencia entre backend y UI.
 */

/** Free temas by oposición slug — extensible for multi-oposición */
const FREE_TEMAS_BY_SLUG: Record<string, readonly number[]> = {
  'aux-admin-estado': [1, 11, 17],        // CE, LPAC, Ofimática Word
  'administrativo-estado': [1, 18, 41],    // CE, LPAC procedimiento, Word 365
}

/** Get free tema numbers for a given oposición slug */
export function getFreeTemas(slug: string): readonly number[] {
  return FREE_TEMAS_BY_SLUG[slug] ?? FREE_TEMAS_BY_SLUG['aux-admin-estado']
}

/** Números de tema accesibles para usuarios free (backward-compatible alias for C2) */
export const FREE_TEMA_NUMEROS = FREE_TEMAS_BY_SLUG['aux-admin-estado']

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
 * Check if a user has paid access for a SPECIFIC oposición.
 *
 * CRITICAL: oposicionId is OBLIGATORIO. Comprar C2 ≠ acceso a C1.
 * Filters `compras` by oposicion_id to enforce per-oposición isolation.
 *
 * is_admin grants premium access so admins can test all features.
 * IMPORTANT: premium does NOT grant admin — admin panel checks is_admin separately.
 * The security boundary is: is_admin → can see admin panel + premium features.
 *                           premium  → can only see premium features.
 *
 * Use this in ALL API endpoints that need to distinguish free vs paid.
 */
export async function checkPaidAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  oposicionId: string  // OBLIGATORIO — fuerza a todos los callers a especificar oposición
): Promise<boolean> {
  const [{ count: purchaseCount }, { data: profileData }] = await Promise.all([
    supabase
      .from('compras')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('oposicion_id', oposicionId),  // SIEMPRE filtrar por oposición
    supabase
      .from('profiles')
      .select('is_founder, is_admin')
      .eq('id', userId)
      .single(),
  ])

  const hasPurchase = (purchaseCount ?? 0) > 0
  const prof = profileData as { is_founder?: boolean; is_admin?: boolean } | null
  const isFounder = prof?.is_founder === true
  const isAdmin = prof?.is_admin === true

  return hasPurchase || isFounder || isAdmin
}

// ─── Helpers para derivar oposicionId ────────────────────────────────────────

/** Default oposicion_id (C2 Auxiliar) — used as fallback when no oposicion is set */
export const DEFAULT_OPOSICION_ID = 'a0000000-0000-0000-0000-000000000001'

/**
 * Get oposicionId from a temaId by querying the temas table.
 * Pattern A: for endpoints that have a temaId in the request.
 */
export async function getOposicionFromTema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  temaId: string
): Promise<string> {
  const { data } = await supabase
    .from('temas')
    .select('oposicion_id')
    .eq('id', temaId)
    .single()
  return (data as { oposicion_id?: string } | null)?.oposicion_id ?? DEFAULT_OPOSICION_ID
}

/**
 * Get oposicionId from the user's profile.
 * Pattern B: for endpoints without temaId (simulacros, roadmap, etc.).
 */
export async function getOposicionFromProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('oposicion_id')
    .eq('id', userId)
    .single()
  return (data as { oposicion_id?: string } | null)?.oposicion_id ?? DEFAULT_OPOSICION_ID
}

/**
 * Check if a user is admin (is_admin=true in profiles).
 * Admin skips rate limits and has unrestricted access for testing.
 */
export async function checkIsAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  return (data as { is_admin?: boolean } | null)?.is_admin === true
}
