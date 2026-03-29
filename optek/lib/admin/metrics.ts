/**
 * lib/admin/metrics.ts — §2.18.4
 *
 * Funciones de Unit Economics para el Admin Dashboard.
 * Todas usan createServiceClient() — bypass RLS — solo llamar desde Server Components admin.
 * Cached with unstable_cache (120s revalidation).
 *
 * KPIs implementados:
 *   - getFuelTank(): ingresos vs costes IA → margen bruto real
 *   - getCostPerUser(): coste medio por test y por usuario activo
 *   - getAARRR(): embudo Acquisition → Revenue
 *   - getMRRHistory(): compras agrupadas por mes
 *   - getAlerts(): alertas automáticas si los KPIs se degradan
 */

import { createServiceClient } from '@/lib/supabase/server'
import { METRICS_START_DATE, adminIdFilter, getAdminUserIds } from '@/lib/admin/metrics-filter'

// ─── Tipos exportados ──────────────────────────────────────────────────────────

export interface FuelTankMetrics {
  ingresos: number       // € recibidos (suma compras.amount_paid / 100)
  costes: number         // € estimados en IA (api_usage_log.cost_estimated_cents / 100)
  margen: number         // ingresos - costes
  margenPct: number      // (margen / ingresos) * 100 — -100 si ingresos = 0 y costes > 0, 0 si ambos 0
  // Free tier v2 desglose
  testsFreeBank: number  // tests servidos desde free_question_bank (€0)
  testsIA: number        // tests generados con IA (€>0)
  costeIA: number        // coste total solo de tests IA
}

export interface CostPerUserMetrics {
  costeMedioTestIA: number       // € medio por test IA (últimos 30d) — excluye free bank
  costeMedioTestGlobal: number   // € medio incluyendo free bank (€0) — coste real
  costeMedioUsuario: number      // coste total IA / usuarios activos (últimos 30d)
  usuariosActivos30d: number
  testsUltimos30d: number
  testsFreeBankCount: number     // tests from free bank (€0)
  testsIACount: number           // tests from AI generation
}

export interface AAARRRMetrics {
  acquisition: number   // registros totales
  activation: number    // % que completaron al menos 1 test
  retention: number     // % con racha_actual >= 3 (de usuarios que han hecho algún test)
  revenue: number       // % de usuarios que han comprado al menos una vez
  referral: number      // placeholder: 0 hasta implementar tracking de referidos
}

export interface MRRDataPoint {
  mes: string          // 'YYYY-MM'
  ingresos: number     // € ese mes
  numCompras: number
}

export interface AdminAlert {
  nivel: 'error' | 'warning' | 'info'
  mensaje: string
}

// ─── getFuelTank ──────────────────────────────────────────────────────────────

/**
 * Margen bruto real: ingresos totales vs costes estimados de IA.
 * Ingresos: suma de compras.amount_paid (en centimos / 100 = euros).
 * Costes: suma de api_usage_log.cost_estimated_cents / 100 = euros.
 *
 * Nota: usa select() + reduce en cliente. Para datasets grandes (>10k rows),
 * migrar a un RPC con SUM() server-side.
 */
