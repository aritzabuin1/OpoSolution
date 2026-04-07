/**
 * app/(marketing)/ley/sitemap.ts — Sitemap para /ley/ (pSEO legislación)
 *
 * Genera sitemaps con índice automático para ~9.600 artículos + 53 leyes.
 * Next.js sirve esto como /ley/sitemap.xml (o /ley/sitemap/0.xml, /1.xml, etc.)
 */

import type { MetadataRoute } from 'next'
import { getEnabledLaws } from '@/data/seo/ley-registry'
import { slugifyArticulo } from '@/lib/seo/slugify'
import articleIndex from '@/data/seo/article-index.json'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
const URLS_PER_SITEMAP = 5000

// Build flat list of all URLs (no module-level cache — serverless safe)
function buildAllUrls(): Array<{ url: string; priority: number }> {
  try {
    const enabledLaws = getEnabledLaws()
    const enabledSlugs = new Set(enabledLaws.map(l => l.slug))
    const urls: Array<{ url: string; priority: number }> = []

    // Hub page
    urls.push({ url: `${APP_URL}/ley`, priority: 0.8 })

    const laws = (articleIndex as any).laws ?? []

    // Law index pages + article pages
    for (const law of laws) {
      const lawEntry = enabledLaws.find(l => l.leyNombre === law.leyNombre)
      if (!lawEntry || !enabledSlugs.has(lawEntry.slug)) continue

      // Law index
      urls.push({ url: `${APP_URL}/ley/${lawEntry.slug}`, priority: 0.7 })

      // Article pages
      for (const artNumero of (law.articles ?? [])) {
        const artSlug = slugifyArticulo(artNumero)
        urls.push({
          url: `${APP_URL}/ley/${lawEntry.slug}/${artSlug}`,
          priority: lawEntry.priority === 'high' ? 0.6 : 0.5,
        })
      }
    }

    console.log(`[ley/sitemap] Built ${urls.length} URLs from ${laws.length} laws`)
    return urls
  } catch (err) {
    console.error('[ley/sitemap] buildAllUrls error:', err)
    return []
  }
}

function getAllUrls() {
  return buildAllUrls()
}

export async function generateSitemaps() {
  const total = getAllUrls().length
  const count = Math.ceil(total / URLS_PER_SITEMAP)
  return Array.from({ length: count }, (_, i) => ({ id: i }))
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const allUrls = getAllUrls()
  const start = id * URLS_PER_SITEMAP
  const batch = allUrls.slice(start, start + URLS_PER_SITEMAP)
  const now = new Date()

  return batch.map(entry => ({
    url: entry.url,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: entry.priority,
  }))
}
