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
      // Consolidación de posts duplicados (canibalización SEO).
      // El destino conserva el clic histórico de Search Console — los slugs
      // de origen se eliminaron de content/blog/posts.ts en la misma tanda.
      {
        source: '/blog/plazas-correos-2026-por-provincia',
        destination: '/blog/plazas-correos-2026-por-provincia-distribucion',
        permanent: true,
      },
      {
        source: '/blog/examen-correos-sin-penalizacion-como-aprobar',
        destination: '/blog/examen-correos-sin-penalizacion-estrategia-aprobar',
        permanent: true,
      },
      {
        source: '/blog/sueldo-funcionario-justicia-2026',
        destination: '/blog/sueldo-funcionario-justicia-2026-auxilio-tramitacion-gestion',
        permanent: true,
      },
      {
        source: '/blog/lo-1-2025-cambios-temario-justicia-oposiciones',
        destination: '/blog/cambios-temario-justicia-2026-lo-1-2025',
        permanent: true,
      },
      {
        source: '/blog/psicotecnicos-correos-2026-tipos-ejemplos-practica',
        destination: '/blog/psicotecnicos-correos-tipos-ejemplos',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
