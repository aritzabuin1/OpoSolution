import * as Sentry from '@sentry/nextjs'

/**
 * Sentry — configuración cliente (browser).
 * 0.10.5-0.10.7: trazas 10% en producción para respetar cuota free tier.
 * Ref: directives/OPTEK_security.md §3 — no loguear PII en Sentry.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // DDIA Observability: 10% de trazas en prod (0.10.7), 100% en dev para debugging
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay solo en errores (100%) y 1% de sesiones normales
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,

  integrations: [Sentry.replayIntegration()],

  // No inicializar si no hay DSN (dev local sin Sentry configurado)
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