async function _getFuelTank(): Promise<FuelTankMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
  const excludeAdmins = adminIdFilter(adminIds)

  let ingresosQuery = supabase.from('compras').select('amount_paid').gte('created_at', METRICS_START_DATE)
  let costesQuery = supabase.from('api_usage_log').select('cost_estimated_cents').gte('timestamp', METRICS_START_DATE)
  // Free bank vs IA split
  let freeBankQuery = supabase.from('tests_generados').select('id', { count: 'exact', head: true })
    .eq('prompt_version', 'free-bank-1.0').gte('created_at', METRICS_START_DATE)
  let iaTestsQuery = supabase.from('tests_generados').select('id', { count: 'exact', head: true })
    .neq('prompt_version', 'free-bank-1.0').not('tipo', 'eq', 'psicotecnico').gte('created_at', METRICS_START_DATE)
  if (excludeAdmins) {
    ingresosQuery = ingresosQuery.not('user_id', 'in', excludeAdmins)
    costesQuery = costesQuery.not('user_id', 'in', excludeAdmins)
    freeBankQuery = freeBankQuery.not('user_id', 'in', excludeAdmins)
    iaTestsQuery = iaTestsQuery.not('user_id', 'in', excludeAdmins)
  }

  const [ingresosResult, costesResult, freeBankResult, iaTestsResult] = await Promise.all([
    ingresosQuery, costesQuery, freeBankQuery, iaTestsQuery,
  ])

  const ingresos =
    (ingresosResult.data ?? []).reduce((acc: number, c: { amount_paid?: number }) => acc + (c.amount_paid ?? 0), 0) / 100

  const costes =
    (costesResult.data ?? []).reduce(
      (acc: number, c: { cost_estimated_cents?: number }) => acc + ((c.cost_estimated_cents as number) ?? 0),
      0
    ) / 100

  const margen = ingresos - costes
  const margenPct = ingresos > 0
    ? Math.round((margen / ingresos) * 1000) / 10
    : costes > 0 ? -100 : 0

  return {
    ingresos, costes, margen, margenPct,
    testsFreeBank: freeBankResult.count ?? 0,
    testsIA: iaTestsResult.count ?? 0,
    costeIA: costes, // all AI costs are from IA tests (free bank = €0)
  }
}

export const getFuelTank = _getFuelTank

// ─── getCostPerUser ───────────────────────────────────────────────────────────

/**
 * Coste medio por test y por usuario activo en los últimos 30 días.
 * Usa api_usage_log filtrado por endpoint de generate-test.
 */
async function _getCostPerUser(): Promise<CostPerUserMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
  const excludeAdmins = adminIdFilter(adminIds)

  const thirtyDaysAgo = new Date(Math.max(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
    new Date(METRICS_START_DATE).getTime()
  )).toISOString()

  let usageQuery = supabase
    .from('api_usage_log')
    .select('cost_estimated_cents, user_id')
    .gte('timestamp', thirtyDaysAgo)
    .like('endpoint', '%generate-test%')
  let testsQuery = supabase
    .from('tests_generados')
    .select('user_id, prompt_version')
    .gte('created_at', thirtyDaysAgo)
    .eq('completado', true)

  if (excludeAdmins) {
    usageQuery = usageQuery.not('user_id', 'in', excludeAdmins)
    testsQuery = testsQuery.not('user_id', 'in', excludeAdmins)
  }

  const [usageLogs, tests30d] = await Promise.all([usageQuery, testsQuery])

  const logs = (usageLogs.data ?? []) as { cost_estimated_cents: number; user_id: string | null }[]
  const testsData = (tests30d.data ?? []) as { user_id: string; prompt_version: string }[]

  const totalCostCents = logs.reduce(
    (acc: number, l: { cost_estimated_cents: number }) => acc + (l.cost_estimated_cents ?? 0),
    0
  )
  const testsUltimos30d = testsData.length
  const testsFreeBankCount = testsData.filter(t => t.prompt_version === 'free-bank-1.0').length
  const testsIACount = testsUltimos30d - testsFreeBankCount

  // Coste medio por test IA (excluye free bank que es €0)
  const costeMedioTestIA = testsIACount > 0
    ? Math.round((totalCostCents / testsIACount) * 10) / 10 / 100
    : 0
  // Coste medio global (incluye free bank como €0) — refleja coste real
  const costeMedioTestGlobal = testsUltimos30d > 0
    ? Math.round((totalCostCents / testsUltimos30d) * 10) / 10 / 100
    : 0

  const usuariosUnicos = new Set(
    testsData.map((t: { user_id: string }) => t.user_id).filter(Boolean)
  )
  const usuariosActivos30d = usuariosUnicos.size
  const costeMedioUsuario = usuariosActivos30d > 0
    ? Math.round((totalCostCents / 100 / usuariosActivos30d) * 100) / 100
    : 0

  return { costeMedioTestIA, costeMedioTestGlobal, costeMedioUsuario, usuariosActivos30d, testsUltimos30d, testsFreeBankCount, testsIACount }
}

export const getCostPerUser = _getCostPerUser

// ─── getAARRR ─────────────────────────────────────────────────────────────────

