import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifyCronSecret } from '@/lib/auth/cron-auth'
import articleIndex from '@/data/seo/article-index.json'
import { getLeyBySlug, LEY_REGISTRY } from '@/data/seo/ley-registry'
import { slugifyArticulo } from '@/lib/seo/slugify'
import { isArticleIndexable } from '@/lib/seo/indexability'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/admin/revalidate-ley
 *
 * Purges the ISR cache for /ley/:lawSlug/:artSlug pages. Needed because
 * 404s cached during a prior broken build persist for the `revalidate`
 * TTL (7 days) even after the page code is fixed.
 *
 * Query params:
 *   - law: single law slug (e.g. "constitucion-espanola") or "all"
 *   - indexableOnly: "1" to only revalidate pages that pass isArticleIndexable (default "1")
 *   - limit: max articles to process (default 500 per law to stay under Vercel 5min limit)
 */
export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request)
  if (authError) return authError

  const url = new URL(request.url)
  const lawParam = url.searchParams.get('law') ?? 'all'
  const indexableOnly = url.searchParams.get('indexableOnly') !== '0'
  const limit = Number(url.searchParams.get('limit') ?? '500')

  const laws = lawParam === 'all'
    ? LEY_REGISTRY.filter(l => l.enabled)
    : [getLeyBySlug(lawParam)].filter((l): l is NonNullable<typeof l> => !!l)

  if (laws.length === 0) {
    return NextResponse.json({ error: 'law not found' }, { status: 404 })
  }

  let total = 0
  const perLaw: Record<string, number> = {}

  for (const ley of laws) {
    const entry = articleIndex.laws.find(l => l.leyNombre === ley.leyNombre)
    if (!entry) continue

    let count = 0
    for (const numero of entry.articles) {
      if (count >= limit) break
      if (indexableOnly && !isArticleIndexable(ley.leyNombre, numero)) continue

      const artSlug = slugifyArticulo(numero)
      const path = `/ley/${ley.slug}/${artSlug}`
      try {
        revalidatePath(path)
        count++
      } catch {
        // best-effort
      }
    }

    // Also revalidate the law index page
    try { revalidatePath(`/ley/${ley.slug}`) } catch {}

    perLaw[ley.slug] = count
    total += count
  }

  return NextResponse.json({ ok: true, total, laws: perLaw })
}
