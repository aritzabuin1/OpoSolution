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
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog',
          '/blog/',
          '/login',
          '/register',
          '/simulacros',
          '/llms.txt',
          '/api/info',
          '/api/og',
        ],
        disallow: [
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
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  }
}
