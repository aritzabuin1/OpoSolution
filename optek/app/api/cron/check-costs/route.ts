import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { getInfraMetrics } from '@/lib/admin/infrastructure'

/**
 * GET /api/cron/check-costs
 *
 * Cron diario (23:00 UTC, ver vercel.json) que:
 *  1. Calcula costes API del día desde api_usage_log
 *  2. Calcula tasa de verificación del pipeline RAG
 *  3. Envía alertas via Resend si: coste > $10 O verificación < 80%
 *
 * Ref: directives/OpoRuta_cost_observability.md §3
 *      PLAN.md §0.10.15, §0.10.20
 *
 * Seguridad: Vercel Cron pasa el CRON_SECRET en Authorization header.
 */

const DAILY_COST_ALERT_USD = 10.0
const VERIFICATION_RATE_ALERT_THRESHOLD = 0.8
const ALERT_TO_EMAIL = process.env.ALERT_EMAIL ?? 'aritz@oporuta.es'

export async function GET(request: NextRequest) {
  // Verificar CRON_SECRET — Vercel lo pasa como "Bearer <secret>"
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn({ path: '/api/cron/check-costs' }, 'Cron unauthorized access attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log = logger.child({ cron: 'check-costs' })
  const supabase = await createServiceClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  try {
    // ── 1. Costes del día ────────────────────────────────────────────────────
    const { data: usageData, error: usageError } = await supabase
      .from('api_usage_log')
      .select('cost_estimated_cents, endpoint')
      .gte('timestamp', `${today}T00:00:00Z`)
      .lte('timestamp', `${today}T23:59:59Z`)

    if (usageError) throw usageError

    const totalCostCents = usageData?.reduce((sum, r) => sum + (r.cost_estimated_cents ?? 0), 0) ?? 0
    const totalCostUSD = totalCostCents / 100
    const costAlert = totalCostUSD > DAILY_COST_ALERT_USD

    // ── 2. Tasa de verificación (0.10.20) ────────────────────────────────────
    // Relación entre logs de endpoint='verification' y llamadas AI totales
    const verificationRows = usageData?.filter((r) => r.endpoint === 'verification') ?? []
    const aiRows = usageData?.filter(
      (r) => r.endpoint !== 'verification' && r.endpoint !== 'unknown'
    ) ?? []
    const verificationRate = aiRows.length > 0 ? verificationRows.length / aiRows.length : 1
    const verificationAlert = aiRows.length >= 5 && verificationRate < VERIFICATION_RATE_ALERT_THRESHOLD

    log.info(
      {
        date: today,
        totalCostCents,
        totalCostUSD: totalCostUSD.toFixed(2),
        costAlert,
        verificationRate: verificationRate.toFixed(3),
        verificationAlert,
        totalAiCalls: aiRows.length,
      },
      'Daily cost check completed'
    )

    // ── 3. §2.23 — Infrastructure RED/YELLOW check ───────────────────────────
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
      { infraSemaphore: infra.semaphore, infraAlerts },
      'Infrastructure check completed'
    )

    // ── 4. Alertas ───────────────────────────────────────────────────────────
    if (costAlert || verificationAlert || infraAlerts.length > 0) {
      await sendAlertEmail({
        today,
        totalCostUSD,
        costAlert,
        verificationRate,
        verificationAlert,
        infraAlerts,
      })
    }

    return NextResponse.json({
      date: today,
      total_cost_usd: totalCostUSD.toFixed(2),
      cost_alert: costAlert,
      verification_rate: Number(verificationRate.toFixed(3)),
      verification_alert: verificationAlert,
      ai_calls_today: aiRows.length,
      infra_semaphore: infra.semaphore,
      infra_alerts: infraAlerts,
    })
  } catch (err) {
    log.error({ err }, 'Cron check-costs failed')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── Email alerts ─────────────────────────────────────────────────────────────

async function sendAlertEmail(params: {
  today: string
  totalCostUSD: number
  costAlert: boolean
  verificationRate: number
  verificationAlert: boolean
  infraAlerts: string[]
}) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn(
      { params },
      'RESEND_API_KEY not configured — alert skipped. Set it in .env.local to enable email alerts.'
    )
    return
  }

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
    subject: `⚠️ OpoRuta Alert — ${params.today}`,
    html: `
      <h2>Alertas OpoRuta — ${params.today}</h2>
      <ul>${alerts.map((a) => `<li>${a}</li>`).join('')}</ul>
      <p>Revisa <a href="https://supabase.com/dashboard/project/yaxfgdvnfirazrguiykz/editor">api_usage_log</a> para más detalles.</p>
    `,
    text: `Alertas OpoRuta ${params.today}:\n\n${alerts.join('\n')}`,
  })

  logger.info({ alerts }, 'Alert email sent via Resend')
}
