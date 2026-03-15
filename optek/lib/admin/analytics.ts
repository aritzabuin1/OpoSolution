/**
 * lib/admin/analytics.ts — Admin Analytics Metrics
 *
 * 10 metricas clave para tomar decisiones de negocio:
 *   1. Conversion Free -> Paid
 *   2. DAU/WAU (ultimos 30 dias)
 *   3. Engagement por feature
 *   4. Tasa de abandono (churn 7d)
 *   5. Funnel de onboarding
 *   6. Top temas generados
 *   7. Puntuacion media por tema
 *   8. Uso de creditos de correccion
 *   9. Tests completados vs abandonados
 *  10. Feedback recibido (sugerencias)
 *
 * Todas usan createServiceClient() — bypass RLS — solo llamar desde Server Components admin.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { METRICS_START_DATE, adminIdFilter } from '@/lib/admin/metrics-filter'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversionMetrics {
  totalUsers: number
  freeUsers: number
  paidUsers: number
  conversionPct: number
  avgDaysToConvert: number | null
}

export interface DAUPoint {
  date: string       // 'YYYY-MM-DD'
  activeUsers: number
}

export interface FeatureEngagement {
  feature: string
  count: number
  pct: number
}

export interface ChurnMetrics {
  totalActive: number      // users who did at least 1 test ever
  churned7d: number        // no test in 7+ days
  churnPct: number
  activeNow: number        // test in last 7 days
}

export interface OnboardingFunnel {
  registered: number
  firstTest: number
  secondTest: number
  purchased: number
  pctFirstTest: number
  pctSecondTest: number
  pctPurchased: number
}

export interface TemaPopularity {
  temaId: string
  titulo: string
  count: number
}

export interface TemaScore {
  temaId: string
  titulo: string
  avgScore: number
  testCount: number
}

export interface CorrectionsUsage {
  avgBalance: number
  minBalance: number
  maxBalance: number
  usersWithZero: number
  totalUsers: number
}

export interface CompletionRate {
  total: number
  completed: number
  abandoned: number
  completionPct: number
}

export interface AnalysisUsageByType {
  endpoint: string
  label: string
  count: number
  totalCost: number
}

export interface FeedbackSummary {
  total: number
  byTipo: { tipo: string; count: number }[]
  byEstado: { estado: string; count: number }[]
  recent: { mensaje: string; tipo: string; created_at: string }[]
}

// ─── 1. Conversion Free -> Paid ──────────────────────────────────────────────

export async function getConversionMetrics(adminIds: string[] = []): Promise<ConversionMetrics> {
  const supabase = await createServiceClient() as any
  const excludeAdmins = adminIdFilter(adminIds)

  let profilesQ = supabase.from('profiles').select('id, created_at', { count: 'exact' }).eq('is_admin', false).gte('created_at', METRICS_START_DATE)
  let comprasQ = supabase.from('compras').select('user_id, created_at').gte('created_at', METRICS_START_DATE)
  if (excludeAdmins) comprasQ = comprasQ.not('user_id', 'in', excludeAdmins)

  const [profilesRes, comprasRes] = await Promise.all([profilesQ, comprasQ])

  const profiles = (profilesRes.data ?? []) as { id: string; created_at: string }[]
  const compras = (comprasRes.data ?? []) as { user_id: string; created_at: string }[]

  const paidUserIds = new Set(compras.map((c: { user_id: string }) => c.user_id))
  const totalUsers = profiles.length
  const paidUsers = paidUserIds.size
  const freeUsers = totalUsers - paidUsers
  const conversionPct = totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 1000) / 10 : 0

  // Average days from registration to first purchase
  let avgDaysToConvert: number | null = null
  if (paidUsers > 0) {
    const profileMap = new Map(profiles.map((p: { id: string; created_at: string }) => [p.id, p.created_at]))
    const daysList: number[] = []
    // Group compras by user, take earliest
    const firstPurchase = new Map<string, string>()
    for (const c of compras) {
      const existing = firstPurchase.get(c.user_id)
      if (!existing || c.created_at < existing) {
        firstPurchase.set(c.user_id, c.created_at)
      }
    }
    for (const [userId, purchaseDate] of firstPurchase) {
      const regDate = profileMap.get(userId)
      if (regDate) {
        const days = (new Date(purchaseDate).getTime() - new Date(regDate).getTime()) / (1000 * 60 * 60 * 24)
        daysList.push(Math.max(0, Math.round(days * 10) / 10))
      }
    }
    if (daysList.length > 0) {
      avgDaysToConvert = Math.round((daysList.reduce((a, b) => a + b, 0) / daysList.length) * 10) / 10
    }
  }

  return { totalUsers, freeUsers, paidUsers, conversionPct, avgDaysToConvert }
}

// ─── 2. DAU (Daily Active Users) ultimos 30 dias ────────────────────────────

export async function getDAU30d(adminIds: string[] = []): Promise<DAUPoint[]> {
  const supabase = await createServiceClient() as any
  const excludeAdmins = adminIdFilter(adminIds)
  const thirtyDaysAgo = new Date(Math.max(Date.now() - 30 * 24 * 60 * 60 * 1000, new Date(METRICS_START_DATE).getTime())).toISOString()

  let query = supabase.from('tests_generados').select('user_id, created_at').gte('created_at', thirtyDaysAgo)
  if (excludeAdmins) query = query.not('user_id', 'in', excludeAdmins)
  const { data } = await query

  const rows = (data ?? []) as { user_id: string; created_at: string }[]

  // Group by date, count unique users
  const byDate = new Map<string, Set<string>>()
  for (const r of rows) {
    const date = r.created_at.slice(0, 10)
    if (!byDate.has(date)) byDate.set(date, new Set())
    byDate.get(date)!.add(r.user_id)
  }

  // Fill all 30 days
  const result: DAUPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, activeUsers: byDate.get(key)?.size ?? 0 })
  }
  return result
}

// ─── 3. Engagement por feature ──────────────────────────────────────────────

export async function getFeatureEngagement(adminIds: string[] = []): Promise<FeatureEngagement[]> {
  const supabase = await createServiceClient() as any
  const excludeAdmins = adminIdFilter(adminIds)
  const thirtyDaysAgo = new Date(Math.max(Date.now() - 30 * 24 * 60 * 60 * 1000, new Date(METRICS_START_DATE).getTime())).toISOString()

  let testsQ = supabase.from('tests_generados').select('tipo').gte('created_at', thirtyDaysAgo)
  let cazaQ = supabase.from('cazatrampas_intentos').select('id').gte('created_at', thirtyDaysAgo)
  let flashQ = supabase.from('flashcard_reviews').select('id').gte('created_at', thirtyDaysAgo)
  if (excludeAdmins) {
    testsQ = testsQ.not('user_id', 'in', excludeAdmins)
    cazaQ = cazaQ.not('user_id', 'in', excludeAdmins)
    flashQ = flashQ.not('user_id', 'in', excludeAdmins)
  }

  const [testsRes, cazaRes, flashRes] = await Promise.all([testsQ, cazaQ, flashQ])

  const tests = (testsRes.data ?? []) as { tipo: string }[]
  const testsByTipo = new Map<string, number>()
  for (const t of tests) {
    testsByTipo.set(t.tipo, (testsByTipo.get(t.tipo) ?? 0) + 1)
  }

  const features: { feature: string; count: number }[] = [
    { feature: 'Tests (tema)', count: testsByTipo.get('tema') ?? 0 },
    { feature: 'Psicotecnicos', count: testsByTipo.get('psicotecnico') ?? 0 },
    { feature: 'Simulacros', count: testsByTipo.get('simulacro') ?? 0 },
    { feature: 'Radar', count: testsByTipo.get('radar') ?? 0 },
    { feature: 'Caza-Trampas', count: cazaRes.data?.length ?? 0 },
    { feature: 'Flashcards', count: flashRes.data?.length ?? 0 },
  ]

  const total = features.reduce((a, f) => a + f.count, 0) || 1
  return features
    .map(f => ({ ...f, pct: Math.round((f.count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count)
}

// ─── 4. Tasa de abandono (churn 7d) ─────────────────────────────────────────

export async function getChurnMetrics(adminIds: string[] = []): Promise<ChurnMetrics> {
  const supabase = await createServiceClient() as any
  const excludeAdmins = adminIdFilter(adminIds)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const effectiveStart = new Date(Math.max(new Date(METRICS_START_DATE).getTime(), new Date(sevenDaysAgo).getTime())).toISOString()
  let allQ = supabase.from('tests_generados').select('user_id').gte('created_at', METRICS_START_DATE)
  let recentQ = supabase.from('tests_generados').select('user_id').gte('created_at', effectiveStart)
  if (excludeAdmins) {
    allQ = allQ.not('user_id', 'in', excludeAdmins)
    recentQ = recentQ.not('user_id', 'in', excludeAdmins)
  }

  const [allTestsRes, recentRes] = await Promise.all([allQ, recentQ])

  const allUsers = new Set((allTestsRes.data ?? []).map((t: { user_id: string }) => t.user_id))
  const recentUsers = new Set((recentRes.data ?? []).map((t: { user_id: string }) => t.user_id))

  const totalActive = allUsers.size
  const activeNow = recentUsers.size
  const churned7d = totalActive - activeNow
  const churnPct = totalActive > 0 ? Math.round((churned7d / totalActive) * 1000) / 10 : 0

  return { totalActive, churned7d, churnPct, activeNow }
}

// ─── 5. Funnel de onboarding ────────────────────────────────────────────────

export async function getOnboardingFunnel(adminIds: string[] = []): Promise<OnboardingFunnel> {
  const supabase = await createServiceClient() as any
  const excludeAdmins = adminIdFilter(adminIds)

  let profilesQ = supabase.from('profiles').select('id').eq('is_admin', false).gte('created_at', METRICS_START_DATE)
  let testsQ = supabase.from('tests_generados').select('user_id').eq('completado', true).gte('created_at', METRICS_START_DATE)
  let comprasQ = supabase.from('compras').select('user_id').gte('created_at', METRICS_START_DATE)
  if (excludeAdmins) {
    testsQ = testsQ.not('user_id', 'in', excludeAdmins)
    comprasQ = comprasQ.not('user_id', 'in', excludeAdmins)
  }

  const [profilesRes, testsRes, comprasRes] = await Promise.all([profilesQ, testsQ, comprasQ])

  const registered = profilesRes.data?.length ?? 0
  const testsByUser = new Map<string, number>()
  for (const t of (testsRes.data ?? []) as { user_id: string }[]) {
    testsByUser.set(t.user_id, (testsByUser.get(t.user_id) ?? 0) + 1)
  }

  const firstTest = [...testsByUser.values()].filter(c => c >= 1).length
  const secondTest = [...testsByUser.values()].filter(c => c >= 2).length
  const purchasedUsers = new Set((comprasRes.data ?? []).map((c: { user_id: string }) => c.user_id))
  const purchased = purchasedUsers.size

  return {
    registered,
    firstTest,
    secondTest,
    purchased,
    pctFirstTest: registered > 0 ? Math.round((firstTest / registered) * 1000) / 10 : 0,
    pctSecondTest: registered > 0 ? Math.round((secondTest / registered) * 1000) / 10 : 0,
    pctPurchased: registered > 0 ? Math.round((purchased / registered) * 1000) / 10 : 0,
  }
}

// ─── 6. Top temas generados ─────────────────────────────────────────────────

export async function getTopTemas(limit = 10, adminIds: string[] = []): Promise<TemaPopularity[]> {
  const supabase = await createServiceClient() as any
  const excludeAdmins = adminIdFilter(adminIds)

  let testsQ = supabase.from('tests_generados').select('tema_id').not('tema_id', 'is', null).gte('created_at', METRICS_START_DATE)
  if (excludeAdmins) testsQ = testsQ.not('user_id', 'in', excludeAdmins)

  const [testsRes, temasRes] = await Promise.all([
    testsQ,
    supabase.from('temas').select('id, titulo'),
  ])

  const temaMap = new Map(
    ((temasRes.data ?? []) as { id: string; titulo: string }[]).map(t => [t.id, t.titulo])
  )

  const countByTema = new Map<string, number>()
  for (const t of (testsRes.data ?? []) as { tema_id: string }[]) {
    countByTema.set(t.tema_id, (countByTema.get(t.tema_id) ?? 0) + 1)
  }

  return [...countByTema.entries()]
    .map(([temaId, count]) => ({
      temaId,
      titulo: temaMap.get(temaId) ?? 'Desconocido',
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// ─── 7. Puntuacion media por tema ───────────────────────────────────────────

export async function getTemaScores(limit = 10, adminIds: string[] = []): Promise<TemaScore[]> {
  const supabase = await createServiceClient() as any
  const excludeAdmins = adminIdFilter(adminIds)

  let testsQ = supabase.from('tests_generados').select('tema_id, puntuacion')
    .not('tema_id', 'is', null).not('puntuacion', 'is', null).eq('completado', true).gte('created_at', METRICS_START_DATE)
  if (excludeAdmins) testsQ = testsQ.not('user_id', 'in', excludeAdmins)

  const [testsRes, temasRes] = await Promise.all([
    testsQ,
    supabase.from('temas').select('id, titulo'),
  ])

  const temaMap = new Map(
    ((temasRes.data ?? []) as { id: string; titulo: string }[]).map(t => [t.id, t.titulo])
  )

  const scoresByTema = new Map<string, number[]>()
  for (const t of (testsRes.data ?? []) as { tema_id: string; puntuacion: number }[]) {
    if (!scoresByTema.has(t.tema_id)) scoresByTema.set(t.tema_id, [])
    scoresByTema.get(t.tema_id)!.push(t.puntuacion)
  }

  return [...scoresByTema.entries()]
    .map(([temaId, scores]) => ({
      temaId,
      titulo: temaMap.get(temaId) ?? 'Desconocido',
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      testCount: scores.length,
    }))
    .sort((a, b) => a.avgScore - b.avgScore) // peor primero
    .slice(0, limit)
}

// ─── 8. Uso de creditos de correccion ───────────────────────────────────────

export async function getCorrectionsUsage(): Promise<CorrectionsUsage> {
  const supabase = await createServiceClient() as any

  const { data } = await supabase
    .from('profiles')
    .select('corrections_balance')
    .eq('is_admin', false)
    .gte('created_at', METRICS_START_DATE)

  const profiles = (data ?? []) as { corrections_balance: number }[]
  if (profiles.length === 0) {
    return { avgBalance: 0, minBalance: 0, maxBalance: 0, usersWithZero: 0, totalUsers: 0 }
  }

  const balances = profiles.map(p => p.corrections_balance ?? 0)
  return {
    avgBalance: Math.round((balances.reduce((a, b) => a + b, 0) / balances.length) * 10) / 10,
    minBalance: Math.min(...balances),
    maxBalance: Math.max(...balances),
    usersWithZero: balances.filter(b => b <= 0).length,
    totalUsers: profiles.length,
  }
}

// ─── 9. Tests completados vs abandonados ────────────────────────────────────

export async function getCompletionRate(adminIds: string[] = []): Promise<CompletionRate> {
  const supabase = await createServiceClient() as any
  const excludeAdmins = adminIdFilter(adminIds)

  let completedQ = supabase.from('tests_generados').select('id', { count: 'exact', head: true }).eq('completado', true).gte('created_at', METRICS_START_DATE)
  let allQ = supabase.from('tests_generados').select('id', { count: 'exact', head: true }).gte('created_at', METRICS_START_DATE)
  if (excludeAdmins) {
    completedQ = completedQ.not('user_id', 'in', excludeAdmins)
    allQ = allQ.not('user_id', 'in', excludeAdmins)
  }

  const [completedRes, allRes] = await Promise.all([completedQ, allQ])

  const completed = completedRes.count ?? 0
  const total = allRes.count ?? 0
  const abandoned = total - completed

  return {
    total,
    completed,
    abandoned,
    completionPct: total > 0 ? Math.round((completed / total) * 1000) / 10 : 0,
  }
}

// ─── 10. Feedback recibido (sugerencias) ────────────────────────────────────

export async function getFeedbackSummary(): Promise<FeedbackSummary> {
  const supabase = await createServiceClient() as any

  const { data, count } = await supabase
    .from('sugerencias')
    .select('tipo, estado, mensaje, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (data ?? []) as { tipo: string; estado: string; mensaje: string; created_at: string }[]
  const total = count ?? rows.length

  // Group by tipo
  const tipoCount = new Map<string, number>()
  const estadoCount = new Map<string, number>()
  for (const r of rows) {
    tipoCount.set(r.tipo, (tipoCount.get(r.tipo) ?? 0) + 1)
    estadoCount.set(r.estado, (estadoCount.get(r.estado) ?? 0) + 1)
  }

  return {
    total,
    byTipo: [...tipoCount.entries()].map(([tipo, count]) => ({ tipo, count })),
    byEstado: [...estadoCount.entries()].map(([estado, count]) => ({ estado, count })),
    recent: rows.slice(0, 5).map(r => ({ mensaje: r.mensaje, tipo: r.tipo, created_at: r.created_at })),
  }
}

// ─── 11. Uso de análisis detallados por tipo ─────────────────────────────────

const ANALYSIS_ENDPOINTS: Record<string, string> = {
  'explain-errores-stream': 'Explicar errores (simulacro)',
  'explain-errores': 'Explicar errores (batch)',
  'correct-desarrollo': 'Corrector desarrollo',
  'analyze-cazatrampas-stream': 'Análisis caza-trampas',
  'explain-flashcard-stream': 'Explicación flashcard',
  'informe-simulacro-stream': 'Informe simulacro',
}

export async function getAnalysisUsageByType(adminIds: string[] = []): Promise<AnalysisUsageByType[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const excludeAdmins = adminIdFilter(adminIds)

  const endpoints = Object.keys(ANALYSIS_ENDPOINTS)
  let query = supabase.from('api_usage_log').select('endpoint, cost_estimated_cents').in('endpoint', endpoints).gte('timestamp', METRICS_START_DATE)
  if (excludeAdmins) query = query.not('user_id', 'in', excludeAdmins)
  const { data } = await query

  const rows = (data ?? []) as { endpoint: string; cost_estimated_cents: number }[]

  const grouped = new Map<string, { count: number; totalCost: number }>()
  for (const r of rows) {
    const curr = grouped.get(r.endpoint) ?? { count: 0, totalCost: 0 }
    curr.count++
    curr.totalCost += r.cost_estimated_cents
    grouped.set(r.endpoint, curr)
  }

  return endpoints
    .map(ep => ({
      endpoint: ep,
      label: ANALYSIS_ENDPOINTS[ep],
      count: grouped.get(ep)?.count ?? 0,
      totalCost: Math.round((grouped.get(ep)?.totalCost ?? 0)) / 100,
    }))
    .sort((a, b) => b.count - a.count)
}
