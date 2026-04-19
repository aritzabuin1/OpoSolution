import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/auth/cron-auth'
import { getLeyBySlug } from '@/data/seo/ley-registry'
import { getArticleProvisions } from '@/lib/seo/law-queries'
import articleIndex from '@/data/seo/article-index.json'
import { slugifyArticulo } from '@/lib/seo/slugify'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/debug-ley?lawSlug=constitucion-espanola&articulo=14
 * Reports every step of the /ley article pipeline to locate where it fails in prod.
 */
export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  const url = new URL(request.url)
  const lawSlug = url.searchParams.get('lawSlug') ?? 'constitucion-espanola'
  const articulo = url.searchParams.get('articulo') ?? '14'

  const steps: Record<string, unknown> = {}

  const ley = getLeyBySlug(lawSlug)
  steps.ley_found = !!ley
  steps.ley_nombre = ley?.leyNombre ?? null

  const idxLaw = articleIndex.laws.find(l => l.leyNombre === ley?.leyNombre)
  steps.article_index_law_found = !!idxLaw
  steps.article_index_law_article_count = idxLaw?.articles.length ?? 0
  steps.article_index_has_articulo = idxLaw?.articles.includes(articulo) ?? false

  const artSlug = slugifyArticulo(articulo)
  steps.computed_slug = artSlug

  if (ley) {
    try {
      const provisions = await getArticleProvisions(ley.leyNombre, articulo)
      steps.provisions_count = provisions.length
      steps.provisions_total_text = provisions.reduce((s, p) => s + (p.texto_integro?.length ?? 0), 0)
      steps.provisions_sample = provisions[0] ? { num: provisions[0].articulo_numero, apartado: provisions[0].apartado, titulo: provisions[0].titulo_capitulo?.slice(0, 80) } : null
    } catch (err) {
      steps.provisions_error = (err as Error).message
    }
  }

  steps.supabase_url_prefix = process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 40) ?? 'MISSING'
  steps.has_service_key = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json(steps)
}