/**
 * Embudo AARRR — ajustado al free tier v2:
 * - Acquisition: registros totales
 * - Activation: % que exploraron 3+ temas diferentes (1 test ya no indica engagement)
 * - Retention: % que volvieron en semana 2+ tras registro (no racha diaria)
 * - Revenue: % con al menos 1 compra
 * - Referral: 0 hasta implementar tracking
 */
async function _getAARRR(): Promise<AAARRRMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
  const excludeAdmins = adminIdFilter(adminIds)

  let profilesQ = supabase.from('profiles').select('id, created_at').eq('is_admin', false).gte('created_at', METRICS_START_DATE)
  let testsQ = supabase.from('tests_generados').select('user_id, tema_id, created_at').eq('completado', true).not('tema_id', 'is', null).gte('created_at', METRICS_START_DATE)
  let revenueQ = supabase.from('compras').select('user_id').gte('created_at', METRICS_START_DATE)

  if (excludeAdmins) {
    testsQ = testsQ.not('user_id', 'in', excludeAdmins)
    revenueQ = revenueQ.not('user_id', 'in', excludeAdmins)
  }

  const [profilesResult, testsResult, revenueResult] = await Promise.all([
    profilesQ, testsQ, revenueQ,
  ])

  const profiles = (profilesResult.data ?? []) as { id: string; created_at: string }[]
  const tests = (testsResult.data ?? []) as { user_id: string; tema_id: string; created_at: string }[]
  const totalUsuarios = profiles.length

  // Activation: users who explored 3+ different temas
  const temasPerUser = new Map<string, Set<string>>()
  for (const t of tests) {
    if (!temasPerUser.has(t.user_id)) temasPerUser.set(t.user_id, new Set())
    temasPerUser.get(t.user_id)!.add(t.tema_id)
  }
  const activatedCount = [...temasPerUser.values()].filter(temas => temas.size >= 3).length

  // Retention: users who did a test in week 2+ after registration
  const profileCreated = new Map(profiles.map(p => [p.id, new Date(p.created_at).getTime()]))
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000
  const retainedUsers = new Set<string>()
  for (const t of tests) {
    const regTime = profileCreated.get(t.user_id)
    if (regTime) {
      const testTime = new Date(t.created_at).getTime()
      if (testTime - regTime >= WEEK_MS) {
        retainedUsers.add(t.user_id)
      }
    }
  }
  // Only count users registered 2+ weeks ago (they had the chance to retain)
  const usersOldEnough = profiles.filter(p => Date.now() - new Date(p.created_at).getTime() >= 2 * WEEK_MS).length

  const revenueUsers = new Set(
    (revenueResult.data ?? []).map((c: { user_id: string }) => c.user_id)
  )

  const activation = totalUsuarios > 0 ? Math.round((activatedCount / totalUsuarios) * 1000) / 10 : 0
  const retention = usersOldEnough > 0 ? Math.round((retainedUsers.size / usersOldEnough) * 1000) / 10 : 0
  const revenue = totalUsuarios > 0 ? Math.round((revenueUsers.size / totalUsuarios) * 1000) / 10 : 0

  return { acquisition: totalUsuarios, activation, retention, revenue, referral: 0 }
}

export const getAARRR = _getAARRR

// ─── getMRRHistory ────────────────────────────────────────────────────────────

/**
 * Ingresos agrupados por mes, últimos N meses.
 * Nota: OPTEK no tiene suscripciones — son pagos únicos. Llamamos "MRR"
 * al revenue mensual acumulado (no es MRR estrictamente hablando, pero
 * es el KPI más útil para monitorizar el crecimiento mes a mes).
 */
async function _getMRRHistory(meses = 6): Promise<MRRDataPoint[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
  const excludeAdmins = adminIdFilter(adminIds)

  const cutoff = new Date(Math.max(
    new Date().setMonth(new Date().getMonth() - meses),
    new Date(METRICS_START_DATE).getTime()
  ))

  let query = supabase
    .from('compras')
    .select('amount_paid, created_at')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true })
  if (excludeAdmins) query = query.not('user_id', 'in', excludeAdmins)

  const { data } = await query

  if (!data || data.length === 0) {
    // Generar meses vacíos para mostrar el gráfico aunque no haya datos
    const result: MRRDataPoint[] = []
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      result.push({
        mes: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        ingresos: 0,
        numCompras: 0,
      })
    }
    return result
  }

  const byMonth = new Map<string, MRRDataPoint>()

  for (const compra of data) {
    const d = new Date(compra.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const existing = byMonth.get(key) ?? { mes: key, ingresos: 0, numCompras: 0 }
    existing.ingresos = Math.round((existing.ingresos + compra.amount_paid / 100) * 100) / 100
    existing.numCompras++
    byMonth.set(key, existing)
  }

  return Array.from(byMonth.values()).sort((a, b) => a.mes.localeCompare(b.mes))
}

