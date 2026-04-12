import type { NextConfig } from 'next'

// @sentry/nextjs y @serwist/next desactivados: incompatibles con Turbopack
// (@sentry/nextjs genera output inválido en Turbopack → "Deploying outputs" internal error)
// Re-activar si se migra a webpack o cuando Sentry/Serwist soporten Turbopack oficialmente.

const nextConfig: NextConfig = {
  // standalone output: produces a self-contained build in .next/standalone
  // that can run with `node server.js` without node_modules.
  // Compatible with both Vercel (ignores it) and Docker/Railway deploys.
  output: 'standalone',

  // serverExternalPackages: evita que Next.js bundle-ee estas libs pesadas
  // en CADA serverless function. Vercel sigue incluyéndolas vía nft-tracing
  // pero de forma compartida → deployment mucho más pequeño.
  // In standalone mode, these are copied to .next/standalone/node_modules.
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

  // Rewrite /.well-known/llms.txt → /llms.txt (estándar GEO)
  async rewrites() {
    return [
      {
        source: '/.well-known/llms.txt',
        destination: '/llms.txt',
      },
    ]
  },

  // Redirect www → non-www (301 permanente) para consolidar SEO
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.oporuta.es' }],
        destination: 'https://oporuta.es/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
