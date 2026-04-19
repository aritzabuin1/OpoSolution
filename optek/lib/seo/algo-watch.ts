/**
 * PlanSEO F6.T4 — Monitor de Google algorithm updates
 *
 * Fetch RSS de Search Engine Roundtable (seroundtable.com) y detecta
 * anuncios de algorithm updates. Persiste en `seo_algo_events` y notifica
 * al admin si severidad es warning/critical.
 *
 * Se ejecuta piggyback en el cron `boe-watch` (Vercel Hobby: 2 crons max).
 */

import { createServiceClient } from '@/lib/supabase/server'
import { sendAlert } from '@/lib/admin/alerting'
import { logger } from '@/lib/logger'

const FEEDS = [
  { url: 'https://www.seroundtable.com/feed.xml', source: 'Search Engine Roundtable' },
]

const CRITICAL_KEYWORDS = ['core update', 'spam update', 'helpful content update', 'algorithm update']
const WARNING_KEYWORDS = ['ranking volatility', 'serp volatility', 'google update', 'algorithm change', 'algo update']

export interface AlgoWatchResult {
  feeds_checked: number
  new_events: number
  critical_events: number
  warning_events: number
  errors: string[]
}

interface FeedItem {
  title: string
  link: string
  pubDate: string
}

/** Parser ligero de RSS — evita dependencias nuevas (P9: cero SaaS). */
function parseFeedItems(xml: string): FeedItem[] {
  const items: FeedItem[] = []
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? []

  for (const block of itemBlocks.slice(0, 20)) {
    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link')
    const pubDate = extractTag(block, 'pubDate')
    if (title && link) {
      items.push({ title, link, pubDate })
    }
  }
  return items
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(re)
  if (!match) return ''
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function classifySeverity(title: string): 'critical' | 'warning' | 'info' {
  const lower = title.toLowerCase()
  if (CRITICAL_KEYWORDS.some(k => lower.includes(k))) return 'critical'
  if (WARNING_KEYWORDS.some(k => lower.includes(k))) return 'warning'
  return 'info'
}

function extractMatchedKeywords(title: string): string[] {
  const lower = title.toLowerCase()
  return [...CRITICAL_KEYWORDS, ...WARNING_KEYWORDS].filter(k => lower.includes(k))
}

export async function runAlgoWatch(): Promise<AlgoWatchResult> {
  const result: AlgoWatchResult = {
    feeds_checked: 0,
    new_events: 0,
    critical_events: 0,
    warning_events: 0,
    errors: [],
  }

  const supabase = await createServiceClient()

  for (const feed of FEEDS) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8_000)
      const res = await fetch(feed.url, { signal: controller.signal, headers: { 'User-Agent': 'OpoRuta-SEO-Watcher/1.0' } })
      clearTimeout(timer)
      if (!res.ok) {
        result.errors.push(`${feed.source}: HTTP ${res.status}`)
        continue
      }
      const xml = await res.text()
      const items = parseFeedItems(xml)
      result.feeds_checked += 1

      for (const item of items) {
        const severity = classifySeverity(item.title)
        if (severity === 'info') continue

        const keywords = extractMatchedKeywords(item.title)
        const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null

        const { data: inserted, error } = await (supabase as any)
          .from('seo_algo_events')
          .upsert(
            {
              source: feed.source,
              title: item.title,
              url: item.link,
              published_at: publishedAt,
              keywords_matched: keywords,
              severity,
            },
            { onConflict: 'url', ignoreDuplicates: true }
          )
          .select('id, severity')

        if (error) {
          result.errors.push(`${feed.source}: ${error.message}`)
          continue
        }

        if (inserted && inserted.length > 0) {
          result.new_events += 1
          if (severity === 'critical') result.critical_events += 1
          else if (severity === 'warning') result.warning_events += 1

          await sendAlert({
            severity,
            title: `[SEO] ${feed.source}: ${severity}`,
            message: `Posible algorithm update detectado: "${item.title}" — ${item.link}`,
            metadata: { feed: feed.source, keywords },
          })
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.errors.push(`${feed.source}: ${msg}`)
      logger.warn({ err, feed: feed.source }, '[algo-watch] fallo fetch feed')
    }
  }

  return result
}
