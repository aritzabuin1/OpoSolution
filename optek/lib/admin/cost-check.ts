import { createServiceClient } from '@/lib/supabase/server'
import { getInfraMetrics, type InfraMetrics } from '@/lib/admin/infrastructure'
import { getFuelTank, getCostPerUser, getFreeTierMetrics } from '@/lib/admin/metrics'
import { getConversionMetrics, getOnboardingFunnel, getFeatureEngagement, getChurnMetrics } from '@/lib/admin/analytics'
import { logger } from '@/lib/logger'

/**
 * lib/admin/cost-check.ts — Monitoring + weekly digest + critical alerts
 *
 * Email strategy:
 *   - WEEKLY (lunes 08:00 UTC): digest completo con métricas de negocio
 *   - INMEDIATO: solo alertas críticas (DB > 90%, error spike, margen negativo)
 *
 * Llamada desde:
 *   - GET /api/cron/boe-watch  (cron 07:00 UTC — diario, pero email solo lunes o críticos)
 *   - GET /api/cron/check-costs (ruta manual)
 */

const DAILY_COST_ALERT_USD = 10.0
const VERIFICATION_RATE_ALERT_THRESHOLD = 0.8
const ALERT_TO_EMAIL = process.env.ALERT_EMAIL ?? 'aritzabuin1@gmail.com'

export interface CostCheckResult {
  date: string
  total_cost_usd: string
  cost_alert: boolean
  verification_rate: number
  verification_alert: boolean
  ai_calls: number
  infra_semaphore: 'ok' | 'warning' | 'error'
  infra_alerts: string[]
  growth_alerts: string[]
  business_alerts: string[]
  error_alerts: string[]
  email_sent: boolean
}

export async function runCostCheck(date?: string): Promise<CostCheckResult> {
  const log = logger.child({ fn: 'runCostCheck' })
  const supabase = await createServiceClient()

  // Por defecto analizar ayer (cuando se llama desde boe-watch a las 07:00 UTC,
  // ayer ya esta completo; cuando se llama desde check-costs a las 23:00, usar hoy)
  const target = date ?? (() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().split('T')[0]
  })()

  // -- Costes del dia ---
  const { data: usageData, error: usageError } = await supabase
    .from('api_usage_log')
    .select('cost_estimated_cents, endpoint')
    .gte('timestamp', `${target}T00:00:00Z`)
    .lte('timestamp', `${target}T23:59:59Z`)

  if (usageError) throw usageError

  const totalCostCents = usageData?.reduce((sum, r) => sum + (r.cost_estimated_cents ?? 0), 0) ?? 0
  const totalCostUSD = totalCostCents / 100
  const costAlert = totalCostUSD > DAILY_COST_ALERT_USD

  // -- Tasa de verificacion ---
  const verificationRows = usageData?.filter((r) => r.endpoint === 'verification') ?? []
  const aiRows = usageData?.filter(
    (r) => r.endpoint !== 'verification' && r.endpoint !== 'unknown'
  ) ?? []
  const verificationRate = aiRows.length > 0 ? verificationRows.length / aiRows.length : 1
  const verificationAlert = aiRows.length >= 5 && verificationRate < VERIFICATION_RATE_ALERT_THRESHOLD

  // -- Infraestructura ---
  const infra = await getInfraMetrics()
  const infraAlerts = buildInfraAlerts(infra)
  const growthAlerts = buildGrowthAlerts(infra)
  const businessAlerts = buildBusinessAlerts(infra)
  const errorAlerts = buildErrorAlerts(infra)

  log.info(
    {
      date: target,
      totalCostUSD: totalCostUSD.toFixed(2),
      costAlert,
      verificationRate: verificationRate.toFixed(3),
      verificationAlert,
      infraSemaphore: infra.semaphore,
      infraAlerts,
      growthAlerts,
      businessAlerts,
      errorAlerts,
    },
    'runCostCheck completed'
  )

  // -- Email strategy: weekly digest on Mondays, critical alerts immediately ---
  const isMonday = new Date().getUTCDay() === 1
  const isCritical = infra.semaphore === 'error' || errorAlerts.length > 0 ||
    (infra.db.pct >= 90) || costAlert

  let emailSent = false

  if (isCritical) {
    // Critical alerts: send immediately regardless of day
    emailSent = await sendAlertEmail({
      date: target, totalCostUSD, costAlert, verificationRate, verificationAlert,
      infraAlerts, growthAlerts, businessAlerts, errorAlerts, infra,
    })
  }

  if (isMonday) {
    // Monday: send weekly digest with full business metrics
    const digestSent = await sendWeeklyDigest(infra)
    if (digestSent) emailSent = true
  }

  return {
    date: target,
    total_cost_usd: totalCostUSD.toFixed(2),
    cost_alert: costAlert,
    verification_rate: Number(verificationRate.toFixed(3)),
    verification_alert: verificationAlert,
    ai_calls: aiRows.length,
    infra_semaphore: infra.semaphore,
    infra_alerts: infraAlerts,
    growth_alerts: growthAlerts,
    business_alerts: businessAlerts,
    error_alerts: errorAlerts,
    email_sent: emailSent,
  }
}

