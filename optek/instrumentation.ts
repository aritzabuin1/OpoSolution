/**
 * Next.js instrumentation — punto de entrada para Sentry en server + edge.
 * Cargado automáticamente por Next.js antes de inicializar la aplicación.
 * Ref: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// onRequestError (Next.js 15+ error capture) disponible en @sentry/nextjs >= 8.x
// Descomentar cuando Sentry DSN esté configurado y se verifique compatibilidad:
// export { onRequestError } from '@sentry/nextjs'
