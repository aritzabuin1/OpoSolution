/**
 * app/(marketing)/ley/sitemap.ts — Sitemap para /ley/ (pSEO legislación)
 *
 * Genera un sitemap con ~9.600 artículos + 53 leyes.
 * Next.js sirve esto como /ley/sitemap.xml
 */

import type { MetadataRoute } from 'next'
import { getEnabledLaws } from '@/data/seo/ley-registry'
import { slugifyArticulo } from '@/lib/seo/slugify'
import articleIndex from '@/data/seo/article-index.json'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  try {
    const enabledLaws = getEnabledLaws()
    const enabledSlugs = new Set(enabledLaws.map(l => l.slug))
    const laws = (articleIndex as any).laws ?? []

    // Hub page
    entries.push({
      url: `${APP_URL}/ley`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })

    // Law index pages + article pages
    for (const law of laws) {
      const lawEntry = enabledLaws.find(l => l.leyNombre === law.leyNombre)
      if (!lawEntry || !enabledSlugs.has(lawEntry.slug)) continue

      // Law index
      entries.push({
        url: `${APP_URL}/ley/${lawEntry.slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      })

      // Article pages
      for (const artNumero of (law.articles ?? [])) {
        entries.push({
          url: `${APP_URL}/ley/${lawEntry.slug}/${slugifyArticulo(artNumero)}`,
          lastModified: now,
          changeFrequency: 'monthly',
          priority: lawEntry.priority === 'high' ? 0.6 : 0.5,
        })
      }
    }

    console.log(`[ley/sitemap] Generated ${entries.length} URLs from ${laws.length} laws`)
  } catch (err) {
    console.error('[ley/sitemap] Error building sitemap:', err)
  }

  return entries
}
