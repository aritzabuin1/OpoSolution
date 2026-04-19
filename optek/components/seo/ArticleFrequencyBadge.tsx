/**
 * components/seo/ArticleFrequencyBadge.tsx — PlanSEO F1.T4
 *
 * Server Component. Muestra "Aparece en X de las últimas Y convocatorias" si
 * el artículo tiene cobertura suficiente (≥1 aparición y ≥3 años de ventana).
 * Semáforo: verde (alta frecuencia), ámbar (media), gris (baja).
 */

import articleExamMap from '@/data/seo/article-exam-map.json'
import { TrendingUp } from 'lucide-react'

interface MapEntry {
  examenId: string
  preguntaId: string
  anio: number
  oposicionId: string
}

const MAX_YEAR = 2025
const WINDOW_YEARS = 5

interface Props {
  leyNombre: string
  articuloNumero: string
}

export function ArticleFrequencyBadge({ leyNombre, articuloNumero }: Props) {
  const map = (articleExamMap as { map: Record<string, MapEntry[]> }).map ?? {}
  const entries = map[`${leyNombre}:${articuloNumero}`] ?? []

  if (entries.length === 0) return null

  const minYear = MAX_YEAR - WINDOW_YEARS + 1
  const yearsWithHit = new Set(entries.filter(e => e.anio >= minYear).map(e => e.anio))
  const hits = yearsWithHit.size

  // Only render if at least 1 year has a hit AND we have 3+ years of reference window
  if (hits < 1) return null

  const ratio = hits / WINDOW_YEARS
  const color =
    ratio >= 0.6
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      : ratio >= 0.3
        ? 'bg-amber-50 text-amber-800 ring-amber-200'
        : 'bg-slate-50 text-slate-700 ring-slate-200'

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${color}`}>
      <TrendingUp className="h-3.5 w-3.5" />
      Aparece en {hits} de las últimas {WINDOW_YEARS} convocatorias
    </div>
  )
}
