/**
 * components/seo/TopLawsWidget.tsx — PlanSEO F2.T1
 *
 * Server Component. Muestra las top 5 leyes más examinadas en una oposición,
 * cada una con sus 3 artículos más frecuentes. Fuente: article-exam-map.json.
 *
 * Internal linking de alto valor: conecta hubs de oposiciones con los
 * artículos específicos que más caen — refuerzo SEO bidireccional y una
 * señal clara de "esto SÍ importa" para el usuario.
 */

import Link from 'next/link'
import articleExamMap from '@/data/seo/article-exam-map.json'
import { getLeyByNombre } from '@/data/seo/ley-registry'
import { slugifyArticulo } from '@/lib/seo/slugify'
import { isArticleIndexable } from '@/lib/seo/indexability'
import { BookOpen, ArrowRight } from 'lucide-react'

interface MapEntry {
  examenId: string
  preguntaId: string
  anio: number
  oposicionId: string
  enunciadoSnippet: string
}

interface Props {
  /** Single oposicion UUID or array for hubs (aggregates across cuerpos). */
  oposicionIds: string | string[]
  oposicionName: string
  maxLaws?: number
  maxArticlesPerLaw?: number
  className?: string
}

export function TopLawsWidget({
  oposicionIds,
  oposicionName,
  maxLaws = 5,
  maxArticlesPerLaw = 3,
  className,
}: Props) {
  const map = (articleExamMap as { map: Record<string, MapEntry[]> }).map ?? {}
  const ids = new Set(Array.isArray(oposicionIds) ? oposicionIds : [oposicionIds])

  // Aggregate per law + article for this oposición
  const byLaw = new Map<string, Map<string, number>>() // leyNombre -> articuloNumero -> count
  for (const [key, entries] of Object.entries(map)) {
    const [leyNombre, articuloNumero] = key.split(':')
    if (!leyNombre || !articuloNumero) continue
    const hits = entries.filter(e => ids.has(e.oposicionId)).length
    if (hits === 0) continue
    if (!byLaw.has(leyNombre)) byLaw.set(leyNombre, new Map())
    byLaw.get(leyNombre)!.set(articuloNumero, hits)
  }

  if (byLaw.size === 0) return null

  // Rank laws by total hits
  const lawRanking = [...byLaw.entries()]
    .map(([leyNombre, artMap]) => ({
      leyNombre,
      totalHits: [...artMap.values()].reduce((s, n) => s + n, 0),
      articleCount: artMap.size,
      topArticles: [...artMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxArticlesPerLaw)
        .map(([numero, hits]) => ({ numero, hits })),
    }))
    .sort((a, b) => b.totalHits - a.totalHits)
    .slice(0, maxLaws)

  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-6 ${className ?? ''}`}>
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Leyes más examinadas en {oposicionName}
        </h2>
      </div>
      <p className="mb-5 text-sm text-gray-600">
        Ranking basado en el histórico de preguntas oficiales. Pulsa un artículo para verlo.
      </p>
      <ul className="space-y-4">
        {lawRanking.map(({ leyNombre, totalHits, articleCount, topArticles }) => {
          const ley = getLeyByNombre(leyNombre)
          if (!ley) return null
          return (
            <li key={leyNombre} className="rounded-lg bg-gray-50 p-4">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <Link
                  href={`/ley/${ley.slug}`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {ley.fullName}
                </Link>
                <span className="text-xs text-gray-500">
                  {totalHits} {totalHits === 1 ? 'pregunta' : 'preguntas'} · {articleCount} {articleCount === 1 ? 'artículo' : 'artículos'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {topArticles.map(({ numero, hits }) => {
                  const indexable = isArticleIndexable(leyNombre, numero)
                  const label = numero.startsWith('D') ? numero : `Art. ${numero}`
                  const chip = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-gray-200">
                      {label}
                      <span className="text-gray-400">· {hits}</span>
                    </span>
                  )
                  return indexable ? (
                    <Link
                      key={numero}
                      href={`/ley/${ley.slug}/${slugifyArticulo(numero)}`}
                      className="transition-colors hover:bg-blue-50"
                    >
                      {chip}
                    </Link>
                  ) : (
                    <span key={numero}>{chip}</span>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-5 text-right">
        <Link href="/ley" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
          Ver toda la legislación <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
