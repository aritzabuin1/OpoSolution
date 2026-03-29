/**
 * lib/freemium.ts — Freemium gating constants
 *
 * Centraliza todos los límites del plan gratuito.
 * Importar desde aquí para mantener consistencia entre backend y UI.
 */

// ─── FREE TIER v2: 1 test per tema, all temas open ──────────────────────────
// All free users see the SAME 10 fixed questions per tema from free_question_bank.
// No choice of difficulty or question count for free users.

/** Number of free tests allowed per tema */
export const FREE_TESTS_PER_TEMA = 1

/** Fixed number of questions in each free test */
export const FREE_QUESTIONS_PER_TEST = 10

/**
 * Check if a free user can take a test for a specific tema.
 * Returns true if they haven't completed a test for this tema yet.
 * Only counts COMPLETED tests — if user abandons mid-test, they can retry
 * (same free bank questions, no AI cost). findIncompleteTest() handles
 * returning the existing incomplete test if one exists.
 */
export async function canTakeFreeTemaTest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  temaId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from('tests_generados')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tema_id', temaId)
    .eq('completado', true)

  return (count ?? 0) < FREE_TESTS_PER_TEMA
}

/**
 * Get free tier status for all temas of an oposición.
 * Returns a Map of temaId → { completed: boolean, score: number | null, testId: string | null }
 */
export async function getFreeTemaStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  oposicionId: string,
): Promise<Map<string, { completed: boolean; score: number | null; testId: string | null }>> {
  const { data: completedTests } = await supabase
    .from('tests_generados')
    .select('tema_id, puntuacion, id')
    .eq('user_id', userId)
    .eq('oposicion_id', oposicionId)
    .eq('completado', true)
    .not('tema_id', 'is', null)

  const statusMap = new Map<string, { completed: boolean; score: number | null; testId: string | null }>()
  for (const t of (completedTests ?? []) as Array<{ tema_id: string; puntuacion: number | null; id: string }>) {
    // Keep the first completed test per tema (earliest)
    if (!statusMap.has(t.tema_id)) {
      statusMap.set(t.tema_id, {
        completed: true,
        score: t.puntuacion,
        testId: t.id,
      })
    }
  }

  return statusMap
}

/**
 * Find an existing incomplete test for a tema (idempotency).
 * If a free user started a test but didn't complete it, return it instead of creating a new one.
 */
export async function findIncompleteTest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  temaId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('tests_generados')
    .select('id')
    .eq('user_id', userId)
    .eq('tema_id', temaId)
    .eq('completado', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as { id: string } | null)?.id ?? null
}

// ─── LEGACY: kept for backward compatibility during migration ────────────────
// These will be removed once all references are updated.

/** @deprecated Use FREE_TESTS_PER_TEMA instead */
const FREE_TEMAS_BY_SLUG: Record<string, readonly number[]> = {
  'aux-admin-estado': [1, 11, 17],
  'administrativo-estado': [1, 11, 17],
  'gestion-estado': [1, 28, 51],
}

/** @deprecated Use FREE_TESTS_PER_TEMA instead */
export function getFreeTemas(slug: string): readonly number[] {
  return FREE_TEMAS_BY_SLUG[slug] ?? FREE_TEMAS_BY_SLUG['aux-admin-estado']
}

/** @deprecated Use FREE_TESTS_PER_TEMA instead */
export const FREE_TEMA_NUMEROS = FREE_TEMAS_BY_SLUG['aux-admin-estado']

/** Límites de uso para usuarios free */
export const FREE_LIMITS = {
  /** @deprecated — gating is now per-tema, not global. Kept for analytics. */
  tests: 5,
  /** Tests psicotécnicos (coste IA = 0€, pero creamos necesidad) */
  psicotecnicos: 3,
  /** Simulacros de examen oficial completo (1 lifetime, same for all free users) */
  simulacros: 1,
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
      .select('is_admin')
      .eq('id', userId)
      .single(),
  ])

  const hasPurchase = (purchaseCount ?? 0) > 0
  const prof = profileData as { is_admin?: boolean } | null
  const isAdmin = prof?.is_admin === true

  return hasPurchase || isAdmin
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
 * Get oposicion nombre from user's profile + oposiciones table.
 * Used to parametrize AI prompts per oposicion (C1 vs C2).
 */
export async function getOposicionNombreFromProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<string> {
  const oposicionId = await getOposicionFromProfile(supabase, userId)
  const { data } = await supabase
    .from('oposiciones')
    .select('nombre')
    .eq('id', oposicionId)
    .single()
  return (data as { nombre?: string } | null)?.nombre ?? 'Auxiliar Administrativo del Estado'
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
