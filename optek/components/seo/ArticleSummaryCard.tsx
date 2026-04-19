/**
 * components/seo/ArticleSummaryCard.tsx — PlanSEO F1.T5
 *
 * Server Component. Muestra el TL;DR IA cacheado (tabla article_summaries).
 * Se oculta si no hay resumen generado todavía, para no degradar la UX
 * durante el backfill incremental.
 */

import { Sparkles } from 'lucide-react'

interface Props {
  tldr: string | null
}

export function ArticleSummaryCard({ tldr }: Props) {
  if (!tldr || tldr.trim().length < 40) return null

  return (
    <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50/60 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
        <Sparkles className="h-3.5 w-3.5" />
        Resumen rápido
      </div>
      <p className="text-sm leading-relaxed text-gray-800">{tldr}</p>
    </div>
  )
}
