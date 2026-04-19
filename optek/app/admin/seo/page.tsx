/**
 * app/admin/seo/page.tsx — PlanSEO F6.T3
 *
 * Dashboard SEO: estado de cobertura pSEO (artículos indexables con TL;DR),
 * histórico de preguntas por ley, widgets desplegados y gaps.
 *
 * Todo calculado desde estáticos en build: data/seo/article-exam-map.json,
 * data/seo/article-index.json, data/seo/ley-registry. Sin queries en runtime.
 */

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServiceClient } from '@/lib/supabase/server'
import articleExamMap from '@/data/seo/article-exam-map.json'
import articleIndex from '@/data/seo/article-index.json'
import { LEY_REGISTRY } from '@/data/seo/ley-registry'
import { isArticleIndexable } from '@/lib/seo/indexability'
import { BarChart3, Scale, Sparkles, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface MapEntry {
  examenId: string
  preguntaId: string
  anio: number
  oposicionId: string
  enunciadoSnippet: string
}

interface LawIndexEntry {
  leyNombre: string
  slug: string
  totalArticles: number
  articles: string[]
}

interface ArticleIndexDoc {
  laws: Record<string, LawIndexEntry>
  totalArticles: number
  totalLaws: number
}

export default async function AdminSEOPage() {
  const map = (articleExamMap as { map: Record<string, MapEntry[]> }).map ?? {}
  const indexDoc = articleIndex as unknown as ArticleIndexDoc

  // Flatten laws → {leyNombre, articuloNumero}
  const allArticles: Array<{ leyNombre: string; articuloNumero: string }> = []
  for (const law of Object.values(indexDoc.laws ?? {})) {
    for (const numero of law.articles ?? []) {
      allArticles.push({ leyNombre: law.leyNombre, articuloNumero: numero })
    }
  }

  const indexableArticles = allArticles.filter(a => isArticleIndexable(a.leyNombre, a.articuloNumero))
  const indexableCount = indexableArticles.length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createServiceClient()) as any
  const { count: tldrCount } = await supabase
    .from('article_summaries')
    .select('ley_nombre', { count: 'exact', head: true })

  const tldrCoverage = indexableCount > 0 ? ((tldrCount ?? 0) / indexableCount) * 100 : 0

  // Top leyes por preguntas históricas
  const leyCounts = new Map<string, number>()
  for (const [key, entries] of Object.entries(map)) {
    const leyNombre = key.split(':')[0]
    if (!leyNombre) continue
    leyCounts.set(leyNombre, (leyCounts.get(leyNombre) ?? 0) + entries.length)
  }
  const topLeyes = [...leyCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Gap: leyes con preguntas pero SIN artículos indexables
  const gapLeyes: Array<{ leyNombre: string; hits: number }> = []
  for (const [leyNombre, hits] of leyCounts.entries()) {
    const hasIndexable = indexableArticles.some(a => a.leyNombre === leyNombre)
    if (!hasIndexable && hits >= 3) {
      gapLeyes.push({ leyNombre, hits })
    }
  }
  gapLeyes.sort((a, b) => b.hits - a.hits)

  const totalExamQuestions = Object.values(map).reduce((s, entries) => s + entries.length, 0)
  const totalMappedArticles = Object.keys(map).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel SEO</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estado de la infraestructura pSEO: artículos indexables, TL;DRs, y gaps de cobertura.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Artículos indexables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{indexableCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              de {allArticles.length.toLocaleString()} totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              TL;DR generados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(tldrCount ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tldrCoverage.toFixed(1)}% de cobertura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Preguntas históricas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalExamQuestions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              mapeadas a {totalMappedArticles} artículos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Gaps detectados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gapLeyes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              leyes con preguntas sin indexar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backfill CTA */}
      {tldrCoverage < 95 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-center gap-4">
            <Sparkles className="h-8 w-8 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">
                Quedan {(indexableCount - (tldrCount ?? 0)).toLocaleString()} artículos sin TL;DR
              </p>
              <p className="text-sm text-muted-foreground">
                Ejecuta <code className="rounded bg-white px-1.5 py-0.5 text-xs">pnpm generate:article-summaries</code> para procesar el lote siguiente. Coste estimado: ~€0.0001/artículo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top leyes */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 leyes por preguntas históricas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {topLeyes.map(([leyNombre, hits]) => {
              const ley = LEY_REGISTRY.find(l => l.leyNombre === leyNombre)
              return (
                <li key={leyNombre} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground w-8 text-right">
                      {hits}×
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {ley?.shortName ?? leyNombre}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {ley?.fullName ?? '—'}
                      </div>
                    </div>
                  </div>
                  {ley && (
                    <Link
                      href={`/ley/${ley.slug}`}
                      target="_blank"
                      className="text-xs font-medium text-blue-700 hover:underline shrink-0"
                    >
                      Ver →
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Gaps */}
      {gapLeyes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Gaps: leyes con preguntas sin artículos indexables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Estas leyes tienen ≥3 preguntas en exámenes reales pero ningún artículo alcanza el umbral
              de indexabilidad. Revisa ingesta o baja el umbral.
            </p>
            <ul className="space-y-1">
              {gapLeyes.slice(0, 15).map(({ leyNombre, hits }) => (
                <li key={leyNombre} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{leyNombre}</span>
                  <Badge variant="outline">{hits} preguntas</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
