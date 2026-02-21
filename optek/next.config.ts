import type { NextConfig } from 'next'
import path from 'path'
import { withSentryConfig } from '@sentry/nextjs'
import withSerwist from '@serwist/next'

const nextConfig: NextConfig = {
  turbopack: {
    // Fijar el root al directorio optek para evitar conflicto con lockfile del workspace raíz
    root: path.resolve(__dirname),
  },
}

// PWA — Serwist (desactivado en development para compatibilidad con Turbopack)
const applyPWA =
  process.env.NODE_ENV === 'development'
    ? (config: NextConfig) => config
    : withSerwist({ swSrc: 'app/sw.ts', swDest: 'public/sw.js' })

// Sentry — requiere NEXT_PUBLIC_SENTRY_DSN en .env.local para activarse
export default withSentryConfig(applyPWA(nextConfig), {
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
})
