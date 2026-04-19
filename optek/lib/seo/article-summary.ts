/**
 * lib/seo/article-summary.ts — PlanSEO F1.T5
 *
 * Lee TL;DR IA cacheadas (tabla `article_summaries`). Se muestran en la
 * cabecera de cada artículo de legislación como "information gain" frente
 * a la réplica del BOE.
 *
 * Generadas offline por `execution/generate-article-summaries.ts`.
 */

import { createServiceClient } from '@/lib/supabase/server'

export interface ArticleSummary {
  tldr: string
  model: string
  generatedAt: string
}

export async function getArticleSummary(
  leyNombre: string,
  articuloNumero: string,
): Promise<ArticleSummary | null> {
  const supabase = await createServiceClient()

  const { data, error } = await (supabase as any)
    .from('article_summaries')
    .select('tldr, model, generated_at')
    .eq('ley_nombre', leyNombre)
    .eq('articulo_numero', articuloNumero)
    .maybeSingle()

  if (error || !data) return null

  return {
    tldr: data.tldr,
    model: data.model,
    generatedAt: data.generated_at,
  }
}
