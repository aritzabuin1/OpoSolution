/**
 * components/seo/TopArticlesGlobalWidget.tsx — PlanSEO F2.T4
 *
 * Server Component. Ranking global de artículos más preguntados
 * agregado sobre TODAS las oposiciones. Pensado para homepage:
 * prueba social + internal linking hacia artículos top.
 */

import Link from 'next/link'
import articleExamMap from '@/data/seo/article-exam-map.json'
import { getLeyByNombre } from '@/data/seo/ley-registry'
import { slugifyArticulo } from '@/lib/seo/slugify'
import { isArticleIndexable } from '@/lib/seo/indexability'
import { Flame, ArrowRight } from 'lucide-react'

interface MapEntry {
  examenId: string
  preguntaId: string
  anio: number
  oposicionId: string
  enunciadoSnippet: string
}

interface Props {
  max?: number
  title?: string
  subtitle?: string
  className?: string
}

export function TopArticlesGlobalWidget({
  max = 10,
  title = 'Los artículos que más caen',
  subtitle = 'Ranking calculado a partir de exámenes oficiales reales de todas las oposiciones.',
  className,
}: Props) {
  const map = (articleExamMap as { map: Record<string, MapEntry[]> }).map ?? {}

  const ranking = Object.entries(map)
    .map(([key, entries]) => {
      const [leyNombre, articuloNumero] = key.split(':')
      return { leyNombre, articuloNumero, hits: entries.length }
    })
    .filter(r => r.leyNombre && r.articuloNumero)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, max)

  if (ranking.length === 0) return null

  return (
    <section className={`py-16 ${className ?? ''}`}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 mb-4">
            <Flame className="h-3.5 w-3.5" />
            Top preguntas oficiales
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {ranking.map(({ leyNombre, articuloNumero, hits }, idx) => {
            const ley = getLeyByNombre(leyNombre)
            if (!ley) return null
            const indexable = isArticleIndexable(leyNombre, articuloNumero)
            const label = articuloNumero.startsWith('D')
              ? articuloNumero
              : `Art. ${articuloNumero}`
            const card = (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 transition-colors hover:bg-blue-50 hover:border-blue-200">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {label} · {ley.shortName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {ley.fullName}
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  {hits}×
                </span>
              </div>
            )
            return (
              <div key={`${leyNombre}:${articuloNumero}`}>
                {indexable ? (
                  <Link href={`/ley/${ley.slug}/${slugifyArticulo(articuloNumero)}`}>
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-8 text-center">
          <Link href="/ley" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
            Explora toda la legislación indexada <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