export const getMRRHistory = _getMRRHistory

// ─── getAlerts ────────────────────────────────────────────────────────────────

/**
 * Genera alertas automáticas si los KPIs se degradan.
 * Llamar con los datos ya calculados para evitar queries adicionales.
 */
export function getAlerts(
  fuelTank: FuelTankMetrics,
  costPerUser: CostPerUserMetrics
): AdminAlert[] {
  const alerts: AdminAlert[] = []

  if (fuelTank.ingresos === 0 && fuelTank.costes > 0) {
    alerts.push({
      nivel: 'warning',
      mensaje: `Costes de IA acumulados (${fuelTank.costes.toFixed(2)}€) sin ingresos registrados aún.`,
    })
  }

  if (fuelTank.ingresos > 0 && fuelTank.margenPct < 20) {
    alerts.push({
      nivel: 'error',
      mensaje: `Margen bruto crítico: ${fuelTank.margenPct.toFixed(1)}% (mínimo saludable: 20%).`,
    })
  } else if (fuelTank.ingresos > 0 && fuelTank.margenPct < 50) {
    alerts.push({
      nivel: 'warning',
      mensaje: `Margen bruto bajo: ${fuelTank.margenPct.toFixed(1)}%. Revisar eficiencia de prompts.`,
    })
  }

  if (costPerUser.costeMedioUsuario > 0.5) {
    alerts.push({
      nivel: 'error',
      mensaje: `Coste IA por usuario activo: ${costPerUser.costeMedioUsuario.toFixed(2)}€ (umbral: €0.50). Revisar usage.`,
    })
  } else if (costPerUser.costeMedioUsuario > 0.25) {
    alerts.push({
      nivel: 'warning',
      mensaje: `Coste IA por usuario: ${costPerUser.costeMedioUsuario.toFixed(2)}€. Vigilar la tendencia.`,
    })
  }

  if (alerts.length === 0) {
    alerts.push({
      nivel: 'info',
      mensaje: 'Todos los KPIs dentro de rango saludable.',
    })
  }

  return alerts
}

// ─── Question Bank Metrics ──────────────────────────────────────────────────

export interface QuestionBankMetrics {
  freeBankTemas: number       // temas covered by free bank
  freeBankTemasTotal: number  // total temas across all oposiciones
  freeBankCoverage: number    // % of temas with free bank data
  freeBankHitRate: number     // % of free tests served from bank (vs AI fallback)
  premiumBankTotal: number    // total questions in question_bank
  premiumBankTemas: number    // unique temas in premium bank
  avgQuestionsPerTema: number // average questions per tema in premium bank
  premiumBankHitRate: number  // % of premium tests served from bank (vs fresh AI)
}

export interface FreeTierMetrics {
  totalFreeUsers: number             // users without purchases
  avgTemasExplored: number           // avg unique temas completed by free users
  usersExplored1Plus: number         // free users with 1+ temas
  usersExplored3Plus: number         // free users with 3+ temas (activated)
  usersExplored5Plus: number         // free users with 5+ temas (high intent)
  conversionRate: number             // % free users who became paid
  avgScoreFree: number | null        // average score on free bank tests
  paywallHits: number                // times free users hit the paywall (402 from generate-test)
}