// -- Alert builders ---

function buildInfraAlerts(infra: InfraMetrics): string[] {
  const alerts: string[] = []

  if (infra.db.status !== 'ok')
    alerts.push(`BD: ${infra.db.sizeMB.toFixed(0)} MB / ${infra.db.limitMB} MB (${infra.db.pct.toFixed(0)}%)`)
  if (infra.auth.status !== 'ok')
    alerts.push(`MAU: ${infra.auth.mau30d.toLocaleString()} / ${infra.auth.limitMAU.toLocaleString()} (${infra.auth.pct.toFixed(0)}%)`)
  if (infra.upstash.status !== 'ok')
    alerts.push(`Upstash: ~${infra.upstash.estimatedCmdsDay.toLocaleString()} cmd/dia / ${infra.upstash.limitCmdsDay.toLocaleString()} limite`)
  if (infra.ai.status !== 'ok')
    alerts.push(`Costes IA mes: ${infra.ai.costsMonth.toFixed(2)} EUR`)
  if (infra.vercel.status !== 'ok')
    alerts.push(`Vercel invocaciones: ~${infra.vercel.estimatedInvocationsMonth.toLocaleString()} / ${infra.vercel.limitInvocationsMonth.toLocaleString()} (${infra.vercel.pct.toFixed(0)}%)`)

  return alerts
}

function buildGrowthAlerts(infra: InfraMetrics): string[] {
  const alerts: string[] = []

  // Rapid growth warning: >50 users/week is significant for a new product
  if (infra.growth.newUsersWeek >= 50)
    alerts.push(`Crecimiento rapido: ${infra.growth.newUsersWeek} nuevos usuarios esta semana`)

  // MAU projection warning
  if (infra.growth.daysToMauLimit !== null && infra.growth.daysToMauLimit < 90)
    alerts.push(`Proyeccion: alcanzaras el limite MAU (${infra.auth.limitMAU.toLocaleString()}) en ~${infra.growth.daysToMauLimit} dias`)

  // DAU spike (>100 DAU on Hobby = might hit function limits)
  if (infra.growth.dauToday >= 100)
    alerts.push(`DAU alto: ${infra.growth.dauToday} usuarios activos hoy`)

  return alerts
}

function buildBusinessAlerts(infra: InfraMetrics): string[] {
  const alerts: string[] = []

  // First purchase ever! (milestone)
  if (infra.business.purchasesToday > 0 && infra.business.purchasesWeek <= infra.business.purchasesToday)
    alerts.push(`Primera(s) venta de la semana: ${infra.business.purchasesToday} compra(s) hoy`)

  // Revenue milestone
  if (infra.business.revenueWeekEur > 0)
    alerts.push(`Revenue semanal: ${infra.business.revenueWeekEur.toFixed(2)} EUR (${infra.business.purchasesWeek} compras)`)

  // Low conversion (only alert if >50 users to have significance)
  if (infra.growth.totalUsers >= 50 && infra.business.conversionRatePct < 1)
    alerts.push(`Conversion baja: ${infra.business.conversionRatePct.toFixed(1)}% (${infra.growth.totalUsers} usuarios)`)

  return alerts
}

