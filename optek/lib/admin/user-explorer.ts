/**
 * lib/admin/user-explorer.ts — User Explorer functions
 *
 * Search users by email/name, get individual timeline, state and balances.
 * Admin-only: uses createServiceClient (bypasses RLS).
 */

import { createServiceClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserSearchResult {
  id: string
  email: string
  fullName: string | null
  oposicion: string | null
  oposicionSlug: string | null
  isPremium: boolean
  temasExplored: number
  testsCompleted: number
  lastActivity: string | null
  createdAt: string
}

export interface UserDetail {
  id: string
  email: string
  fullName: string | null
  oposicionId: string | null
  oposicionNombre: string | null
  isAdmin: boolean
  isFounder: boolean
  isPremium: boolean
  createdAt: string
  // Balances
  correctionsBalance: number
  freeCorrectionsUsed: number
  supuestosBalance: number
  freeTestsUsed: number
  // Activity stats
  testsCompleted: number
  temasExplored: number
  avgScore: number | null
  rachaActual: number
  lastTestDate: string | null
  // Revenue
  totalSpent: number
  purchases: { tipo: string; amount: number; date: string }[]
}

export interface TimelineEvent {
  type: 'register' | 'test' | 'test_completed' | 'analysis' | 'purchase' | 'supuesto'
  date: string
  detail: string
  meta?: Record<string, unknown>
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function getUserSearch(query: string, limit = 20): Promise<UserSearchResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  // Search by email or name (ilike for partial match)
  const searchTerm = `%${query.trim()}%`
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, oposicion_id, created_at')
    .or(`email.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!profiles || profiles.length === 0) return []

  const userIds = (profiles as Array<{ id: string }>).map(p => p.id)

  // Get oposicion names, compras, tests in parallel
  const [oposicionesRes, comprasRes, testsRes] = await Promise.all([
    supabase.from('oposiciones').select('id, nombre, slug'),
    supabase.from('compras').select('user_id').in('user_id', userIds),
    supabase.from('tests_generados').select('user_id, tema_id, created_at')
      .eq('completado', true).in('user_id', userIds),
  ])

  const opoMap = new Map(
    ((oposicionesRes.data ?? []) as Array<{ id: string; nombre: string; slug: string }>)
      .map(o => [o.id, { nombre: o.nombre, slug: o.slug }])
  )
  const paidUsers = new Set(
    ((comprasRes.data ?? []) as Array<{ user_id: string }>).map(c => c.user_id)
  )

  // Tests per user
  const userTests = new Map<string, { count: number; temas: Set<string>; lastDate: string }>()
  for (const t of (testsRes.data ?? []) as Array<{ user_id: string; tema_id: string | null; created_at: string }>) {
    const entry = userTests.get(t.user_id) ?? { count: 0, temas: new Set<string>(), lastDate: '' }
    entry.count++
    if (t.tema_id) entry.temas.add(t.tema_id)
    if (t.created_at > entry.lastDate) entry.lastDate = t.created_at
    userTests.set(t.user_id, entry)
  }

  return (profiles as Array<{ id: string; email: string; full_name: string | null; oposicion_id: string | null; created_at: string }>).map(p => {
    const opo = p.oposicion_id ? opoMap.get(p.oposicion_id) : null
    const tests = userTests.get(p.id)
    return {
      id: p.id,
      email: p.email ?? '',
      fullName: p.full_name,
      oposicion: opo?.nombre ?? null,
      oposicionSlug: opo?.slug ?? null,
      isPremium: paidUsers.has(p.id),
      temasExplored: tests?.temas.size ?? 0,
      testsCompleted: tests?.count ?? 0,
      lastActivity: tests?.lastDate || null,
      createdAt: p.created_at,
    }
  })
}

// ─── User Detail ──────────────────────────────────────────────────────────────

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, oposicion_id, is_admin, is_founder, corrections_balance, free_corrector_used, supuestos_balance, free_tests_used, racha_actual, created_at')
    .eq('id', userId)
    .single()

  if (!profile) return null

  const p = profile as Record<string, unknown>

  // Oposicion name
  let oposicionNombre: string | null = null
  if (p.oposicion_id) {
    const { data: opo } = await supabase.from('oposiciones').select('nombre').eq('id', p.oposicion_id).single()
    oposicionNombre = (opo as { nombre: string } | null)?.nombre ?? null
  }

  // Tests + scores
  const { data: tests } = await supabase
    .from('tests_generados')
    .select('tema_id, puntuacion, created_at')
    .eq('user_id', userId)
    .eq('completado', true)

  const testsArr = (tests ?? []) as Array<{ tema_id: string | null; puntuacion: number | null; created_at: string }>
  const temas = new Set(testsArr.filter(t => t.tema_id).map(t => t.tema_id!))
  const scores = testsArr.map(t => t.puntuacion).filter((s): s is number => s !== null)
  const lastTest = testsArr.length > 0 ? testsArr.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].created_at : null

  // Purchases
  const { data: compras } = await supabase
    .from('compras')
    .select('tipo, amount_paid, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const purchasesArr = (compras ?? []) as Array<{ tipo: string; amount_paid: number; created_at: string }>
  const totalSpent = purchasesArr.reduce((s, c) => s + (c.amount_paid ?? 0), 0) / 100

  return {
    id: p.id as string,
    email: (p.email as string) ?? '',
    fullName: (p.full_name as string) ?? null,
    oposicionId: (p.oposicion_id as string) ?? null,
    oposicionNombre,
    isAdmin: p.is_admin === true,
    isFounder: p.is_founder === true,
    isPremium: purchasesArr.length > 0 || p.is_founder === true || p.is_admin === true,
    createdAt: p.created_at as string,
    correctionsBalance: (p.corrections_balance as number) ?? 0,
    freeCorrectionsUsed: (p.free_corrector_used as number) ?? 0,
    supuestosBalance: (p.supuestos_balance as number) ?? 0,
    freeTestsUsed: (p.free_tests_used as number) ?? 0,
    testsCompleted: testsArr.length,
    temasExplored: temas.size,
    avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    rachaActual: (p.racha_actual as number) ?? 0,
    lastTestDate: lastTest,
    totalSpent,
    purchases: purchasesArr.map(c => ({ tipo: c.tipo, amount: c.amount_paid / 100, date: c.created_at })),
  }
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export async function getUserTimeline(userId: string, limit = 50): Promise<TimelineEvent[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const [profileRes, testsRes, comprasRes, analysisRes, supuestosRes] = await Promise.all([
    supabase.from('profiles').select('created_at').eq('id', userId).single(),
    supabase.from('tests_generados')
      .select('id, created_at, completado, puntuacion, tipo, prompt_version, temas(titulo)')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
    supabase.from('compras')
      .select('created_at, tipo, amount_paid')
      .eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('api_usage_log')
      .select('timestamp, endpoint, cost_estimated_cents')
      .eq('user_id', userId)
      .in('endpoint', ['explain-errores-stream', 'explain-errores', 'correct-desarrollo', 'informe-simulacro-stream'])
      .order('timestamp', { ascending: false }).limit(20),
    supabase.from('supuestos_practicos')
      .select('created_at, completado, puntuacion_total')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ])

  const events: TimelineEvent[] = []

  // Registration
  if (profileRes.data?.created_at) {
    events.push({
      type: 'register',
      date: profileRes.data.created_at as string,
      detail: 'Se registró en OpoRuta',
    })
  }

  // Tests
  for (const t of (testsRes.data ?? []) as Array<{
    id: string; created_at: string; completado: boolean; puntuacion: number | null;
    tipo: string; prompt_version: string; temas: { titulo: string } | null
  }>) {
    const tema = t.temas?.titulo ?? t.tipo
    const source = t.prompt_version === 'free-bank-1.0' ? 'free bank' : 'IA'
    if (t.completado) {
      events.push({
        type: 'test_completed',
        date: t.created_at,
        detail: `Completó test: ${tema} — ${t.puntuacion ?? '?'}% (${source})`,
        meta: { testId: t.id, score: t.puntuacion, source },
      })
    } else {
      events.push({
        type: 'test',
        date: t.created_at,
        detail: `Generó test: ${tema} (${source}) — no completado`,
        meta: { testId: t.id },
      })
    }
  }

  // Purchases
  for (const c of (comprasRes.data ?? []) as Array<{ created_at: string; tipo: string; amount_paid: number }>) {
    events.push({
      type: 'purchase',
      date: c.created_at,
      detail: `Compró: ${c.tipo} — €${(c.amount_paid / 100).toFixed(2)}`,
      meta: { tipo: c.tipo, amount: c.amount_paid / 100 },
    })
  }

  // Analysis
  for (const a of (analysisRes.data ?? []) as Array<{ timestamp: string; endpoint: string; cost_estimated_cents: number }>) {
    const labels: Record<string, string> = {
      'explain-errores-stream': 'Análisis errores',
      'explain-errores': 'Análisis errores (batch)',
      'correct-desarrollo': 'Corrección desarrollo',
      'informe-simulacro-stream': 'Informe simulacro',
    }
    events.push({
      type: 'analysis',
      date: a.timestamp,
      detail: `${labels[a.endpoint] ?? a.endpoint} — €${(a.cost_estimated_cents / 100).toFixed(3)}`,
    })
  }

  // Supuestos
  for (const s of (supuestosRes.data ?? []) as Array<{ created_at: string; completado: boolean; puntuacion_total: number | null }>) {
    events.push({
      type: 'supuesto',
      date: s.created_at,
      detail: `Supuesto práctico${s.completado ? ` — ${s.puntuacion_total ?? '?'}/50 pts` : ' (en progreso)'}`,
    })
  }

  // Sort by date descending
  events.sort((a, b) => b.date.localeCompare(a.date))
  return events.slice(0, limit)
}