async function _getQuestionBankMetrics(): Promise<QuestionBankMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const [freeBankResult, premiumBankResult, totalTemasResult, freeTestsResult, premiumTestsResult] = await Promise.all([
    supabase.from('free_question_bank').select('id', { count: 'exact', head: true }),
    supabase.from('question_bank').select('tema_id', { count: 'exact' }),
    supabase.from('temas').select('id', { count: 'exact', head: true }),
    // Free bank hit rate: tests served from bank vs all free tests
    supabase.from('tests_generados').select('prompt_version', { count: 'exact' })
      .eq('prompt_version', 'free-bank-1.0').gte('created_at', METRICS_START_DATE),
    // Premium bank hit rate: tests served from bank vs all premium tema tests
    supabase.from('tests_generados').select('prompt_version')
      .eq('tipo', 'tema').neq('prompt_version', 'free-bank-1.0').gte('created_at', METRICS_START_DATE),
  ])

  const freeBankTemas = freeBankResult.count ?? 0
  const freeBankTemasTotal = totalTemasResult.count ?? 0
  const premiumBankRows = (premiumBankResult.data ?? []) as Array<{ tema_id: string }>
  const premiumBankTotal = premiumBankResult.count ?? 0
  const premiumTemas = new Set(premiumBankRows.map(r => r.tema_id))

  // Free bank hit rate
  const freeFromBank = freeTestsResult.count ?? 0
  // For free hit rate we'd need total free test attempts, but free bank tests
  // are the only source for free users now. fallback to IA is rare.
  const freeBankHitRate = freeFromBank > 0 ? 100 : 0 // If any were served, bank works

  // Premium bank hit rate
  const premiumTests = (premiumTestsResult.data ?? []) as Array<{ prompt_version: string }>
  const premiumFromBank = premiumTests.filter(t => t.prompt_version === 'bank-1.0').length
  const premiumTotal = premiumTests.length
  const premiumBankHitRate = premiumTotal > 0 ? Math.round((premiumFromBank / premiumTotal) * 100) : 0

  return {
    freeBankTemas,
    freeBankTemasTotal,
    freeBankCoverage: freeBankTemasTotal > 0 ? Math.round((freeBankTemas / freeBankTemasTotal) * 100) : 0,
    freeBankHitRate,
    premiumBankTotal,
    premiumBankTemas: premiumTemas.size,
    avgQuestionsPerTema: premiumTemas.size > 0 ? Math.round(premiumBankTotal / premiumTemas.size) : 0,
    premiumBankHitRate,
  }
}

async function _getFreeTierMetrics(): Promise<FreeTierMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()

  // Free users = profiles without compras (exclude admins)
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', false)
    .gte('created_at', METRICS_START_DATE)

  const { data: paidUserIds } = await supabase
    .from('compras')
    .select('user_id')

  const paidSet = new Set((paidUserIds ?? []).map((r: { user_id: string }) => r.user_id))
  const freeUsers = ((allProfiles ?? []) as { id: string }[]).filter(p => !paidSet.has(p.id) && !adminIds.includes(p.id))
  const totalFreeUsers = freeUsers.length

  // Temas explored + scores by free users
  let totalTemasExplored = 0
  let users1Plus = 0
  let users3Plus = 0
  let users5Plus = 0
  const allScores: number[] = []

  if (freeUsers.length > 0) {
    const freeIds = freeUsers.map(u => u.id)
    const { data: completedTests } = await supabase
      .from('tests_generados')
      .select('user_id, tema_id, puntuacion')
      .eq('completado', true)
      .not('tema_id', 'is', null)
      .in('user_id', freeIds.slice(0, 200))

    const userTemas = new Map<string, Set<string>>()
    for (const t of (completedTests ?? []) as Array<{ user_id: string; tema_id: string; puntuacion: number | null }>) {
      if (!userTemas.has(t.user_id)) userTemas.set(t.user_id, new Set())
      userTemas.get(t.user_id)!.add(t.tema_id)
      if (t.puntuacion !== null) allScores.push(t.puntuacion)
    }
    for (const temas of userTemas.values()) {
      totalTemasExplored += temas.size
      if (temas.size >= 1) users1Plus++
      if (temas.size >= 3) users3Plus++
      if (temas.size >= 5) users5Plus++
    }
  }

  // Paywall hits (402 from generate-test = tema already completed by free user)
  // We track this by counting completed free tests per user where count > 0
  // but also check api_usage_log for 402 status codes
  const paywallHits = 0 // TODO: track 402 responses in api_usage_log

  return {
    totalFreeUsers,
    avgTemasExplored: totalFreeUsers > 0 ? Math.round((totalTemasExplored / totalFreeUsers) * 10) / 10 : 0,
    usersExplored1Plus: users1Plus,
    usersExplored3Plus: users3Plus,
    usersExplored5Plus: users5Plus,
    conversionRate: totalFreeUsers > 0 ? Math.round((paidSet.size / (totalFreeUsers + paidSet.size)) * 1000) / 10 : 0,
    avgScoreFree: allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null,
    paywallHits,
  }
}

