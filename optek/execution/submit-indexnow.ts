/**
 * PlanSEO — IndexNow bulk submitter
 *
 * Uso:
 *   pnpm tsx execution/submit-indexnow.ts              → todo el sitemap
 *   pnpm tsx execution/submit-indexnow.ts --blog       → solo /blog/*
 *   pnpm tsx execution/submit-indexnow.ts --recent 7   → URLs modificadas últimos N días (blog posts)
 *
 * Notifica a Bing/Yandex/Seznam/Naver. Google ignora IndexNow pero usa sitemap.
 */

import { submitUrls } from '../lib/seo/indexnow'
import { blogPosts } from '../content/blog/posts'

const BASE = 'https://oporuta.es'

function parseArg(name: string, fallback: number | null = null): number | null {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx === -1) return fallback
  const v = Number(process.argv[idx + 1])
  return Number.isFinite(v) ? v : fallback
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

async function getSitemapUrls(): Promise<string[]> {
  const res = await fetch(`${BASE}/sitemap.xml`, { headers: { 'User-Agent': 'OpoRuta-IndexNow/1.0' } })
  if (!res.ok) throw new Error(`sitemap.xml HTTP ${res.status}`)
  const xml = await res.text()
  // ¿Es index o flat?
  if (xml.includes('<sitemapindex')) {
    const indexUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    const all: string[] = []
    for (const u of indexUrls) {
      try {
        const r = await fetch(u, { headers: { 'User-Agent': 'OpoRuta-IndexNow/1.0' } })
        if (!r.ok) continue
        const x = await r.text()
        const locs = [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
        all.push(...locs)
      } catch { /* ignore */ }
    }
    return all
  }
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
}

async function main() {
  let urls: string[] = []

  const recentDays = parseArg('recent')
  const blogOnly = hasFlag('blog')

  if (recentDays !== null) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - recentDays)
    urls = blogPosts
      .filter(p => {
        const d = p.dateModified ?? p.date
        return new Date(d) >= cutoff
      })
      .map(p => `${BASE}/blog/${p.slug}`)
    console.log(`📋 ${urls.length} posts modificados en últimos ${recentDays}d`)
  } else if (blogOnly) {
    urls = blogPosts.map(p => `${BASE}/blog/${p.slug}`)
    console.log(`📋 ${urls.length} URLs de blog`)
  } else {
    urls = await getSitemapUrls()
    console.log(`📋 ${urls.length} URLs del sitemap`)
  }

  if (urls.length === 0) {
    console.log('No hay URLs que enviar.')
    return
  }

  // IndexNow acepta hasta 10k por request, troceamos por seguridad
  const CHUNK = 1000
  let totalOk = 0
  for (let i = 0; i < urls.length; i += CHUNK) {
    const chunk = urls.slice(i, i + CHUNK)
    const res = await submitUrls(chunk)
    if (res.ok) {
      totalOk += res.submitted
      console.log(`  ✅ Batch ${i / CHUNK + 1}: ${res.submitted} URLs (HTTP ${res.status})`)
    } else {
      console.error(`  ❌ Batch ${i / CHUNK + 1}: ${res.error} (HTTP ${res.status})`)
    }
  }

  console.log(`\n✅ Total enviado: ${totalOk}/${urls.length} URLs`)
}

main().catch(err => {
  console.error('❌ Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
