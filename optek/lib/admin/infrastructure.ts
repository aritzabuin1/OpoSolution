/**
 * lib/admin/infrastructure.ts — §2.23
 *
 * Métricas de infraestructura con cache de 5 minutos (unstable_cache).
 * Compartido entre la página admin y la API route.
 *
 * Monitoriza los límites del plan Free de cada servicio:
 *   - Supabase DB: 500 MB
 *   - Supabase Auth MAU: 50.000/mes
 *   - Upstash Redis: 10.000 comandos/día (estimado desde DAU)
 *   - Costes IA: umbral sostenibilidad 50€/mes (warning) / 100€/mes (error)
 */

import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

// ─── Umbrales ─────────────────────────────────────────────────────────────────

const THRESHOLDS = {
  db: {
    limitMB: 500,         // Supabase Free: 500 MB
    warningPct: 70,       // 350 MB → considera Pro
    errorPct: 90,         // 450 MB → URGENTE
  },
  auth: {
    limitMAU: 50_000,     // Supabase Free: 50.000 MAU/mes
    warningMAU: 35_000,
    errorMAU: 45_000,
  },
  upstash: {
    limitCmdsDay: 10_000, // Upstash Free: 10.000 comandos/día
    commandsPerUser: 3,   // 3 Redis cmds/request de rate-limit (sliding window)
    warningCmds: 7_000,   // ~2.333 DAU
    errorCmds: 9_000,     // ~3.000 DAU
  },
  ai: {
    warningMonthEur: 50,
    errorMonthEur: 100,
  },
} as const

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export interface InfraMetrics {
  db: {
    sizeBytes: number
    sizeMB: number
    limitMB: number
    pct: number
    status: 'ok' | 'warning' | 'error'
  }
  auth: {
    totalRegistrados: number
    mau30d: number
    limitMAU: number
    pct: number
    status: 'ok' | 'warning' | 'error'
  }
  upstash: {
    dau: number
    estimatedCmdsDay: number
    limitCmdsDay: number
    pct: number
    status: 'ok' | 'warning' | 'error'
  }
  ai: {
    costsToday: number
    costsWeek: number
    costsMonth: number
    status: 'ok' | 'warning' | 'error'
  }
  semaphore: 'ok' | 'warning' | 'error'
  cachedAt: string // ISO — para "Actualizado hace X min"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function worstStatus(
  ...statuses: Array<'ok' | 'warning' | 'error'>
): 'ok' | 'warning' | 'error' {
  if (statuses.includes('error')) return 'error'
  if (statuses.includes('warning')) return 'warning'
  return 'ok'
}

function startOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function startOfWeek(d: Date): Date {
  const day = d.getUTCDay() // 0 = Sun
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1) // Monday
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff))
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

// ─── Core fetch (no cache) ────────────────────────────────────────────────────

