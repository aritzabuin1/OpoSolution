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

import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { METRICS_START_DATE, adminIdFilter, getAdminUserIds } from '@/lib/admin/metrics-filter'

// ─── Tipos exportados ──────────────────────────────────────────────────────────

export interface FuelTankMetrics {
  ingresos: number       // € recibidos (suma compras.amount_paid / 100)
  costes: number         // € estimados en IA (api_usage_log.cost_estimated_cents / 100)
  margen: number         // ingresos - costes
  margenPct: number      // (margen / ingresos) * 100 — -100 si ingresos = 0 y costes > 0, 0 si ambos 0
}

export interface CostPerUserMetrics {
  costeMedioTest: number         // € medio por test generado (últimos 30d)
  costeMedioUsuario: number      // costeMedioTest × tests_por_usuario (últimos 30d)
  usuariosActivos30d: number
  testsUltimos30d: number
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
  if (excludeAdmins) {
    ingresosQuery = ingresosQuery.not('user_id', 'in', excludeAdmins)
    costesQuery = costesQuery.not('user_id', 'in', excludeAdmins)
  }

  const [ingresosResult, costesResult] = await Promise.all([ingresosQuery, costesQuery])

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

  return { ingresos, costes, margen, margenPct }
}

export const getFuelTank = unstable_cache(_getFuelTank, ['admin-fuel-tank'], { revalidate: 120 })

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
    .select('user_id')
    .gte('created_at', thirtyDaysAgo)
    .eq('completado', true)

  if (excludeAdmins) {
    usageQuery = usageQuery.not('user_id', 'in', excludeAdmins)
    testsQuery = testsQuery.not('user_id', 'in', excludeAdmins)
  }

  const [usageLogs, tests30d] = await Promise.all([usageQuery, testsQuery])

  const logs = (usageLogs.data ?? []) as { cost_estimated_cents: number; user_id: string | null }[]
  const testsData = (tests30d.data ?? []) as { user_id: string }[]

  const totalCostCents = logs.reduce(
    (acc: number, l: { cost_estimated_cents: number }) => acc + (l.cost_estimated_cents ?? 0),
    0
  )
  const testsUltimos30d = testsData.length
  const costeMedioTest =
    testsUltimos30d > 0 ? Math.round((totalCostCents / testsUltimos30d) * 10) / 10 / 100 : 0

  const usuariosUnicos = new Set(
    testsData.map((t: { user_id: string }) => t.user_id).filter(Boolean)
  )
  const usuariosActivos30d = usuariosUnicos.size

  // Estimamos tests por usuario (ratio)
  const testsPorUsuario =
    usuariosActivos30d > 0
      ? Math.round((testsUltimos30d / usuariosActivos30d) * 10) / 10
      : 0
  const costeMedioUsuario = Math.round(costeMedioTest * testsPorUsuario * 100) / 100

  return { costeMedioTest, costeMedioUsuario, usuariosActivos30d, testsUltimos30d }
}

export const getCostPerUser = unstable_cache(_getCostPerUser, ['admin-cost-per-user'], { revalidate: 120 })

// ─── getAARRR ─────────────────────────────────────────────────────────────────

/**
 * Embudo AARRR (sin la segunda A de "Aware" — usamos acquisition = registros).
 * - Acquisition: total de perfiles en BD (= registros)
 * - Activation: % que han completado al menos 1 test
 * - Retention: % con racha_actual >= 3 días
 * - Revenue: % con al menos 1 compra
 * - Referral: 0 hasta implementar tracking
 */
async function _getAARRR(): Promise<AAARRRMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const adminIds = await getAdminUserIds()
  const excludeAdmins = adminIdFilter(adminIds)

  let profilesQ = supabase.from('profiles').select('id').eq('is_admin', false).gte('created_at', METRICS_START_DATE)
  let activatedQ = supabase.from('tests_generados').select('user_id').eq('completado', true).gte('created_at', METRICS_START_DATE)
  let retentionQ = supabase.from('profiles').select('id').gte('racha_actual', 3).eq('is_admin', false)
  let revenueQ = supabase.from('compras').select('user_id').gte('created_at', METRICS_START_DATE)

  if (excludeAdmins) {
    activatedQ = activatedQ.not('user_id', 'in', excludeAdmins)
    revenueQ = revenueQ.not('user_id', 'in', excludeAdmins)
  }

  const [profilesResult, activatedResult, retentionResult, revenueResult] = await Promise.all([
    profilesQ, activatedQ, retentionQ, revenueQ,
  ])

  const totalUsuarios = profilesResult.data?.length ?? 0

  const activatedUsers = new Set(
    (activatedResult.data ?? []).map((t: { user_id: string }) => t.user_id)
  )
  const revenueUsers = new Set(
    (revenueResult.data ?? []).map((c: { user_id: string }) => c.user_id)
  )

  const activation =
    totalUsuarios > 0
      ? Math.round((activatedUsers.size / totalUsuarios) * 1000) / 10
      : 0
  const retention =
    totalUsuarios > 0
      ? Math.round(((retentionResult.data?.length ?? 0) / totalUsuarios) * 1000) / 10
      : 0
  const revenue =
    totalUsuarios > 0
      ? Math.round((revenueUsers.size / totalUsuarios) * 1000) / 10
      : 0

  return {
    acquisition: totalUsuarios,
    activation,
    retention,
    revenue,
    referral: 0,
  }
}

export const getAARRR = unstable_cache(_getAARRR, ['admin-aarrr'], { revalidate: 120 })

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

export const getMRRHistory = unstable_cache(_getMRRHistory, ['admin-mrr-history'], { revalidate: 120 })

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
