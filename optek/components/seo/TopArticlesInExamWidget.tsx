/**
 * components/seo/TopArticlesInExamWidget.tsx — PlanSEO F2.T2
 *
 * Server Component. Lista los 10 artículos (ley + número) con más preguntas
 * en un examen oficial concreto. Fuente: article-exam-map.json.
 *
 * Internal linking hacia páginas de artículo indexables. Señal SEO fuerte:
 * "estos son los artículos que cayeron en este examen real".
 */

import Link from 'next/link'
import articleExamMap from '@/data/seo/article-exam-map.json'
import { getLeyByNombre } from '@/data/seo/ley-registry'
import { slugifyArticulo } from '@/lib/seo/slugify'
import { isArticleIndexable } from '@/lib/seo/indexability'
import { Scale, ArrowRight } from 'lucide-react'

interface MapEntry {
  examenId: string
  preguntaId: string
  anio: number
  oposicionId: string
  enunciadoSnippet: string
}

interface Props {
  examenId: string | null | undefined
  max?: number
  className?: string
}

export function TopArticlesInExamWidget({ examenId, max = 10, className }: Props) {
  if (!examenId) return null
  const map = (articleExamMap as { map: Record<string, MapEntry[]> }).map ?? {}

  const counts = new Map<string, number>() // "leyNombre:articuloNumero" -> count
  for (const [key, entries] of Object.entries(map)) {
    const hits = entries.filter(e => e.examenId === examenId).length
    if (hits > 0) counts.set(key, hits)
  }

  if (counts.size === 0) return null

  const ranking = [...counts.entries()]
    .map(([key, hits]) => {
      const [leyNombre, articuloNumero] = key.split(':')
      return { leyNombre, articuloNumero, hits }
    })
    .sort((a, b) => b.hits - a.hits)
    .slice(0, max)

  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-6 ${className ?? ''}`}>
      <div className="mb-4 flex items-center gap-2">
        <Scale className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Artículos más preguntados en este examen
        </h2>
      </div>
      <p className="mb-5 text-sm text-gray-600">
        Ranking real basado en las preguntas oficiales de este examen. Pulsa un artículo para estudiarlo.
      </p>
      <ol className="space-y-2">
        {ranking.map(({ leyNombre, articuloNumero, hits }, idx) => {
          const ley = getLeyByNombre(leyNombre)
          if (!ley) return null
          const indexable = isArticleIndexable(leyNombre, articuloNumero)
          const label = articuloNumero.startsWith('D')
            ? articuloNumero
            : `Art. ${articuloNumero}`
          const row = (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 hover:bg-blue-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 w-6 text-right text-xs font-bold text-gray-400">
                  {idx + 1}.
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {label} · {ley.shortName ?? ley.fullName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{ley.fullName}</div>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {hits} {hits === 1 ? 'pregunta' : 'preguntas'}
              </span>
            </div>
          )
          return (
            <li key={`${leyNombre}:${articuloNumero}`}>
              {indexable ? (
                <Link href={`/ley/${ley.slug}/${slugifyArticulo(articuloNumero)}`}>
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          )
        })}
      </ol>
      <div className="mt-5 text-right">
        <Link href="/ley" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
          Ver toda la legislación <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
