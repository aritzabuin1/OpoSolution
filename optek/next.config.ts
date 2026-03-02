import type { NextConfig } from 'next'

// @sentry/nextjs y @serwist/next desactivados: incompatibles con Turbopack
// (@sentry/nextjs genera output inválido en Turbopack → "Deploying outputs" internal error)
// Re-activar si se migra a webpack o cuando Sentry/Serwist soporten Turbopack oficialmente.

const nextConfig: NextConfig = {}

export default nextConfig
