/**
 * components/seo/ArticleExamQuestions.tsx — PlanSEO F1.T3
 *
 * Server Component. Lista preguntas oficiales donde cayó un artículo concreto,
 * a partir de `data/seo/article-exam-map.json`. Si no hay preguntas, no
 * renderiza nada (información gain sólo cuando hay señal).
 */

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getOposicionById } from '@/data/seo/oposicion-registry'
import articleExamMap from '@/data/seo/article-exam-map.json'
import { FileQuestion } from 'lucide-react'

interface MapEntry {
  examenId: string
  preguntaId: string
  anio: number
  oposicionId: string
  enunciadoSnippet: string
}

interface Props {
  leyNombre: string
  articuloNumero: string
  articuloLabel: string
  leyShortName: string
}

export function ArticleExamQuestions({ leyNombre, articuloNumero, articuloLabel, leyShortName }: Props) {
  const map = (articleExamMap as { map: Record<string, MapEntry[]> }).map ?? {}
  const key = `${leyNombre}:${articuloNumero}`
  const entries = map[key] ?? []

  if (entries.length === 0) return null

  // Agrupar por oposición para mostrar contadores
  const porOposicion = new Map<string, { nombre: string; count: number; path: string }>()
  for (const e of entries) {
    const opo = getOposicionById(e.oposicionId)
    if (!opo) continue
    const cur = porOposicion.get(opo.id) ?? { nombre: opo.shortName, count: 0, path: opo.path }
    cur.count++
    porOposicion.set(opo.id, cur)
  }

  return (
    <section className="mt-10 rounded-lg border border-blue-100 bg-blue-50/40 p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileQuestion className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Preguntas oficiales donde cayó el {articuloLabel.toLowerCase()} de la {leyShortName}
        </h2>
      </div>

      {porOposicion.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {[...porOposicion.values()].map(({ nombre, count, path }) => (
            <Link key={path} href={path}>
              <Badge variant="secondary" className="transition-colors hover:bg-blue-100">
                {nombre} · {count} {count === 1 ? 'pregunta' : 'preguntas'}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <ul className="space-y-3">
        {entries.slice(0, 8).map(e => {
          const opo = getOposicionById(e.oposicionId)
          return (
            <li key={e.preguntaId} className="rounded-md bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold text-blue-700">{e.anio}</span>
                {opo && <span>· {opo.shortName}</span>}
              </div>
              <p className="text-sm text-gray-800">{e.enunciadoSnippet}</p>
            </li>
          )
        })}
      </ul>

      {entries.length > 8 && (
        <p className="mt-3 text-xs text-gray-500">
          Y {entries.length - 8} {entries.length - 8 === 1 ? 'pregunta más' : 'preguntas más'} relacionadas con este artículo.
        </p>
      )}
    </section>
  )
}
