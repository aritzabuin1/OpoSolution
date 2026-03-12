import type { MetadataRoute } from 'next'
import { blogPosts } from '@/content/blog/posts'

/**
 * Sitemap dinámico (§1.21.2, §1.21.6)
 * Servido automáticamente por Next.js en /sitemap.xml
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// Exámenes oficiales INAP disponibles (§1.21.6 PRIORIDAD 1) — ruta: /examenes-oficiales/[slug]
const EXAMEN_SLUGS = ['inap-2024', 'inap-2022', 'inap-2019', 'inap-2018']

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Rutas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/examenes-oficiales`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/herramientas/calculadora-nota-auxiliar-administrativo`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/legal/privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${APP_URL}/legal/terminos`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${APP_URL}/legal/cookies`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // Rutas dinámicas: exámenes oficiales INAP (alta prioridad SEO)
  const examenesRoutes: MetadataRoute.Sitemap = EXAMEN_SLUGS.map((slug) => ({
    url: `${APP_URL}/examenes-oficiales/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }))

  // Rutas dinámicas: artículos del blog
  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${APP_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...examenesRoutes, ...blogRoutes]
}
