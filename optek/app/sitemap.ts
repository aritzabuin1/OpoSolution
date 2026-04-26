import type { MetadataRoute } from 'next'
import { blogPosts } from '@/content/blog/posts'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Sitemap dinámico (§1.21.2, §1.21.6)
 * Servido automáticamente por Next.js en /sitemap.xml
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

// Sitemap dinámico: regenera cada 24h en runtime (no build-time) para que el
// service-role-key esté disponible y los queries a Supabase devuelvan datos.
export const revalidate = 86400
export const dynamic = 'force-dynamic'

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

    // Nota: NO usamos nested joins. Supabase tiene timeouts y row limits que
    // hacen que `examenes_oficiales!inner(...oposiciones!inner(slug))` falle
    // silenciosamente en build. Hacemos 3 queries planas y resolvemos en JS.

    const { data: oposiciones, error: errOpos } = await supabase
      .from('oposiciones')
      .select('id, slug')
    if (errOpos) console.error('[sitemap] oposiciones error', errOpos)
    const oposById = new Map<string, string>(
      (oposiciones ?? []).map((o: { id: string; slug: string }) => [o.id, o.slug]),
    )

    const { data: examenes, error: errEx } = await supabase
      .from('examenes_oficiales')
      .select('id, anio, oposicion_id')
    if (errEx) console.error('[sitemap] examenes error', errEx)

    type ExamMeta = { anio: number; oposSlug: string }
    const examById = new Map<string, ExamMeta>()
    for (const e of (examenes ?? []) as Array<{ id: string; anio: number; oposicion_id: string }>) {
      const oposSlug = oposById.get(e.oposicion_id)
      if (oposSlug) examById.set(e.id, { anio: e.anio, oposSlug })
    }

    const { data: preguntas, error: errP } = await supabase
      .from('preguntas_oficiales')
      .select('numero, examen_id, tema_id')
      .not('tema_id', 'is', null)
      .range(0, 9999)
    if (errP) console.error('[sitemap] preguntas error', errP)

    const routes: MetadataRoute.Sitemap = []
    for (const r of (preguntas ?? []) as Array<{ numero: number; examen_id: string }>) {
      const exam = examById.get(r.examen_id)
      if (!exam) continue
      const cuerpoLetter = exam.oposSlug === 'administrativo-estado' ? 'C1' : exam.oposSlug === 'aux-admin-estado' ? 'C2' : null
      if (!cuerpoLetter) continue
      const examenSlug = EXAMEN_SLUG_BY_KEY[`${cuerpoLetter}-${exam.anio}`]
      if (!examenSlug) continue
      routes.push({
        url: `${APP_URL}/examenes-oficiales/${examenSlug}/preguntas/${r.numero}`,
        lastModified: now,
        changeFrequency: 'yearly' as const,
        priority: 0.7,
      })
    }
    return routes
  } catch (e) {
    console.error('[sitemap] getPreguntaRoutes failed', e)
    return []
  }
}

async function getFrecuenciaRoutes(now: Date): Promise<MetadataRoute.Sitemap> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any

    const { data: frecuencias, error: errF } = await supabase
      .from('frecuencias_temas')
      .select('tema_id')
      .gt('num_apariciones', 0)
      .range(0, 9999)
    if (errF) console.error('[sitemap] frecuencias error', errF)

    const temaIds = (frecuencias ?? []).map((f: { tema_id: string }) => f.tema_id)
    if (temaIds.length === 0) return []

    const { data: temas, error: errT } = await supabase
      .from('temas')
      .select('id, numero, oposicion_id')
      .in('id', temaIds)
    if (errT) console.error('[sitemap] temas error', errT)

    const oposIds = Array.from(
      new Set((temas ?? []).map((t: { oposicion_id: string }) => t.oposicion_id)),
    )
    const { data: oposiciones, error: errO } = await supabase
      .from('oposiciones')
      .select('id, slug')
      .in('id', oposIds)
    if (errO) console.error('[sitemap] oposiciones error', errO)
    const oposById = new Map<string, string>(
      (oposiciones ?? []).map((o: { id: string; slug: string }) => [o.id, o.slug]),
    )

    const routes: MetadataRoute.Sitemap = []
    for (const t of (temas ?? []) as Array<{ numero: number; oposicion_id: string }>) {
      const slug = oposById.get(t.oposicion_id)
      if (!slug) continue
      routes.push({
        url: `${APP_URL}/frecuencia/${slug}/tema/${t.numero}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })
    }
    return routes
  } catch (e) {
    console.error('[sitemap] getFrecuenciaRoutes failed', e)
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
  const frecuenciaRoutes = await getFrecuenciaRoutes(now)

  return [
    ...staticRoutes,
    ...examenesRoutes,
    ...preguntaRoutes,
    ...historicoRoutes,
    ...frecuenciaRoutes,
    ...blogRoutes,
  ]
}
