import type { MetadataRoute } from 'next'

/**
 * robots.ts — §2.15.7
 *
 * Next.js genera /robots.txt automáticamente desde este archivo.
 * Reglas:
 *   - Rutas públicas (landing, blog, login, register, simulacros): indexables por todos
 *   - /llms.txt y /api/info: explícitamente accesibles para LLM crawlers
 *   - /dashboard, /tests, /corrector, etc.: protegidos (detrás de auth, no indexar)
 *   - /admin: nunca indexar
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export default function robots(): MetadataRoute.Robots {
  const publicAllow = [
    '/',
    '/blog',
    '/blog/',
    '/login',
    '/register',
    '/examenes-oficiales',
    '/examenes-oficiales/',
    '/llms.txt',
    '/llms-full.txt',
    '/oposiciones/',
    '/herramientas/',
    '/simulacros-oposiciones',
    '/oep-2026',
    '/precios',
    '/preguntas-frecuentes',
    '/ley',
    '/ley/',
    '/api/info',
    '/api/og',
  ]

  // /raw endpoints: block from Google (duplicate content), allow for LLM bots
  const rawDisallow = ['/blog/*/raw']

  const protectedDisallow = [
    '/dashboard',
    '/tests',
    '/corrector',
    '/psicotecnicos',
    '/flashcards',
    '/cazatrampas',
    '/logros',
    '/cuenta',
    '/reto-diario',
    '/radar',
    '/admin',
    '/primer-test',
    '/forgot-password',
    '/reset-password',
    '/auth/',
    '/api/ai/',
    '/api/stripe/',
    '/api/user/',
    '/api/cron/',
    '/api/tests/',
    '/api/cazatrampas/',
    '/api/flashcards/',
    '/api/notifications/',
    '/api/admin/',
    '/api/reto-diario/',
  ]

  return {
    rules: [
      // Default rule for all bots (block /raw to avoid duplicate content in Google)
      {
        userAgent: '*',
        allow: publicAllow,
        disallow: [...protectedDisallow, ...rawDisallow],
      },
      // AI search bots — explicitly allow /raw for plaintext parsing
      ...(
        ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'] as const
      ).map((bot) => ({
        userAgent: bot,
        allow: [...publicAllow, '/blog/*/raw'],
        disallow: protectedDisallow,
      })),
      // Scraping/training bots — block
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Bytespider',
        disallow: ['/'],
      },
    ],
    sitemap: [`${APP_URL}/sitemap-index.xml`, `${APP_URL}/sitemap.xml`, `${APP_URL}/ley/sitemap.xml`],
    host: APP_URL,
  }
}
