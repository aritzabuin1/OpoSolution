import type { MetadataRoute } from 'next'
import { blogPosts } from '@/content/blog/posts'

/**
 * Sitemap dinámico (§1.21.2, §1.21.6)
 * Servido automáticamente por Next.js en /sitemap.xml
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// Exámenes oficiales INAP disponibles (§1.21.6 PRIORIDAD 1) — ruta: /examenes-oficiales/[slug]
const EXAMEN_SLUGS = ['inap-2024', 'inap-2022', 'inap-2019', 'inap-2018', 'inap-c1-2024', 'inap-c1-2022', 'inap-c1-2019']

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
      url: `${APP_URL}/herramientas`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/herramientas/calculadora-nota-auxiliar-administrativo`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/herramientas/calculadora-nota-administrativo-estado`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/herramientas/calculadora-nota-hacienda`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/herramientas/calculadora-nota-correos`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/herramientas/calculadora-nota-justicia`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/simulacros-oposiciones`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oep-2026`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Data journalism (F5.T2) — datasets propios GEO-citables
    {
      url: `${APP_URL}/datos`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/datos/analisis-inap`,
      lastModified: new Date('2026-04-19'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/datos/mapa-destinos`,
      lastModified: new Date('2026-04-19'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/datos/plazas-age-historico`,
      lastModified: new Date('2026-04-19'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/precios`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Catálogo de oposiciones (fuente canónica para LLMs)
    {
      url: `${APP_URL}/oposiciones`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Sub-landings por oposición (SEO critical)
    {
      url: `${APP_URL}/oposiciones/administracion`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/correos`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/justicia`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/justicia/auxilio-judicial`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/justicia/tramitacion-procesal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/justicia/gestion-procesal`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/hacienda`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/penitenciarias`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/seguridad`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/seguridad/ertzaintza`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/seguridad/guardia-civil`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/seguridad/policia-nacional`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/oposiciones/seguridad/personalidad-policial`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/preguntas-frecuentes`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
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
    lastModified: new Date(post.dateModified ?? post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...examenesRoutes, ...blogRoutes]
}
