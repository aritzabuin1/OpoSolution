import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import withSerwist from '@serwist/next'

const nextConfig: NextConfig = {}

// PWA — Serwist (desactivado en development para compatibilidad con Turbopack)
const applyPWA =
  process.env.NODE_ENV === 'development'
    ? (config: NextConfig) => config
    : withSerwist({ swSrc: 'app/sw.ts', swDest: 'public/sw.js' })

// Sentry — requiere NEXT_PUBLIC_SENTRY_DSN en .env.local para activarse
export default withSentryConfig(applyPWA(nextConfig), {
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    // Reemplaza los deprecated disableLogger y automaticVercelMonitors
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: false,
  },
})