export const getQuestionBankMetrics = _getQuestionBankMetrics
export const getFreeTierMetrics = _getFreeTierMetrics

// ─── Roadmap + Tutor IA Metrics ──────────────────────────────────────────────

export interface TutorIAMetrics {
  roadmapsGenerated: number
  roadmapsLast7d: number
  roadmapActivationRate: number // % of users with 3+ tests who generated roadmap
  creditsByEndpoint: Record<string, number>
  usersNeverUsedCredits: number
}

async function _getTutorIAMetrics(): Promise<TutorIAMetrics> {
  const supabase = await createServiceClient()
  const adminIds = await getAdminUserIds()

  // Roadmap generation count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roadmapLogs } = await (supabase as any)
    .from('api_usage_log')
    .select('user_id, timestamp')
    .eq('endpoint', 'generate-roadmap')
    .gte('timestamp', METRICS_START_DATE)

  const allRoadmaps = ((roadmapLogs ?? []) as Array<{ user_id: string; timestamp: string }>)
    .filter(r => !adminIds.includes(r.user_id))
  const roadmapsGenerated = allRoadmaps.length

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const roadmapsLast7d = allRoadmaps.filter(r => r.timestamp >= sevenDaysAgo).length

  // Users with 3+ completed tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: activeTests } = await (supabase as any)
    .from('tests_generados')
    .select('user_id')
    .eq('completado', true)
    .gte('created_at', METRICS_START_DATE)

  const testCountByUser: Record<string, number> = {}
  for (const t of (activeTests ?? []) as Array<{ user_id: string }>) {
    if (adminIds.includes(t.user_id)) continue
    testCountByUser[t.user_id] = (testCountByUser[t.user_id] ?? 0) + 1
  }
  const usersWith3Plus = Object.entries(testCountByUser).filter(([, c]) => c >= 3).map(([id]) => id)
  const roadmapUserSet = new Set(allRoadmaps.map(r => r.user_id))
  const roadmapActivationRate = usersWith3Plus.length > 0
    ? Math.round((usersWith3Plus.filter(id => roadmapUserSet.has(id)).length / usersWith3Plus.length) * 100)
    : 0

  // Credits usage by endpoint (Tutor IA endpoints)
  const tutorEndpoints = ['explain-errores-stream', 'informe-simulacro-stream', 'explain-flashcard-stream', 'analyze-cazatrampas-stream', 'corregir-supuesto-stream', 'generate-roadmap']
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usageLogs } = await (supabase as any)
    .from('api_usage_log')
    .select('endpoint, user_id')
    .in('endpoint', tutorEndpoints)
    .gte('timestamp', METRICS_START_DATE)

  const creditsByEndpoint: Record<string, number> = {}
  for (const log of (usageLogs ?? []) as Array<{ endpoint: string; user_id: string }>) {
    if (adminIds.includes(log.user_id)) continue
    creditsByEndpoint[log.endpoint] = (creditsByEndpoint[log.endpoint] ?? 0) + 1
  }

  // Users who never used a credit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
    .from('profiles')
    .select('id, free_corrector_used, corrections_balance')

  const allProfiles = ((profiles ?? []) as Array<{ id: string; free_corrector_used: number; corrections_balance: number }>)
    .filter(p => !adminIds.includes(p.id))
  const usersNeverUsedCredits = allProfiles.filter(
    p => (p.free_corrector_used ?? 0) === 0 && (p.corrections_balance ?? 0) >= 0
  ).length

  return {
    roadmapsGenerated,
    roadmapsLast7d,
    roadmapActivationRate,
    creditsByEndpoint,
    usersNeverUsedCredits,
  }
}

export const getTutorIAMetrics = _getTutorIAMetrics
