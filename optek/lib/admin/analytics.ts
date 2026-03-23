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
 * Cached with unstable_cache (120s revalidation).
 */

import { createServiceClient } from '@/lib/supabase/server'
import { METRICS_START_DATE, adminIdFilter, getAdminUserIds } from '@/lib/admin/metrics-filter'
import { getDashboardPhase } from '@/lib/utils/dashboard-phase'

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
  tourCompletionRate: number
  tourCompleted: number
}

export interface DashboardPhaseDistribution {
  new: number
  starting: number
  active: number
  lapsed: number
  total: number
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

async function _getConversionMetrics(): Promise<ConversionMetrics> {
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
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

export const getConversionMetrics = _getConversionMetrics

// ─── 2. DAU (Daily Active Users) ultimos 30 dias ────────────────────────────

async function _getDAU30d(): Promise<DAUPoint[]> {
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
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

export const getDAU30d = _getDAU30d

// ─── 3. Engagement por feature ──────────────────────────────────────────────

async function _getFeatureEngagement(): Promise<FeatureEngagement[]> {
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
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

export const getFeatureEngagement = _getFeatureEngagement

// ─── 4. Tasa de abandono (churn 7d) ─────────────────────────────────────────

async function _getChurnMetrics(): Promise<ChurnMetrics> {
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
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

export const getChurnMetrics = _getChurnMetrics

// ─── 5. Funnel de onboarding ────────────────────────────────────────────────

async function _getOnboardingFunnel(): Promise<OnboardingFunnel> {
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
  const excludeAdmins = adminIdFilter(adminIds)

  let profilesQ = supabase.from('profiles').select('id, onboarding_completed_at').eq('is_admin', false).gte('created_at', METRICS_START_DATE)
  let testsQ = supabase.from('tests_generados').select('user_id').eq('completado', true).gte('created_at', METRICS_START_DATE)
  let comprasQ = supabase.from('compras').select('user_id').gte('created_at', METRICS_START_DATE)
  if (excludeAdmins) {
    testsQ = testsQ.not('user_id', 'in', excludeAdmins)
    comprasQ = comprasQ.not('user_id', 'in', excludeAdmins)
  }

  const [profilesRes, testsRes, comprasRes] = await Promise.all([profilesQ, testsQ, comprasQ])

  const profiles = (profilesRes.data ?? []) as { id: string; onboarding_completed_at: string | null }[]
  const registered = profiles.length
  const tourCompleted = profiles.filter(p => p.onboarding_completed_at !== null).length
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
    tourCompleted,
    tourCompletionRate: registered > 0 ? Math.round((tourCompleted / registered) * 1000) / 10 : 0,
  }
}

export const getOnboardingFunnel = _getOnboardingFunnel

// ─── 6. Top temas generados ─────────────────────────────────────────────────

async function _getTopTemas(limit = 10): Promise<TemaPopularity[]> {
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
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

  // Agrupar por titulo para unificar C1+C2 que comparten nombre de tema
  const countByTitulo = new Map<string, { temaId: string; count: number }>()
  for (const t of (testsRes.data ?? []) as { tema_id: string }[]) {
    const titulo = temaMap.get(t.tema_id) ?? 'Desconocido'
    const existing = countByTitulo.get(titulo)
    if (existing) {
      existing.count += 1
    } else {
      countByTitulo.set(titulo, { temaId: t.tema_id, count: 1 })
    }
  }

  return [...countByTitulo.entries()]
    .map(([titulo, { temaId, count }]) => ({
      temaId,
      titulo,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export const getTopTemas = _getTopTemas

// ─── 7. Puntuacion media por tema ───────────────────────────────────────────

async function _getTemaScores(limit = 10): Promise<TemaScore[]> {
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
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

  // Agrupar por titulo para unificar C1+C2 que comparten nombre de tema
  const scoresByTitulo = new Map<string, { temaId: string; scores: number[] }>()
  for (const t of (testsRes.data ?? []) as { tema_id: string; puntuacion: number }[]) {
    const titulo = temaMap.get(t.tema_id) ?? 'Desconocido'
    const existing = scoresByTitulo.get(titulo)
    if (existing) {
      existing.scores.push(t.puntuacion)
    } else {
      scoresByTitulo.set(titulo, { temaId: t.tema_id, scores: [t.puntuacion] })
    }
  }

  return [...scoresByTitulo.entries()]
    .map(([titulo, { temaId, scores }]) => ({
      temaId,
      titulo,
      avgScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
      testCount: scores.length,
    }))
    .sort((a, b) => a.avgScore - b.avgScore) // peor primero
    .slice(0, limit)
}

export const getTemaScores = _getTemaScores

// ─── 8. Uso de creditos de correccion ───────────────────────────────────────

async function _getCorrectionsUsage(): Promise<CorrectionsUsage> {
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

export const getCorrectionsUsage = _getCorrectionsUsage

// ─── 9. Tests completados vs abandonados ────────────────────────────────────

async function _getCompletionRate(): Promise<CompletionRate> {
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
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

export const getCompletionRate = _getCompletionRate

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

async function _getAnalysisUsageByType(): Promise<AnalysisUsageByType[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
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

export const getAnalysisUsageByType = _getAnalysisUsageByType

// ─── 11b. CTA Funnel: views vs clicks on analysis CTAs ─────────────────────────

export interface CtaFunnelItem {
  feature: string
  views: number
  clicks: number
  clickRate: number
}

const CTA_PAIRS: { feature: string; viewEvent: string; clickEvent: string }[] = [
  { feature: 'Explicar errores', viewEvent: 'view:analysis-cta', clickEvent: 'click:analysis-cta' },
  { feature: 'Informe simulacro', viewEvent: 'view:informe-simulacro-cta', clickEvent: 'click:informe-simulacro-cta' },
  { feature: 'Caza-trampas', viewEvent: 'view:cazatrampas-analysis-cta', clickEvent: 'click:cazatrampas-analysis-cta' },
  { feature: 'Flashcard', viewEvent: 'view:flashcard-analysis-cta', clickEvent: 'click:flashcard-analysis-cta' },
]

async function _getCtaFunnel(): Promise<CtaFunnelItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
  const excludeAdmins = adminIdFilter(adminIds)

  const allEvents = CTA_PAIRS.flatMap(p => [p.viewEvent, p.clickEvent])
  let query = supabase.from('api_usage_log').select('endpoint').in('endpoint', allEvents).gte('timestamp', METRICS_START_DATE)
  if (excludeAdmins) query = query.not('user_id', 'in', excludeAdmins)
  const { data } = await query

  const counts = new Map<string, number>()
  for (const r of (data ?? []) as { endpoint: string }[]) {
    counts.set(r.endpoint, (counts.get(r.endpoint) ?? 0) + 1)
  }

  return CTA_PAIRS.map(({ feature, viewEvent, clickEvent }) => {
    const views = counts.get(viewEvent) ?? 0
    const clicks = counts.get(clickEvent) ?? 0
    return { feature, views, clicks, clickRate: views > 0 ? Math.round((clicks / views) * 100) : 0 }
  })
}

export const getCtaFunnel = _getCtaFunnel

// ─── 12. Dashboard Phase Distribution ──────────────────────────────────────────

async function _getDashboardPhaseDistribution(): Promise<DashboardPhaseDistribution> {
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
  const excludeAdmins = adminIdFilter(adminIds)

  // Get all non-admin profiles
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', false)
    .gte('created_at', METRICS_START_DATE)

  const profiles = (profilesData ?? []) as { id: string }[]
  const total = profiles.length

  if (total === 0) {
    return { new: 0, starting: 0, active: 0, lapsed: 0, total: 0 }
  }

  // Get all tests for these users (need count per user + last test date)
  let testsQ = supabase.from('tests_generados').select('user_id, created_at').eq('completado', true).gte('created_at', METRICS_START_DATE)
  if (excludeAdmins) testsQ = testsQ.not('user_id', 'in', excludeAdmins)
  const { data: testsData } = await testsQ

  const tests = (testsData ?? []) as { user_id: string; created_at: string }[]

  // Build per-user stats: totalTests, last test date
  const userStats = new Map<string, { totalTests: number; lastTestDate: string }>()
  for (const t of tests) {
    const existing = userStats.get(t.user_id)
    if (existing) {
      existing.totalTests++
      if (t.created_at > existing.lastTestDate) existing.lastTestDate = t.created_at
    } else {
      userStats.set(t.user_id, { totalTests: 1, lastTestDate: t.created_at })
    }
  }

  // Calculate racha (streak) — simplified: if last test was today or yesterday, rachaActual=1, else 0
  // getDashboardPhase only cares if rachaActual === 0 for lapsed detection
  const distribution: DashboardPhaseDistribution = { new: 0, starting: 0, active: 0, lapsed: 0, total }

  for (const profile of profiles) {
    const stats = userStats.get(profile.id)
    const totalTests = stats?.totalTests ?? 0
    const lastTestDate = stats?.lastTestDate?.slice(0, 10) ?? null

    // rachaActual: 0 if no recent test (simplified — full racha calc not needed for phase)
    let rachaActual = 0
    if (lastTestDate) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastTestDate).getTime()) / (1000 * 60 * 60 * 24),
      )
      if (daysSince <= 1) rachaActual = 1
    }

    const phase = getDashboardPhase(totalTests, rachaActual, lastTestDate)
    distribution[phase]++
  }

  return distribution
}

export const getDashboardPhaseDistribution = _getDashboardPhaseDistribution

// ─── 13. Device Distribution ─────────────────────────────────────────────────

export interface DeviceDistribution {
  mobile: number
  tablet: number
  desktop: number
  totalRequests: number
  mobilePct: number
}

export async function getDeviceDistribution(): Promise<DeviceDistribution> {
  const supabase = await createServiceClient()

  // Last 30 days of API usage, grouped by device_type
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const adminIds = await getAdminUserIds()

  const { data, error } = await (supabase as any)
    .from('api_usage_log')
    .select('device_type')
    .gte('timestamp', since)
    .not('user_id', 'is', null)

  if (error || !data) {
    return { mobile: 0, tablet: 0, desktop: 0, totalRequests: 0, mobilePct: 0 }
  }

  // Filter out admin users
  const filtered = data.filter((r: { user_id?: string }) => !adminIds.includes(r.user_id ?? ''))

  const counts = { mobile: 0, tablet: 0, desktop: 0 }
  for (const row of filtered) {
    const dt = (row as { device_type?: string }).device_type ?? 'desktop'
    if (dt in counts) counts[dt as keyof typeof counts]++
  }

  const total = counts.mobile + counts.tablet + counts.desktop
  return {
    ...counts,
    totalRequests: total,
    mobilePct: total > 0 ? Math.round((counts.mobile / total) * 100) : 0,
  }
}

// ─── 14. Desglose por Oposición ──────────────────────────────────────────────

export interface OposicionBreakdown {
  oposicion: string
  slug: string
  usuarios: number
  pagados: number
  conversionPct: number
  tests: number
  notaMedia: number | null
  revenue: number
}

async function _getOposicionBreakdown(): Promise<OposicionBreakdown[]> {
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any

  // All oposiciones (including inactive, for admin visibility)
  const { data: oposiciones } = await sb
    .from('oposiciones')
    .select('id, nombre, slug')
    .order('nombre')

  if (!oposiciones || oposiciones.length === 0) return []

  const results: OposicionBreakdown[] = []

  for (const opo of oposiciones) {
    const opoId = opo.id as string

    // Users registered for this oposición
    const { count: usuarios } = await sb
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('oposicion_id', opoId)
      .eq('is_admin', false)

    // Paid users (have at least 1 compra for this oposición)
    const { count: pagados } = await sb
      .from('compras')
      .select('user_id', { count: 'exact', head: true })
      .eq('oposicion_id', opoId)

    // Tests generated for this oposición
    const { data: testsData } = await sb
      .from('tests_generados')
      .select('puntuacion')
      .eq('oposicion_id', opoId)
      .eq('completado', true)

    const tests = testsData?.length ?? 0
    const scores = (testsData ?? [])
      .map((t: { puntuacion: number | null }) => t.puntuacion)
      .filter((s: number | null): s is number => s !== null)
    const notaMedia = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : null

    // Revenue for this oposición
    const { data: revenueData } = await sb
      .from('compras')
      .select('amount_paid')
      .eq('oposicion_id', opoId)

    const revenue = (revenueData ?? [])
      .reduce((sum: number, c: { amount_paid: number | null }) => sum + ((c.amount_paid ?? 0) / 100), 0)

    const totalUsuarios = usuarios ?? 0
    const totalPagados = pagados ?? 0

    results.push({
      oposicion: opo.nombre as string,
      slug: opo.slug as string,
      usuarios: totalUsuarios,
      pagados: totalPagados,
      conversionPct: totalUsuarios > 0 ? Math.round((totalPagados / totalUsuarios) * 100) : 0,
      tests,
      notaMedia,
      revenue: Math.round(revenue * 100) / 100,
    })
  }

  return results
}

export const getOposicionBreakdown = _getOposicionBreakdown
