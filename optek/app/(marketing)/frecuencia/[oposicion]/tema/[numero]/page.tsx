/**
 * pSEO v3 — Tipo 3: frecuencia de un tema en exámenes oficiales.
 *
 * URL: /frecuencia/[oposicion]/tema/[numero]
 *
 * Information gain (proprietario):
 *   - "El Tema X de la oposición Y ha sido preguntado N veces en INAP"
 *   - Años en que se ha caído
 *   - Lista de preguntas reales que han salido de este tema (link a pregunta-N pages)
 *
 * Indexabilidad: solo si num_apariciones > 0 en frecuencias_temas.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/server'
import { ArrowRight, Calendar, FileText, TrendingUp } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const revalidate = 86400

interface Props {
  params: Promise<{ oposicion: string; numero: string }>
}

const NOINDEX: Metadata = { robots: { index: false, follow: true } }

// Mapeo oposicion-slug → label público
const OPOSICION_LABEL: Record<string, string> = {
  'aux-admin-estado': 'Auxiliar Administrativo del Estado',
  'administrativo-estado': 'Administrativo del Estado',
}

// Mapeo oposicion-slug + anio → examen-slug (para enlazar a pregunta-N)
const EXAMEN_SLUG: Record<string, string> = {
  'aux-admin-estado-2024': 'inap-2024',
  'aux-admin-estado-2022': 'inap-2022',
  'aux-admin-estado-2019': 'inap-2019',
  'aux-admin-estado-2018': 'inap-2018',
  'administrativo-estado-2024': 'inap-c1-2024',
  'administrativo-estado-2022': 'inap-c1-2022',
  'administrativo-estado-2019': 'inap-c1-2019',
}

interface FrecuenciaTema {
  temaId: string
  numero: number
  titulo: string
  descripcion: string | null
  oposicionSlug: string
  numApariciones: number
  pctTotal: number
  anios: number[]
  ultimaAparicion: number | null
  preguntas: { numero: number; enunciado: string; anio: number; oposicionSlug: string }[]
}

async function fetchFrecuenciaTema(oposicionSlug: string, numero: number): Promise<FrecuenciaTema | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  const { data: opos } = await supabase
    .from('oposiciones')
    .select('id, slug')
    .eq('slug', oposicionSlug)
    .single()
  if (!opos?.id) return null

  const { data: tema } = await supabase
    .from('temas')
    .select('id, numero, titulo, descripcion')
    .eq('oposicion_id', opos.id)
    .eq('numero', numero)
    .maybeSingle()
  if (!tema) return null

  const { data: freq } = await supabase
    .from('frecuencias_temas')
    .select('num_apariciones, pct_total, anios, ultima_aparicion')
    .eq('tema_id', tema.id)
    .gt('num_apariciones', 0)
    .maybeSingle()
  if (!freq) return null

  // Preguntas reales preguntadas de este tema
  const { data: preguntasRaw } = await supabase
    .from('preguntas_oficiales')
    .select('numero, enunciado, examenes_oficiales!inner(anio, oposicion_id, oposiciones!inner(slug))')
    .eq('tema_id', tema.id)
    .order('numero', { ascending: true })
    .limit(20)

  const preguntas = ((preguntasRaw ?? []) as Array<{
    numero: number
    enunciado: string
    examenes_oficiales: {
      anio: number
      oposiciones: { slug: string } | { slug: string }[]
    } | { anio: number; oposiciones: { slug: string } | { slug: string }[] }[]
  }>).map((row) => {
    const exam = Array.isArray(row.examenes_oficiales) ? row.examenes_oficiales[0] : row.examenes_oficiales
    const oposObj = Array.isArray(exam.oposiciones) ? exam.oposiciones[0] : exam.oposiciones
    return {
      numero: row.numero,
      enunciado: row.enunciado,
      anio: exam.anio,
      oposicionSlug: oposObj.slug,
    }
  })

  return {
    temaId: tema.id,
    numero: tema.numero,
    titulo: tema.titulo,
    descripcion: tema.descripcion,
    oposicionSlug,
    numApariciones: freq.num_apariciones,
    pctTotal: freq.pct_total,
    anios: Array.isArray(freq.anios) ? freq.anios : [],
    ultimaAparicion: freq.ultima_aparicion,
    preguntas,
  }
}

export async function generateStaticParams() {
  // Pre-render solo temas con num_apariciones > 0. Listado dinámico desde BD.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any
    const { data } = await supabase
      .from('frecuencias_temas')
      .select('tema_id, temas!inner(numero, oposiciones!inner(slug))')
      .gt('num_apariciones', 0)

    const params: { oposicion: string; numero: string }[] = []
    const rows = (data ?? []) as Array<{
      tema_id: string
      temas: {
        numero: number
        oposiciones: { slug: string } | { slug: string }[]
      } | { numero: number; oposiciones: { slug: string } | { slug: string }[] }[]
    }>
    for (const r of rows) {
      const tema = Array.isArray(r.temas) ? r.temas[0] : r.temas
      const opos = Array.isArray(tema.oposiciones) ? tema.oposiciones[0] : tema.oposiciones
      params.push({ oposicion: opos.slug, numero: String(tema.numero) })
    }
    return params
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { oposicion, numero } = await params
  const numInt = Number(numero)
  if (!Number.isInteger(numInt) || numInt < 1) return NOINDEX

  const data = await fetchFrecuenciaTema(oposicion, numInt)
  if (!data) return NOINDEX

  const oposLabel = OPOSICION_LABEL[oposicion] ?? oposicion
  const title = `Tema ${data.numero} (${data.titulo}) en exámenes — ${data.numApariciones} apariciones`
  const description = `Frecuencia del Tema ${data.numero} de ${oposLabel} en exámenes oficiales INAP. ${data.numApariciones} apariciones, ${data.preguntas.length} preguntas reales analizadas. Última: ${data.ultimaAparicion ?? '—'}.`
  const canonical = `${APP_URL}/frecuencia/${oposicion}/tema/${numInt}`

  return {
    title: `${title} | OpoRuta`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      images: [{ url: `${APP_URL}/api/og?tipo=test&tema=${encodeURIComponent(`Tema ${data.numero} INAP`)}`, width: 1200, height: 630 }],
    },
  }
}

export default async function FrecuenciaTemaPage({ params }: Props) {
  const { oposicion, numero } = await params
  const numInt = Number(numero)
  if (!Number.isInteger(numInt) || numInt < 1) notFound()

  const data = await fetchFrecuenciaTema(oposicion, numInt)
  if (!data) notFound()

  const oposLabel = OPOSICION_LABEL[oposicion] ?? oposicion
  const aniosOrdenados = [...data.anios].sort((a, b) => b - a)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonLd: Record<string, any>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `Frecuencia del Tema ${data.numero} (${data.titulo}) en exámenes ${oposLabel}`,
      description: `Histórico de apariciones del Tema ${data.numero} en exámenes oficiales.`,
      url: `${APP_URL}/frecuencia/${oposicion}/tema/${numInt}`,
      creator: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'OpoRuta', item: APP_URL },
        { '@type': 'ListItem', position: 2, name: 'Frecuencias', item: `${APP_URL}/frecuencia` },
        { '@type': 'ListItem', position: 3, name: oposLabel, item: `${APP_URL}/frecuencia/${oposicion}` },
        { '@type': 'ListItem', position: 4, name: `Tema ${data.numero}`, item: `${APP_URL}/frecuencia/${oposicion}/tema/${numInt}` },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Link href="/" className="hover:text-foreground">OpoRuta</Link>
          <span>/</span>
          <span>Frecuencias</span>
          <span>/</span>
          <span>{oposLabel}</span>
          <span>/</span>
          <span className="text-foreground">Tema {data.numero}</span>
        </nav>

        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge>{oposLabel}</Badge>
            <Badge variant="secondary">Tema {data.numero}</Badge>
            <Badge variant="outline">{data.numApariciones} apariciones</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            Tema {data.numero}: {data.titulo}
          </h1>
          {data.descripcion && (
            <p className="mt-3 text-muted-foreground">{data.descripcion}</p>
          )}
        </header>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold">{data.numApariciones}</p>
              <p className="text-xs text-muted-foreground">preguntas oficiales</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold">{data.anios.length}</p>
              <p className="text-xs text-muted-foreground">convocatorias</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold">{data.ultimaAparicion ?? '—'}</p>
              <p className="text-xs text-muted-foreground">última aparición</p>
            </CardContent>
          </Card>
        </div>

        {aniosOrdenados.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">Años en que se ha preguntado</h2>
            <div className="flex flex-wrap gap-2">
              {aniosOrdenados.map((y) => (
                <Badge key={y} variant="secondary" className="text-base px-3 py-1">{y}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Pct sobre total de preguntas analizadas: <strong>{data.pctTotal}%</strong>
            </p>
          </section>
        )}

        {data.preguntas.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">Preguntas reales de este tema</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Estas son las preguntas oficiales que se han hecho de este tema. Click para ver el análisis completo.
            </p>
            <ul className="space-y-2">
              {data.preguntas.map((p, i) => {
                const examenSlug = EXAMEN_SLUG[`${p.oposicionSlug}-${p.anio}`]
                const href = examenSlug ? `/examenes-oficiales/${examenSlug}/preguntas/${p.numero}` : null
                const enunciadoCorto = p.enunciado.length > 140 ? p.enunciado.slice(0, 137) + '...' : p.enunciado
                return (
                  <li key={i}>
                    {href ? (
                      <Link href={href} className="flex items-start gap-3 rounded-md border p-3 text-sm hover:bg-muted/40 transition-colors">
                        <Badge variant="outline" className="shrink-0">{p.anio} · #{p.numero}</Badge>
                        <span className="flex-1">{enunciadoCorto}</span>
                        <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
                        <Badge variant="outline" className="shrink-0">{p.anio} · #{p.numero}</Badge>
                        <span className="flex-1">{enunciadoCorto}</span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <div className="mb-10 rounded-xl bg-primary/5 border border-primary/20 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold">Practica este tema con tests IA</p>
            <p className="text-sm text-muted-foreground mt-1">
              Preguntas verificadas contra la legislación oficial. Gratis.
            </p>
          </div>
          <Link href="/register">
            <Button className="gap-2 whitespace-nowrap">
              Empezar gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
