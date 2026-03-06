/**
 * lib/admin/metrics.ts — §2.18.4
 *
 * Funciones de Unit Economics para el Admin Dashboard.
 * Todas usan createServiceClient() — bypass RLS — solo llamar desde Server Components admin.
 *
 * KPIs implementados:
 *   - getFuelTank(): ingresos vs costes IA → margen bruto real
 *   - getCostPerUser(): coste medio por test y por usuario activo
 *   - getAARRR(): embudo Acquisition → Revenue
 *   - getMRRHistory(): compras agrupadas por mes
 *   - getAlerts(): alertas automáticas si los KPIs se degradan
 */

import { createServiceClient } from '@/lib/supabase/server'

// ─── Tipos exportados ──────────────────────────────────────────────────────────

export interface FuelTankMetrics {
  ingresos: number       // € recibidos (suma compras.amount_paid / 100)
  costes: number         // € estimados en IA (api_usage_log.cost_estimated_cents / 100)
  margen: number         // ingresos - costes
  margenPct: number      // (margen / ingresos) * 100 — Infinity si ingresos = 0
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
export async function getFuelTank(): Promise<FuelTankMetrics> {
  const supabase = await createServiceClient()

  const [ingresosResult, costesResult] = await Promise.all([
    supabase.from('compras').select('amount_paid'),
    supabase.from('api_usage_log').select('cost_estimated_cents'),
  ])

  const ingresos =
    (ingresosResult.data ?? []).reduce((acc, c) => acc + (c.amount_paid ?? 0), 0) / 100

  const costes =
    (costesResult.data ?? []).reduce(
      (acc, c) => acc + ((c.cost_estimated_cents as number) ?? 0),
      0
    ) / 100

  const margen = ingresos - costes
  const margenPct = ingresos > 0 ? Math.round((margen / ingresos) * 1000) / 10 : 0

  return { ingresos, costes, margen, margenPct }
}

// ─── getCostPerUser ───────────────────────────────────────────────────────────

/**
 * Coste medio por test y por usuario activo en los últimos 30 días.
 * Usa api_usage_log filtrado por endpoint de generate-test.
 */
export async function getCostPerUser(): Promise<CostPerUserMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [usageLogs, tests30d] = await Promise.all([
    supabase
      .from('api_usage_log')
      .select('cost_estimated_cents, user_id')
      .gte('timestamp', thirtyDaysAgo)
      .like('endpoint', '%generate-test%'),
    supabase
      .from('tests_generados')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo)
      .eq('completado', true),
  ])

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

// ─── getAARRR ─────────────────────────────────────────────────────────────────

/**
 * Embudo AARRR (sin la segunda A de "Aware" — usamos acquisition = registros).
 * - Acquisition: total de perfiles en BD (= registros)
 * - Activation: % que han completado al menos 1 test
 * - Retention: % con racha_actual >= 3 días
 * - Revenue: % con al menos 1 compra
 * - Referral: 0 hasta implementar tracking
 */
export async function getAARRR(): Promise<AAARRRMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const [profilesResult, activatedResult, retentionResult, revenueResult] = await Promise.all([
    // Total registros
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    // Activados: al menos 1 test completado
    supabase
      .from('tests_generados')
      .select('user_id')
      .eq('completado', true),
    // Retention: racha_actual >= 3
    supabase
      .from('profiles')
      .select('id')
      .gte('racha_actual', 3),
    // Revenue: al menos 1 compra
    supabase
      .from('compras')
      .select('user_id'),
  ])

  const totalUsuarios = profilesResult.count ?? 0

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

// ─── getMRRHistory ────────────────────────────────────────────────────────────

/**
 * Ingresos agrupados por mes, últimos N meses.
 * Nota: OPTEK no tiene suscripciones — son pagos únicos. Llamamos "MRR"
 * al revenue mensual acumulado (no es MRR estrictamente hablando, pero
 * es el KPI más útil para monitorizar el crecimiento mes a mes).
 */
export async function getMRRHistory(meses = 6): Promise<MRRDataPoint[]> {
  const supabase = await createServiceClient()

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - meses)

  const { data } = await supabase
    .from('compras')
    .select('amount_paid, created_at')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true })

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