async function fetchInfraMetrics(): Promise<InfraMetrics> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const todayStart = startOfDay(now).toISOString()
  const tomorrowStart = startOfDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)).toISOString()
  const weekStart = startOfWeek(now).toISOString()
  const monthStart = startOfMonth(now).toISOString()

  // Run all queries in parallel
  const [
    dbSizeResult,
    profilesCountResult,
    mauUsersResult,
    dauResult,
    aiTodayResult,
    aiWeekResult,
    aiMonthResult,
  ] = await Promise.all([
    // DB size (RPC — migration 023)
    supabase.rpc('get_db_size_bytes'),

    // Total registrados (proxy para auth.users)
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),

    // MAU 30d — usuarios con actividad en api_usage_log
    supabase
      .from('api_usage_log')
      .select('user_id')
      .gte('timestamp', thirtyDaysAgo),

    // DAU — usuarios que generaron test en las últimas 24h
    supabase
      .from('tests_generados')
      .select('user_id')
      .gte('created_at', oneDayAgo),

    // AI costs hoy
    supabase
      .from('api_usage_log')
      .select('cost_estimated_cents')
      .gte('timestamp', todayStart)
      .lt('timestamp', tomorrowStart),

    // AI costs semana
    supabase
      .from('api_usage_log')
      .select('cost_estimated_cents')
      .gte('timestamp', weekStart),

    // AI costs mes
    supabase
      .from('api_usage_log')
      .select('cost_estimated_cents')
      .gte('timestamp', monthStart),
  ])

  // ── DB size ──────────────────────────────────────────────────────────────────
  const sizeBytes = (dbSizeResult.data as number | null) ?? 0
  const sizeMB = sizeBytes / (1024 * 1024)
  const dbPct = (sizeMB / THRESHOLDS.db.limitMB) * 100
  const dbStatus: 'ok' | 'warning' | 'error' =
    dbPct >= THRESHOLDS.db.errorPct ? 'error' :
    dbPct >= THRESHOLDS.db.warningPct ? 'warning' : 'ok'

  // ── Auth MAU ─────────────────────────────────────────────────────────────────
  const totalRegistrados = profilesCountResult.count ?? 0
  const mauRows = (mauUsersResult.data ?? []) as Array<{ user_id: string }>
  const mau30d = new Set(mauRows.map((r) => r.user_id)).size
  const authPct = (mau30d / THRESHOLDS.auth.limitMAU) * 100
  const authStatus: 'ok' | 'warning' | 'error' =
    mau30d >= THRESHOLDS.auth.errorMAU ? 'error' :
    mau30d >= THRESHOLDS.auth.warningMAU ? 'warning' : 'ok'

  // ── Upstash (estimación via DAU) ──────────────────────────────────────────────
  const dauRows = (dauResult.data ?? []) as Array<{ user_id: string }>
  const dau = new Set(dauRows.map((r) => r.user_id)).size
  const estimatedCmdsDay = dau * THRESHOLDS.upstash.commandsPerUser
  const upstashPct = (estimatedCmdsDay / THRESHOLDS.upstash.limitCmdsDay) * 100
  const upstashStatus: 'ok' | 'warning' | 'error' =
    estimatedCmdsDay >= THRESHOLDS.upstash.errorCmds ? 'error' :
    estimatedCmdsDay >= THRESHOLDS.upstash.warningCmds ? 'warning' : 'ok'

  // ── AI costs ─────────────────────────────────────────────────────────────────
  const sumCents = (rows: Array<{ cost_estimated_cents: number | null }>) =>
    rows.reduce((acc, r) => acc + (r.cost_estimated_cents ?? 0), 0)

  const costsToday = sumCents((aiTodayResult.data ?? []) as Array<{ cost_estimated_cents: number | null }>) / 100
  const costsWeek = sumCents((aiWeekResult.data ?? []) as Array<{ cost_estimated_cents: number | null }>) / 100
  const costsMonth = sumCents((aiMonthResult.data ?? []) as Array<{ cost_estimated_cents: number | null }>) / 100

  const aiStatus: 'ok' | 'warning' | 'error' =
    costsMonth >= THRESHOLDS.ai.errorMonthEur ? 'error' :
    costsMonth >= THRESHOLDS.ai.warningMonthEur ? 'warning' : 'ok'

  return {
    db: {
      sizeBytes,
      sizeMB,
      limitMB: THRESHOLDS.db.limitMB,
      pct: dbPct,
      status: dbStatus,
    },
    auth: {
      totalRegistrados,
      mau30d,
      limitMAU: THRESHOLDS.auth.limitMAU,
      pct: authPct,
      status: authStatus,
    },
    upstash: {
      dau,
      estimatedCmdsDay,
      limitCmdsDay: THRESHOLDS.upstash.limitCmdsDay,
      pct: upstashPct,
      status: upstashStatus,
    },
    ai: {
      costsToday,
      costsWeek,
      costsMonth,
      status: aiStatus,
    },
    semaphore: worstStatus(dbStatus, authStatus, upstashStatus, aiStatus),
    cachedAt: new Date().toISOString(),
  }
}

// ─── Cached export ────────────────────────────────────────────────────────────

export const getInfraMetrics = unstable_cache(
  fetchInfraMetrics,
  ['infra-metrics'],
  { revalidate: 300 } // 5 minutos
)
