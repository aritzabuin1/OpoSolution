import { createServiceClient } from '@/lib/supabase/server'
import { getInfraMetrics } from '@/lib/admin/infrastructure'
import { logger } from '@/lib/logger'

/**
 * lib/admin/cost-check.ts — §2.23 (extraído de /api/cron/check-costs)
 *
 * Lógica reutilizable de monitorización de costes + infraestructura.
 * Llamada desde:
 *   - GET /api/cron/check-costs (ruta manual con CRON_SECRET)
 *   - GET /api/cron/boe-watch  (cron 07:00 UTC — piggyback del día anterior)
 *
 * Parámetro `date`: fecha YYYY-MM-DD en UTC a analizar (default: ayer).
 */

const DAILY_COST_ALERT_USD = 10.0
const VERIFICATION_RATE_ALERT_THRESHOLD = 0.8
const ALERT_TO_EMAIL = process.env.ALERT_EMAIL ?? 'aritz@oporuta.es'

export interface CostCheckResult {
  date: string
  total_cost_usd: string
  cost_alert: boolean
  verification_rate: number
  verification_alert: boolean
  ai_calls: number
  infra_semaphore: 'ok' | 'warning' | 'error'
  infra_alerts: string[]
  email_sent: boolean
}

export async function runCostCheck(date?: string): Promise<CostCheckResult> {
  const log = logger.child({ fn: 'runCostCheck' })
  const supabase = await createServiceClient()

  // Por defecto analizar ayer (cuando se llama desde boe-watch a las 07:00 UTC,
  // ayer ya está completo; cuando se llama desde check-costs a las 23:00, usar hoy)
  const target = date ?? (() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().split('T')[0]
  })()

  // ── Costes del día ─────────────────────────────────────────────────────────
  const { data: usageData, error: usageError } = await supabase
    .from('api_usage_log')
    .select('cost_estimated_cents, endpoint')
    .gte('timestamp', `${target}T00:00:00Z`)
    .lte('timestamp', `${target}T23:59:59Z`)

  if (usageError) throw usageError

  const totalCostCents = usageData?.reduce((sum, r) => sum + (r.cost_estimated_cents ?? 0), 0) ?? 0
  const totalCostUSD = totalCostCents / 100
  const costAlert = totalCostUSD > DAILY_COST_ALERT_USD

  // ── Tasa de verificación ───────────────────────────────────────────────────
  const verificationRows = usageData?.filter((r) => r.endpoint === 'verification') ?? []
  const aiRows = usageData?.filter(
    (r) => r.endpoint !== 'verification' && r.endpoint !== 'unknown'
  ) ?? []
  const verificationRate = aiRows.length > 0 ? verificationRows.length / aiRows.length : 1
  const verificationAlert = aiRows.length >= 5 && verificationRate < VERIFICATION_RATE_ALERT_THRESHOLD

  // ── Infraestructura §2.23 ─────────────────────────────────────────────────
  const infra = await getInfraMetrics()
  const infraAlerts: string[] = []

  if (infra.db.status !== 'ok')
    infraAlerts.push(`${infra.db.status === 'error' ? '🔴' : '🟡'} BD: ${infra.db.pct.toFixed(1)}% de 500 MB`)
  if (infra.auth.status !== 'ok')
    infraAlerts.push(`${infra.auth.status === 'error' ? '🔴' : '🟡'} MAU: ${infra.auth.mau30d.toLocaleString()} de 50.000`)
  if (infra.upstash.status !== 'ok')
    infraAlerts.push(`${infra.upstash.status === 'error' ? '🔴' : '🟡'} Upstash: ~${infra.upstash.estimatedCmdsDay.toLocaleString()} cmd/día`)
  if (infra.ai.status !== 'ok')
    infraAlerts.push(`${infra.ai.status === 'error' ? '🔴' : '🟡'} Costes IA mes: €${infra.ai.costsMonth.toFixed(2)}`)

  log.info(
    {
      date: target,
      totalCostUSD: totalCostUSD.toFixed(2),
      costAlert,
      verificationRate: verificationRate.toFixed(3),
      verificationAlert,
      infraSemaphore: infra.semaphore,
      infraAlerts,
    },
    'runCostCheck completed'
  )

  // ── Alertas por email ─────────────────────────────────────────────────────
  let emailSent = false
  if (costAlert || verificationAlert || infraAlerts.length > 0) {
    emailSent = await sendAlertEmail({
      date: target,
      totalCostUSD,
      costAlert,
      verificationRate,
      verificationAlert,
      infraAlerts,
    })
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
    email_sent: emailSent,
  }
}

async function sendAlertEmail(params: {
  date: string
  totalCostUSD: number
  costAlert: boolean
  verificationRate: number
  verificationAlert: boolean
  infraAlerts: string[]
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn({ params }, 'RESEND_API_KEY no configurado — alerta omitida')
    return false
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const alerts: string[] = []
    if (params.costAlert) {
      alerts.push(
        `💰 COSTE DIARIO: $${params.totalCostUSD.toFixed(2)} (umbral: $${DAILY_COST_ALERT_USD.toFixed(2)})`
      )
    }
    if (params.verificationAlert) {
      alerts.push(
        `🔍 TASA VERIFICACIÓN: ${(params.verificationRate * 100).toFixed(1)}% (umbral: ${(VERIFICATION_RATE_ALERT_THRESHOLD * 100).toFixed(0)}%)`
      )
    }
    alerts.push(...params.infraAlerts)

    await resend.emails.send({
      from: 'OpoRuta Alerts <alerts@oporuta.es>',
      to: [ALERT_TO_EMAIL],
      subject: `⚠️ OpoRuta Alert — ${params.date}`,
      html: `
        <h2>Alertas OpoRuta — ${params.date}</h2>
        <ul>${alerts.map((a) => `<li>${a}</li>`).join('')}</ul>
        <p>Revisa el <a href="https://oporuta.es/admin/economics">Admin Dashboard</a> para más detalles.</p>
      `,
      text: `Alertas OpoRuta ${params.date}:\n\n${alerts.join('\n')}`,
    })

    logger.info({ alerts }, 'Alert email enviado via Resend')
    return true
  } catch (err) {
    logger.error({ err }, 'Error enviando alert email')
    return false
  }
}