function buildErrorAlerts(infra: InfraMetrics): string[] {
  const alerts: string[] = []

  if (infra.errors.status !== 'ok')
    alerts.push(`Tasa de errores: ${infra.errors.errorRate24h.toFixed(1)}% (${infra.errors.totalErrors24h} errores en 24h)`)

  return alerts
}

// -- Recommendations engine ---

function getRecommendations(infra: InfraMetrics, costAlert: boolean): string[] {
  const recs: string[] = []

  // Vercel
  if (infra.vercel.pct >= 50)
    recs.push('Vercel: Considera pasar a Pro ($20/mes) para 1M invocaciones, 60s timeout y 3+ crons')
  // Supabase DB
  if (infra.db.pct >= 60)
    recs.push('Supabase BD: Considera Pro ($25/mes) para 8 GB. Revisa tablas grandes: api_usage_log, tests_generados')
  // Supabase Auth
  if (infra.auth.pct >= 50)
    recs.push('Supabase Auth: Plan Pro permite 100k MAU. Considera upgrade antes de campanas de marketing')
  // Upstash
  if (infra.upstash.pct >= 50)
    recs.push('Upstash: Plan Pay-as-you-go ($0.2/100k cmds) para escalar sin limites')
  // AI costs
  if (costAlert || infra.ai.costsMonth >= 30)
    recs.push('Costes IA: Revisa el prompt caching (ya activo). Considera reducir maxTokens o usar Haiku para tareas simples')
  // Errors
  if (infra.errors.status !== 'ok')
    recs.push('Errores: Revisa los logs en Vercel -> Logs. Posible API key expirada, rate limit, o timeout')
  // Growth
  if (infra.growth.daysToMauLimit !== null && infra.growth.daysToMauLimit < 30)
    recs.push('URGENTE: Upgrade Supabase AHORA — llegaras al limite MAU en menos de 30 dias')

  return recs
}

// -- Email ---

