import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import withSerwist from '@serwist/next'

const nextConfig: NextConfig = {}

// PWA — Serwist desactivado temporalmente (causa "Internal Error" en Vercel al deployar)
// Re-activar cuando se resuelva la compatibilidad Serwist + Vercel output
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _withSerwistDisabled = withSerwist
const applyPWA = (config: NextConfig) => config

// Sentry — requiere NEXT_PUBLIC_SENTRY_DSN en .env.local para activarse
export default withSentryConfig(applyPWA(nextConfig), {
  silent: !process.env.CI,
  widenClientFileUpload: true,
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
  },
  disableLogger: true,
  // Disable sourcemap upload in Vercel to prevent "Internal Error" timeouts
  // We don't have an auth token configured anyway
  sourcemaps: {
    disable: true,
  },
  webpack: {
    // Reemplaza los deprecated disableLogger y automaticVercelMonitors
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: false,
  },
})
