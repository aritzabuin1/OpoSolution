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
import { METRICS_START_DATE, adminIdFilter, getAdminUserIds } from '@/lib/admin/metrics-filter'

// ─── Platform detection ──────────────────────────────────────────────────────

/** Detect hosting platform from environment variables (evaluated at call time, not import time) */
function getPlatform(): 'vercel' | 'railway' | 'unknown' {
  if (process.env.RAILWAY_ENVIRONMENT) return 'railway'
  if (process.env.VERCEL) return 'vercel'
  return 'unknown'
}

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
  // Vercel-only: Railway has no invocation limits (persistent server)
  vercel: {
    limitInvocationsMonth: 100_000, // Vercel Hobby: 100k/mes
    warningInvocations: 70_000,
    errorInvocations: 90_000,
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
  vercel: {
    estimatedInvocationsMonth: number
    limitInvocationsMonth: number
    pct: number
    status: 'ok' | 'warning' | 'error'
  }
  growth: {
    newUsersToday: number
    newUsersWeek: number
    totalUsers: number
    dauToday: number
    /** Projected days until MAU limit at current growth rate */
    daysToMauLimit: number | null
  }
  business: {
    purchasesToday: number
    purchasesWeek: number
    revenueWeekEur: number
    conversionRatePct: number
  }
  errors: {
    errorRate24h: number
    totalErrors24h: number
    status: 'ok' | 'warning' | 'error'
  }
  platform: 'vercel' | 'railway' | 'unknown'
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
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const todayStart = startOfDay(now).toISOString()
  const tomorrowStart = startOfDay(new Date(now.getTime() + 24 * 60 * 60 * 1000)).toISOString()
  const weekStart = startOfWeek(now).toISOString()
  const monthStart = startOfMonth(now).toISOString()

  // Fetch admin IDs to exclude from all user-facing metrics
  const adminIds = await getAdminUserIds()
  const adminFilter = adminIdFilter(adminIds)

  // Run all queries in parallel
  const [
    dbSizeResult,
    profilesCountResult,
    mauUsersResult,
    dauResult,
    aiTodayResult,
    aiWeekResult,
    aiMonthResult,
    // Vercel invocations (api_usage_log rows this month = API calls)
    apiCallsMonthResult,
    // User growth
    newUsersTodayResult,
    newUsersWeekResult,
    newUsersPrevWeekResult,
    // Purchases
    purchasesTodayResult,
    purchasesWeekResult,
    paidUsersResult,
  ] = await Promise.all([
    // DB size (RPC — migration 023)
    supabase.rpc('get_db_size_bytes'),

    // Total registrados — exclude admins + pre-launch data
    (() => {
      let q = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', false)
        .gte('created_at', METRICS_START_DATE)
      return q
    })(),

    // MAU 30d — exclude admin activity
    (() => {
      let q = supabase
        .from('api_usage_log')
        .select('user_id')
        .gte('timestamp', thirtyDaysAgo)
      if (adminFilter) q = q.not('user_id', 'in', adminFilter)
      return q
    })(),

    // DAU — exclude admin activity
    (() => {
      let q = supabase
        .from('tests_generados')
        .select('user_id')
        .gte('created_at', oneDayAgo)
      if (adminFilter) q = q.not('user_id', 'in', adminFilter)
      return q
    })(),

    // AI costs hoy (keep admin costs — these are real infrastructure costs)
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

    // Vercel invocations estimate: total API calls this month
    supabase
      .from('api_usage_log')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', monthStart),

    // New users today — exclude admins
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)
      .gte('created_at', todayStart),

    // New users this week — exclude admins + floor to METRICS_START_DATE
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)
      .gte('created_at', METRICS_START_DATE),

    // New users previous week — exclude admins (before METRICS_START_DATE = 0 by definition)
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false)
      .gte('created_at', fourteenDaysAgo)
      .lt('created_at', sevenDaysAgo),

    // Purchases today
    supabase
      .from('compras')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),

    // Purchases this week + revenue
    supabase
      .from('compras')
      .select('amount_paid')
      .gte('created_at', weekStart),

    // Total paid users
    supabase
      .from('compras')
      .select('user_id'),
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

  // ── Vercel invocations (estimated: API calls * ~3x for pages/assets) ────────
  // On Railway (persistent server), invocation limits don't exist — metric is informational only
  const apiCallsMonth = apiCallsMonthResult.count ?? 0
  // Each API call ≈ 1 invocation; pages/middleware add ~2x overhead estimate
  const estimatedInvocationsMonth = apiCallsMonth * 3
  const vercelPct = getPlatform() === 'vercel'
    ? (estimatedInvocationsMonth / THRESHOLDS.vercel.limitInvocationsMonth) * 100
    : 0 // No limit on Railway
  const vercelStatus: 'ok' | 'warning' | 'error' = getPlatform() !== 'vercel'
    ? 'ok' // Railway: no invocation limits
    : estimatedInvocationsMonth >= THRESHOLDS.vercel.errorInvocations ? 'error'
    : estimatedInvocationsMonth >= THRESHOLDS.vercel.warningInvocations ? 'warning' : 'ok'

  // ── User growth ──────────────────────────────────────────────────────────────
  const newUsersToday = newUsersTodayResult.count ?? 0
  const newUsersWeek = newUsersWeekResult.count ?? 0
  const newUsersPrevWeek = newUsersPrevWeekResult.count ?? 0

  // Project days to MAU limit based on weekly growth
  let daysToMauLimit: number | null = null
  if (newUsersWeek > 0) {
    const remaining = THRESHOLDS.auth.limitMAU - mau30d
    const dailyRate = newUsersWeek / 7
    daysToMauLimit = dailyRate > 0 ? Math.floor(remaining / dailyRate) : null
  }

  // ── Business ─────────────────────────────────────────────────────────────────
  const purchasesToday = purchasesTodayResult.count ?? 0
  const purchasesWeekRows = (purchasesWeekResult.data ?? []) as Array<{ amount_paid: number | null }>
  const purchasesWeek = purchasesWeekRows.length
  // amount_paid is in cents
  const revenueWeekEur = purchasesWeekRows.reduce((sum, r) => sum + (r.amount_paid ?? 0), 0) / 100
  const paidUserIds = new Set(((paidUsersResult.data ?? []) as Array<{ user_id: string | null }>).map(r => r.user_id).filter(Boolean))
  const conversionRatePct = totalRegistrados > 0 ? (paidUserIds.size / totalRegistrados) * 100 : 0

  // ── Errors (estimated from AI calls with 0 cost = likely failed) ───────────
  // api_usage_log lacks status_code, so we estimate: calls with 0 tokens_out = likely error
  // For proper error tracking, configure Axiom log drain in Vercel
  const errorsStatus: 'ok' | 'warning' | 'error' = 'ok'

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
    vercel: {
      estimatedInvocationsMonth,
      limitInvocationsMonth: THRESHOLDS.vercel.limitInvocationsMonth,
      pct: vercelPct,
      status: vercelStatus,
    },
    growth: {
      newUsersToday,
      newUsersWeek,
      totalUsers: totalRegistrados,
      dauToday: dau,
      daysToMauLimit,
    },
    business: {
      purchasesToday,
      purchasesWeek,
      revenueWeekEur,
      conversionRatePct,
    },
    errors: {
      errorRate24h: 0, // No status_code in api_usage_log — use Axiom for real error tracking
      totalErrors24h: 0,
      status: errorsStatus,
    },
    platform: getPlatform(),
    semaphore: worstStatus(dbStatus, authStatus, upstashStatus, aiStatus, vercelStatus),
    cachedAt: new Date().toISOString(),
  }
}

// ─── Export (no cache — admin pages are low-traffic) ─────────────────────────

export const getInfraMetrics = fetchInfraMetrics
