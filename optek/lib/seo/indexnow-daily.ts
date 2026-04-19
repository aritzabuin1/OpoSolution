/**
 * PlanSEO — Daily IndexNow submission piggyback
 *
 * Envía las URLs modificadas en los últimos 2 días (blog posts con
 * dateModified reciente) + URLs de radar regeneradas. Ejecutado cada
 * día desde el cron `boe-watch`.
 */

import { submitUrls, type IndexNowResult } from './indexnow'
import { blogPosts } from '@/content/blog/posts'

const BASE = 'https://oporuta.es'

export interface IndexNowDailyResult {
  scanned: number
  submitted: number
  http_status: number
  error?: string
}

export async function runIndexNowDaily(): Promise<IndexNowDailyResult> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 2)

  const recentPosts = blogPosts.filter(p => {
    const d = new Date(p.dateModified ?? p.date)
    return d >= cutoff
  })

  if (recentPosts.length === 0) {
    return { scanned: blogPosts.length, submitted: 0, http_status: 200 }
  }

  const urls = recentPosts.map(p => `${BASE}/blog/${p.slug}`)
  const res: IndexNowResult = await submitUrls(urls)
  return {
    scanned: blogPosts.length,
    submitted: res.submitted,
    http_status: res.status,
    ...(res.error ? { error: res.error } : {}),
  }
}
