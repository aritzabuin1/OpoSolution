/**
 * data/seo/ley-blog-map.ts — Mapeo ley → blog posts para enlace bidireccional
 *
 * Escanea el contenido de los blog posts en busca de enlaces a páginas /ley/
 * y construye un índice inverso: dado un slug de ley, qué posts del blog la referencian.
 *
 * Usado en páginas /ley/[slug] para mostrar "Guías relacionadas del blog".
 */

import { blogPosts } from '@/content/blog/posts'

export interface BlogLink {
  slug: string
  title: string
  description: string
}

let _cache: Map<string, BlogLink[]> | null = null

/**
 * Build the reverse index: lawSlug → BlogLink[]
 * Scans blog post content for /ley/{slug} links.
 * Cached at module level (runs once per server lifecycle).
 */
function buildIndex(): Map<string, BlogLink[]> {
  if (_cache) return _cache

  const map = new Map<string, BlogLink[]>()
  const regex = /\/ley\/([a-z0-9-]+)/g

  for (const post of blogPosts) {
    const lawSlugs = new Set<string>()
    let match: RegExpExecArray | null
    while ((match = regex.exec(post.content)) !== null) {
      // Extract the law slug (not the article part)
      lawSlugs.add(match[1])
    }
    // Also check description and keywords for broader matching
    regex.lastIndex = 0

    for (const lawSlug of lawSlugs) {
      const existing = map.get(lawSlug) ?? []
      existing.push({
        slug: post.slug,
        title: post.title,
        description: post.description,
      })
      map.set(lawSlug, existing)
    }
  }

  _cache = map
  return map
}

/**
 * Get blog posts that reference a given law.
 * Returns up to `limit` posts, most recent first.
 */
export function getBlogPostsForLey(lawSlug: string, limit = 4): BlogLink[] {
  const index = buildIndex()
  const posts = index.get(lawSlug) ?? []
  // Return unique posts (a post might link to multiple articles of the same law)
  const seen = new Set<string>()
  const unique: BlogLink[] = []
  for (const post of posts) {
    if (seen.has(post.slug)) continue
    seen.add(post.slug)
    unique.push(post)
  }
  return unique.slice(0, limit)
}
