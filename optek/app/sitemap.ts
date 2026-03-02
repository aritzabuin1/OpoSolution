import type { MetadataRoute } from 'next'
import { blogPosts } from '@/content/blog/posts'

/**
 * Sitemap dinámico (§1.21.2, §1.21.6)
 * Servido automáticamente por Next.js en /sitemap.xml
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// Simulacros oficiales INAP disponibles (§1.21.6 PRIORIDAD 1)
const SIMULACRO_SLUGS = ['inap-2024', 'inap-2023', 'inap-2022', 'inap-2021']

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
      url: `${APP_URL}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${APP_URL}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${APP_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/simulacros`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ]

  // Rutas dinámicas: simulacros oficiales INAP (alta prioridad SEO)
  const simulacroRoutes: MetadataRoute.Sitemap = SIMULACRO_SLUGS.map((slug) => ({
    url: `${APP_URL}/simulacros/${slug}`,
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

  return [...staticRoutes, ...simulacroRoutes, ...blogRoutes]
}
