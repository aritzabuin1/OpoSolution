/**
 * Logger estructurado para OPTEK — pino.
 *
 * - Producción: JSON (compatible con Vercel logs, Sentry, Datadog)
 * - Desarrollo: pretty-print con colores
 *
 * Ref: directives/OPTEK_security.md §1 — nunca loguear PII sin redactar
 */

import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  browser: { asObject: true },
  base: {
    service: 'OPTEK-web',
    environment: process.env.NODE_ENV ?? 'development',
  },
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
    : undefined,
})

// ─── Redacción de PII en logs (OPTEK_security.md §1) ──────────────────────────

type LogObject = Record<string, unknown>

const SENSITIVE_KEYS = new Set([
  'email',
  'authorization',
  'password',
  'token',
  'apikey',
  'api_key',
  'secret',
])

/**
 * Redacta campos sensibles de un objeto antes de loguearlo.
 * email → [REDACTED]
 * Authorization → [REDACTED]
 * texto_usuario → [TRUNCATED:50chars]
 */
export function redactPII(obj: LogObject): LogObject {
  const result: LogObject = {}

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    if (SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = '[REDACTED]'
    } else if (lowerKey === 'texto_usuario' && typeof value === 'string') {
      result[key] = `[TRUNCATED:${value.slice(0, 50)}...]`
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redactPII(value as LogObject)
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Crea un child logger con requestId para correlacionar logs de una request.
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId })
}
