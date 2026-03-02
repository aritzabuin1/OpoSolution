import type { NextConfig } from 'next'

// @sentry/nextjs y @serwist/next desactivados: incompatibles con Turbopack
// (@sentry/nextjs genera output inválido en Turbopack → "Deploying outputs" internal error)
// Re-activar si se migra a webpack o cuando Sentry/Serwist soporten Turbopack oficialmente.

const nextConfig: NextConfig = {
  // serverExternalPackages: evita que Next.js bundle-ee estas libs pesadas
  // en CADA serverless function. Vercel sigue incluyéndolas vía nft-tracing
  // pero de forma compartida → deployment mucho más pequeño.
  serverExternalPackages: [
    'pdf-parse',
    'pdfjs-dist',
    '@anthropic-ai/sdk',
    'openai',
    'stripe',
    '@supabase/supabase-js',
    '@supabase/ssr',
    '@upstash/redis',
    '@upstash/ratelimit',
    'resend',
    'pino',
  ],
}

export default nextConfig
