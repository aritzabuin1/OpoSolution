/**
 * pSEO v3 — Tipo 2: histórico de un artículo en exámenes oficiales.
 *
 * URL: /historico/[ley-slug]/articulo/[numero]
 *
 * Information gain (proprietario):
 *   - "El artículo X de la LPAC ha aparecido N veces en exámenes INAP"
 *   - Años en que se ha preguntado (array integer[] anios)
 *   - Última convocatoria que lo preguntó
 *   - Pct sobre el total de preguntas analizadas
 *   - Cross-link a /ley/{ley}/articulo-N (texto completo) y a /examenes-oficiales/...
 *
 * Indexabilidad: solo si num_apariciones > 0 (evita 9k thin URLs).
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/server'
import { getLeyBySlug, getEnabledLaws } from '@/data/seo/ley-registry'
import { slugifyArticulo } from '@/lib/seo/slugify'
import { ArrowRight, Calendar, FileText, TrendingUp } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export const revalidate = 86400

interface Props {
  params: Promise<{ 'ley-slug': string; numero: string }>
}

const NOINDEX: Metadata = { robots: { index: false, follow: true } }

interface FrecuenciaData {
  legislacionId: string
  articuloNumero: string
  leyNombre: string
  leyCodigo: string | null
  tituloCapitulo: string | null
  resumen: string | null
  numApariciones: number
  pctTotal: number
  anios: number[]
  ultimaAparicion: number | null
}

async function fetchFrecuencia(leyNombre: string, articuloNumero: string): Promise<FrecuenciaData | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any
  const { data } = await supabase
    .from('radar_tribunal_view')
    .select('legislacion_id, articulo_numero, ley_nombre, ley_codigo, titulo_capitulo, resumen, num_apariciones, pct_total, anios, ultima_aparicion')
    .eq('ley_nombre', leyNombre)
    .eq('articulo_numero', articuloNumero)
    .gt('num_apariciones', 0)
    .maybeSingle()
  if (!data) return null
  return {
    legislacionId: data.legislacion_id,
    articuloNumero: data.articulo_numero,
    leyNombre: data.ley_nombre,
    leyCodigo: data.ley_codigo,
    tituloCapitulo: data.titulo_capitulo,
    resumen: data.resumen,
    numApariciones: data.num_apariciones,
    pctTotal: data.pct_total,
    anios: Array.isArray(data.anios) ? data.anios : [],
    ultimaAparicion: data.ultima_aparicion,
  }
}

export async function generateStaticParams() {
  // Pre-render solo los 218 artículos del cross-ref set (los que tienen apariciones).
  const cross = await import('@/data/seo/indexable-cross-ref.json')
  const params: { 'ley-slug': string; numero: string }[] = []
  for (const key of cross.keys ?? []) {
    const [leyNombre, articuloNumero] = key.split(':')
    const ley = getEnabledLaws().find((l) => l.leyNombre === leyNombre)
    if (!ley) continue
    params.push({ 'ley-slug': ley.slug, numero: articuloNumero })
  }
  return params
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'ley-slug': leySlug, numero } = await params
  const ley = getLeyBySlug(leySlug)
  if (!ley) return NOINDEX

  const data = await fetchFrecuencia(ley.leyNombre, numero)
  if (!data) return NOINDEX

  const title = `Artículo ${numero} de ${ley.shortName} en exámenes INAP — ${data.numApariciones} apariciones`
  const description = `Frecuencia del artículo ${numero} de ${ley.fullName} en exámenes oficiales INAP. ${data.numApariciones} apariciones en ${data.anios.length} convocatorias. Última: ${data.ultimaAparicion ?? '—'}.`
  const canonical = `${APP_URL}/historico/${leySlug}/articulo/${numero}`

  return {
    title: `${title} | OpoRuta`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      images: [{ url: `${APP_URL}/api/og?tipo=test&tema=${encodeURIComponent(`${ley.shortName} art. ${numero}`)}`, width: 1200, height: 630 }],
    },
  }
}

export default async function HistoricoArticuloPage({ params }: Props) {
  const { 'ley-slug': leySlug, numero } = await params
  const ley = getLeyBySlug(leySlug)
  if (!ley) notFound()

  const data = await fetchFrecuencia(ley.leyNombre, numero)
  if (!data) notFound()

  const aniosOrdenados = [...data.anios].sort((a, b) => b - a)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonLd: Record<string, any>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `Frecuencia del artículo ${numero} de ${ley.shortName} en exámenes INAP`,
      description: `Histórico de apariciones del artículo ${numero} de ${ley.fullName} en exámenes oficiales INAP.`,
      url: `${APP_URL}/historico/${leySlug}/articulo/${numero}`,
      creator: { '@type': 'Organization', name: 'OpoRuta', url: APP_URL },
      license: 'https://creativecommons.org/licenses/by/4.0/',
      keywords: [ley.shortName, `artículo ${numero}`, 'INAP', 'exámenes oficiales'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'OpoRuta', item: APP_URL },
        { '@type': 'ListItem', position: 2, name: 'Histórico de exámenes', item: `${APP_URL}/historico` },
        { '@type': 'ListItem', position: 3, name: ley.shortName, item: `${APP_URL}/historico/${leySlug}` },
        { '@type': 'ListItem', position: 4, name: `Art. ${numero}`, item: `${APP_URL}/historico/${leySlug}/articulo/${numero}` },
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
          <Link href="/historico" className="hover:text-foreground">Histórico</Link>
          <span>/</span>
          <span>{ley.shortName}</span>
          <span>/</span>
          <span className="text-foreground">Art. {numero}</span>
        </nav>

        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge>{ley.shortName}</Badge>
            <Badge variant="secondary">Artículo {numero}</Badge>
            <Badge variant="outline">{data.numApariciones} apariciones INAP</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
            Artículo {numero} de {ley.shortName} en exámenes INAP
          </h1>
          <p className="mt-3 text-muted-foreground">
            Histórico oficial de apariciones de este artículo en convocatorias del INAP.
            Datos extraídos de los exámenes oficiales publicados.
          </p>
        </header>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold">{data.numApariciones}</p>
              <p className="text-xs text-muted-foreground">veces preguntado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold">{data.anios.length}</p>
              <p className="text-xs text-muted-foreground">convocatorias distintas</p>
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

        {/* Resumen del artículo */}
        {data.resumen && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">Contenido del artículo</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  &ldquo;{data.resumen}...&rdquo;
                </p>
                <Link
                  href={`/ley/${leySlug}/${slugifyArticulo(numero)}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Leer artículo completo en {ley.shortName} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Años de aparición */}
        {aniosOrdenados.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">Años en que ha aparecido</h2>
            <div className="flex flex-wrap gap-2">
              {aniosOrdenados.map((y) => (
                <Badge key={y} variant="secondary" className="text-base px-3 py-1">
                  {y}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Pct sobre el total de preguntas analizadas: <strong>{data.pctTotal}%</strong>
            </p>
          </section>
        )}

        {/* Por qué importa */}
        <section className="mb-8 rounded-lg border bg-muted/30 p-5">
          <h2 className="font-semibold mb-2">¿Por qué este artículo es importante?</h2>
          <p className="text-sm text-muted-foreground">
            Un artículo con <strong className="text-foreground">{data.numApariciones} apariciones</strong> es
            uno de los más recurrentes del temario. Si lo dominas, aumentas la probabilidad de
            sumar puntos en la próxima convocatoria.
          </p>
        </section>

        {/* CTA practicar */}
        <div className="mb-10 rounded-xl bg-primary/5 border border-primary/20 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold">Practica preguntas sobre este artículo</p>
            <p className="text-sm text-muted-foreground mt-1">
              OpoRuta genera preguntas verificadas contra la ley en tiempo real. Gratis.
            </p>
          </div>
          <Link href="/register">
            <Button className="gap-2 whitespace-nowrap">
              Empezar gratis <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-8">
          <Link href={`/ley/${leySlug}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              Ver toda la ley {ley.shortName} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