async function sendAlertEmail(params: {
  date: string
  totalCostUSD: number
  costAlert: boolean
  verificationRate: number
  verificationAlert: boolean
  infraAlerts: string[]
  growthAlerts: string[]
  businessAlerts: string[]
  errorAlerts: string[]
  infra: InfraMetrics
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn({ params: { date: params.date } }, 'RESEND_API_KEY no configurado — alerta omitida')
    return false
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const recommendations = getRecommendations(params.infra, params.costAlert)

    // Determine severity
    const hasError = params.infra.semaphore === 'error'
    const hasWarning = params.infra.semaphore === 'warning'
    const severityIcon = hasError ? '🔴' : hasWarning ? '🟡' : '🟢'
    const severityLabel = hasError ? 'CRITICO' : hasWarning ? 'ATENCION' : 'INFO'

    // Build sections
    const sections: string[] = []

    // Cost section
    if (params.costAlert || params.verificationAlert) {
      const items: string[] = []
      if (params.costAlert)
        items.push(`<li>Coste diario: $${params.totalCostUSD.toFixed(2)} (umbral: $${DAILY_COST_ALERT_USD})</li>`)
      if (params.verificationAlert)
        items.push(`<li>Tasa verificacion: ${(params.verificationRate * 100).toFixed(1)}% (umbral: ${(VERIFICATION_RATE_ALERT_THRESHOLD * 100).toFixed(0)}%)</li>`)
      sections.push(`<h3 style="color:#dc2626;margin:16px 0 8px;">Costes IA</h3><ul>${items.join('')}</ul>`)
    }

    // Infra section
    if (params.infraAlerts.length > 0) {
      sections.push(`
        <h3 style="color:#d97706;margin:16px 0 8px;">Infraestructura (Free Tier)</h3>
        <ul>${params.infraAlerts.map(a => `<li>${a}</li>`).join('')}</ul>
      `)
    }

    // Growth section
    if (params.growthAlerts.length > 0) {
      sections.push(`
        <h3 style="color:#2563eb;margin:16px 0 8px;">Crecimiento</h3>
        <ul>${params.growthAlerts.map(a => `<li>${a}</li>`).join('')}</ul>
      `)
    }

    // Business section
    if (params.businessAlerts.length > 0) {
      sections.push(`
        <h3 style="color:#059669;margin:16px 0 8px;">Negocio</h3>
        <ul>${params.businessAlerts.map(a => `<li>${a}</li>`).join('')}</ul>
      `)
    }

    // Errors section
    if (params.errorAlerts.length > 0) {
      sections.push(`
        <h3 style="color:#dc2626;margin:16px 0 8px;">Errores</h3>
        <ul>${params.errorAlerts.map(a => `<li>${a}</li>`).join('')}</ul>
      `)
    }

    // Recommendations
    if (recommendations.length > 0) {
      sections.push(`
        <h3 style="color:#7c3aed;margin:16px 0 8px;">Recomendaciones</h3>
        <ul>${recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
      `)
    }

    // Quick stats footer
    const stats = params.infra
    const quickStats = `
      <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px;font-size:13px;color:#6b7280;">
        <strong>Snapshot rapido:</strong><br/>
        Usuarios: ${stats.growth.totalUsers} total | ${stats.growth.newUsersToday} hoy | ${stats.growth.dauToday} DAU<br/>
        BD: ${stats.db.sizeMB.toFixed(0)} MB/${stats.db.limitMB} MB |
        MAU: ${stats.auth.mau30d}/${stats.auth.limitMAU.toLocaleString()} |
        Vercel: ~${stats.vercel.estimatedInvocationsMonth.toLocaleString()}/${stats.vercel.limitInvocationsMonth.toLocaleString()}<br/>
        IA hoy: ${stats.ai.costsToday.toFixed(2)} EUR | semana: ${stats.ai.costsWeek.toFixed(2)} EUR | mes: ${stats.ai.costsMonth.toFixed(2)} EUR<br/>
        Compras semana: ${stats.business.purchasesWeek} (${stats.business.revenueWeekEur.toFixed(2)} EUR) | Conversion: ${stats.business.conversionRatePct.toFixed(1)}%
      </div>
    `

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="margin:0 0 4px;">${severityIcon} OpoRuta Monitor — ${params.date}</h2>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">Severidad: <strong>${severityLabel}</strong></p>
        ${sections.join('')}
        ${quickStats}
        <p style="margin-top:16px;font-size:13px;">
          <a href="https://oporuta.es/admin/economics">Admin Dashboard</a> |
          <a href="https://oporuta.es/admin/analytics">Analytics</a> |
          <a href="https://vercel.com/dashboard">Vercel</a> |
          <a href="https://supabase.com/dashboard">Supabase</a>
        </p>
      </div>
    `

    // Plain text version
    const allAlerts = [
      ...params.infraAlerts,
      ...params.growthAlerts,
      ...params.businessAlerts,
      ...params.errorAlerts,
    ]
    if (params.costAlert) allAlerts.unshift(`Coste diario: $${params.totalCostUSD.toFixed(2)}`)
    if (params.verificationAlert) allAlerts.unshift(`Verificacion: ${(params.verificationRate * 100).toFixed(1)}%`)

    const text = [
      `OpoRuta Monitor — ${params.date} [${severityLabel}]`,
      '',
      'ALERTAS:',
      ...allAlerts.map(a => `- ${a}`),
      '',
      recommendations.length > 0 ? 'RECOMENDACIONES:' : '',
      ...recommendations.map(r => `- ${r}`),
      '',
      `Usuarios: ${stats.growth.totalUsers} | DAU: ${stats.growth.dauToday} | MAU: ${stats.auth.mau30d}`,
      `Revenue semana: ${stats.business.revenueWeekEur.toFixed(2)} EUR`,
    ].join('\n')

    await resend.emails.send({
      from: 'OpoRuta Monitor <alerts@oporuta.es>',
      to: [ALERT_TO_EMAIL],
      subject: `${severityIcon} OpoRuta [${severityLabel}] — ${params.date}`,
      html,
      text,
    })

    logger.info({ alertCount: allAlerts.length, severity: severityLabel }, 'Alert email enviado')
    return true
  } catch (err) {
    logger.error({ err }, 'Error enviando alert email')
    return false
  }
}

// ─── Weekly Digest ──────────────────────────────────────────────────────────

async function sendWeeklyDigest(infra: InfraMetrics): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false

  try {
    const [fuelTank, costPerUser, freeTier, conversion, funnel, engagement, churn] = await Promise.all([
      getFuelTank(),
      getCostPerUser(),
      getFreeTierMetrics(),
      getConversionMetrics(),
      getOnboardingFunnel(),
      getFeatureEngagement(),
      getChurnMetrics(),
    ])

    const weekEnd = new Date().toISOString().split('T')[0]
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const semaphore = infra.semaphore === 'ok' ? '🟢' : infra.semaphore === 'warning' ? '🟡' : '🔴'

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;">
        <h2 style="margin:0 0 4px;">📊 OpoRuta — Digest Semanal</h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">${weekStart} → ${weekEnd}</p>

        <!-- USUARIOS -->
        <h3 style="color:#2563eb;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">👥 Usuarios</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#6b7280;">Registros totales</td><td style="text-align:right;font-weight:600;">${conversion.totalUsers}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Free / Paid</td><td style="text-align:right;font-weight:600;">${conversion.freeUsers} / ${conversion.paidUsers}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Nuevos esta semana</td><td style="text-align:right;font-weight:600;">${infra.growth.newUsersWeek}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">DAU (hoy)</td><td style="text-align:right;font-weight:600;">${infra.growth.dauToday}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Churn 7d</td><td style="text-align:right;font-weight:600;${churn.churnPct > 50 ? 'color:#dc2626;' : ''}">${churn.churnPct}% (${churn.churned7d} inactivos)</td></tr>
        </table>

        <!-- FREE TIER -->
        <h3 style="color:#059669;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">🆓 Free Tier</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#6b7280;">Free users</td><td style="text-align:right;font-weight:600;">${freeTier.totalFreeUsers}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Media temas explorados</td><td style="text-align:right;font-weight:600;">${freeTier.avgTemasExplored}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">1+ / 3+ / 5+ temas</td><td style="text-align:right;font-weight:600;">${freeTier.usersExplored1Plus} / ${freeTier.usersExplored3Plus} / ${freeTier.usersExplored5Plus}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Nota media free</td><td style="text-align:right;font-weight:600;">${freeTier.avgScoreFree !== null ? freeTier.avgScoreFree + '%' : '—'}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Conversión free→paid</td><td style="text-align:right;font-weight:600;${freeTier.conversionRate < 2 ? 'color:#dc2626;' : 'color:#059669;'}">${freeTier.conversionRate}%</td></tr>
        </table>

        <!-- FUNNEL -->
        <h3 style="color:#7c3aed;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">📈 Funnel Onboarding</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#6b7280;">Registro</td><td style="text-align:right;font-weight:600;">${funnel.registered}</td><td style="text-align:right;color:#6b7280;font-size:12px;">100%</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">→ 1 tema</td><td style="text-align:right;font-weight:600;">${funnel.explored1Tema}</td><td style="text-align:right;color:#6b7280;font-size:12px;">${funnel.pctExplored1}%</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">→ 3 temas</td><td style="text-align:right;font-weight:600;">${funnel.explored3Temas}</td><td style="text-align:right;color:#6b7280;font-size:12px;">${funnel.pctExplored3}%</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">→ 5 temas</td><td style="text-align:right;font-weight:600;">${funnel.explored5Temas}</td><td style="text-align:right;color:#6b7280;font-size:12px;">${funnel.pctExplored5}%</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">→ Compra</td><td style="text-align:right;font-weight:600;">${funnel.purchased}</td><td style="text-align:right;color:#6b7280;font-size:12px;">${funnel.pctPurchased}%</td></tr>
        </table>

        <!-- REVENUE -->
        <h3 style="color:#059669;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">💰 Revenue</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#6b7280;">Compras esta semana</td><td style="text-align:right;font-weight:600;">${infra.business.purchasesWeek}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Revenue semana</td><td style="text-align:right;font-weight:600;">€${infra.business.revenueWeekEur.toFixed(2)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Revenue total</td><td style="text-align:right;font-weight:600;">€${fuelTank.ingresos.toFixed(2)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Conversión</td><td style="text-align:right;font-weight:600;">${conversion.conversionPct}%</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Días medio a conversión</td><td style="text-align:right;font-weight:600;">${conversion.avgDaysToConvert ?? '—'}</td></tr>
        </table>

        <!-- COSTES -->
        <h3 style="color:#d97706;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">⚡ Costes IA</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#6b7280;">Tests free bank (€0)</td><td style="text-align:right;font-weight:600;">${fuelTank.testsFreeBank}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Tests IA</td><td style="text-align:right;font-weight:600;">${fuelTank.testsIA} (€${fuelTank.costeIA.toFixed(2)})</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Coste/test IA</td><td style="text-align:right;font-weight:600;">€${costPerUser.costeMedioTestIA.toFixed(3)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Coste/usuario</td><td style="text-align:right;font-weight:600;">€${costPerUser.costeMedioUsuario.toFixed(2)}</td></tr>
          <tr><td style="padding:4px 0;color:#6b7280;">Margen bruto</td><td style="text-align:right;font-weight:600;${fuelTank.margenPct < 20 ? 'color:#dc2626;' : 'color:#059669;'}">${fuelTank.margenPct.toFixed(1)}%</td></tr>
        </table>

        <!-- ENGAGEMENT -->
        <h3 style="color:#6366f1;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">🎯 Feature Engagement (30d)</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse;">
          ${engagement.slice(0, 7).map(f => `<tr><td style="padding:3px 0;color:#6b7280;">${f.feature}</td><td style="text-align:right;font-weight:600;">${f.count}</td><td style="text-align:right;color:#6b7280;font-size:12px;">${f.pct}%</td></tr>`).join('')}
        </table>

        <!-- INFRA -->
        <h3 style="color:#6b7280;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">${semaphore} Infraestructura</h3>
        <table style="width:100%;font-size:13px;border-collapse:collapse;color:#6b7280;">
          <tr><td style="padding:3px 0;">BD</td><td style="text-align:right;">${infra.db.sizeMB.toFixed(0)} MB / ${infra.db.limitMB} MB</td></tr>
          <tr><td style="padding:3px 0;">MAU</td><td style="text-align:right;">${infra.auth.mau30d} / ${infra.auth.limitMAU.toLocaleString()}</td></tr>
          <tr><td style="padding:3px 0;">Vercel</td><td style="text-align:right;">~${infra.vercel.estimatedInvocationsMonth.toLocaleString()} / ${infra.vercel.limitInvocationsMonth.toLocaleString()}</td></tr>
          <tr><td style="padding:3px 0;">Errores 24h</td><td style="text-align:right;">${infra.errors.totalErrors24h} (${infra.errors.errorRate24h.toFixed(1)}%)</td></tr>
        </table>

        <p style="margin-top:24px;font-size:13px;color:#9ca3af;">
          <a href="https://oporuta.es/admin">Admin Dashboard</a> ·
          <a href="https://oporuta.es/admin/analytics">Analytics</a> ·
          <a href="https://oporuta.es/admin/economics">Economics</a>
        </p>
      </div>
    `

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'OpoRuta <alerts@oporuta.es>',
      to: [ALERT_TO_EMAIL],
      subject: `📊 OpoRuta Digest Semanal — ${weekStart} → ${weekEnd}`,
      html,
    })

    logger.info('Weekly digest email sent')
    return true
  } catch (err) {
    logger.error({ err }, 'Error sending weekly digest')
    return false
  }
}
