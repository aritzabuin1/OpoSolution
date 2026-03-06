import { logger } from '@/lib/logger'

export type AlertChannel = 'email' | 'log'
export type AlertSeverity = 'critical' | 'warning' | 'info'

interface Alert {
  severity: AlertSeverity
  title: string
  message: string
  metadata?: Record<string, unknown>
}

/**
 * Dispatches alerts through configured channels.
 * Currently supports: structured logging (always) + email (via Resend).
 * Future: Slack webhook (add SLACK_WEBHOOK_URL env var).
 */
export async function sendAlert(alert: Alert): Promise<void> {
  // Always log
  const logFn = alert.severity === 'critical' ? logger.error.bind(logger)
    : alert.severity === 'warning' ? logger.warn.bind(logger)
    : logger.info.bind(logger)

  logFn({ alert: alert.title, ...alert.metadata }, `[ALERT] ${alert.message}`)

  // Email for critical alerts — uses sendCostAlert from cost-check if available
  if (alert.severity === 'critical' && process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'OpoRuta Alertas <alertas@oporuta.es>',
        to: process.env.ADMIN_EMAIL ?? 'aritz@oporuta.es',
        subject: `[ALERT] ${alert.title}`,
        text: alert.message,
      })
    } catch {
      logger.warn('Alert email dispatch failed')
    }
  }

  // Future: Slack webhook
  // if (process.env.SLACK_WEBHOOK_URL) { ... }
}
