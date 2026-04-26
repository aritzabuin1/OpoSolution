import type { MetadataRoute } from 'next'
import { blogPosts } from '@/content/blog/posts'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Sitemap dinámico (§1.21.2, §1.21.6)
 * Servido automáticamente por Next.js en /sitemap.xml
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// Exámenes oficiales INAP disponibles (§1.21.6 PRIORIDAD 1) — ruta: /examenes-oficiales/[slug]
const EXAMEN_SLUGS = ['inap-2024', 'inap-2022', 'inap-2019', 'inap-2018', 'inap-c1-2024', 'inap-c1-2022', 'inap-c1-2019']

// Mapeo anio→examenSlug para construir URLs de pregunta. Si añades nuevos
// exámenes, actualiza también EXAMEN_SLUGS arriba y EXAMEN_META en la página.
const EXAMEN_SLUG_BY_KEY: Record<string, string> = {
  'C2-2024': 'inap-2024',
  'C2-2022': 'inap-2022',
  'C2-2019': 'inap-2019',
  'C2-2018': 'inap-2018',
  'C1-2024': 'inap-c1-2024',
  'C1-2022': 'inap-c1-2022',
  'C1-2019': 'inap-c1-2019',
}

async function getPreguntaRoutes(now: Date): Promise<MetadataRoute.Sitemap> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any
    const { data } = await supabase
      .from('preguntas_oficiales')
      .select('numero, examen_id, tema_id, examenes_oficiales!inner(anio, oposicion_id, oposiciones!inner(slug))')
      .not('tema_id', 'is', null)

    const rows = (data ?? []) as Array<{
      numero: number
      examen_id: string
      tema_id: string | null
      examenes_oficiales: {
        anio: number
        oposicion_id: string
        oposiciones: { slug: string } | { slug: string }[]
      } | { anio: number; oposicion_id: string; oposiciones: { slug: string } | { slug: string }[] }[]
    }>

    const routes: MetadataRoute.Sitemap = []
    for (const r of rows) {
      const exam = Array.isArray(r.examenes_oficiales) ? r.examenes_oficiales[0] : r.examenes_oficiales
      const oposObj = Array.isArray(exam.oposiciones) ? exam.oposiciones[0] : exam.oposiciones
      const oposSlug = oposObj.slug
      const cuerpoLetter = oposSlug === 'administrativo-estado' ? 'C1' : oposSlug === 'aux-admin-estado' ? 'C2' : null
      if (!cuerpoLetter) continue
      const key = `${cuerpoLetter}-${exam.anio}`
      const examenSlug = EXAMEN_SLUG_BY_KEY[key]
      if (!examenSlug) continue
      routes.push({
        url: `${APP_URL}/examenes-oficiales/${examenSlug}/preguntas/${r.numero}`,
        lastModified: now,
        changeFrequency: 'yearly' as const,
        priority: 0.7,
      })
    }
    return routes
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // pSEO v3 — preguntas de examen analizadas (alta prioridad)
  const preguntaRoutes = await getPreguntaRoutes(now)

  // pSEO v3 Tipo 2 — histórico de artículos (218 URLs cross-ref)
  const cross = await import('@/data/seo/indexable-cross-ref.json')
  const { getEnabledLaws } = await import('@/data/seo/ley-registry')
  const lawsByName = new Map(getEnabledLaws().map((l) => [l.leyNombre, l]))
  const historicoRoutes: MetadataRoute.Sitemap = []
  for (const key of cross.keys ?? []) {
    const [leyNombre, articuloNumero] = key.split(':')
    const ley = lawsByName.get(leyNombre)
    if (!ley) continue
    historicoRoutes.push({
      url: `${APP_URL}/historico/${ley.slug}/articulo/${articuloNumero}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })
  }

  // pSEO v3 Tipo 3 — frecuencia por tema (solo temas con apariciones > 0)
  const frecuenciaRoutes: MetadataRoute.Sitemap = []
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any
    const { data } = await supabase
      .from('frecuencias_temas')
      .select('temas!inner(numero, oposiciones!inner(slug))')
      .gt('num_apariciones', 0)
    const rows = (data ?? []) as Array<{
      temas: {
        numero: number
        oposiciones: { slug: string } | { slug: string }[]
      } | { numero: number; oposiciones: { slug: string } | { slug: string }[] }[]
    }>
    for (const r of rows) {
      const tema = Array.isArray(r.temas) ? r.temas[0] : r.temas
      const opos = Array.isArray(tema.oposiciones) ? tema.oposiciones[0] : tema.oposiciones
      frecuenciaRoutes.push({
        url: `${APP_URL}/frecuencia/${opos.slug}/tema/${tema.numero}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })
    }
  } catch { /* sitemap es resiliente */ }

  return [
    ...staticRoutes,
    ...examenesRoutes,
    ...preguntaRoutes,
    ...historicoRoutes,
    ...frecuenciaRoutes,
    ...blogRoutes,
  ]
}
