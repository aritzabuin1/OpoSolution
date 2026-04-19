/**
 * PlanSEO F6.T3/T5 + F3.T1 — high-level GSC queries
 */

import { querySearchAnalytics, lastNDaysRange, type GscRow } from './gsc-client'

export interface GscSummary {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function getGscSummary(days = 28): Promise<GscSummary> {
  const { startDate, endDate } = lastNDaysRange(days)
  const rows = await querySearchAnalytics({ startDate, endDate, dimensions: [], rowLimit: 1 })
  if (rows.length === 0) return { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  const r = rows[0]
  return { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }
}

export async function getTopQueries(days = 28, limit = 20): Promise<GscRow[]> {
  const { startDate, endDate } = lastNDaysRange(days)
  return querySearchAnalytics({ startDate, endDate, dimensions: ['query'], rowLimit: limit })
}

export async function getTopPages(days = 28, limit = 20): Promise<GscRow[]> {
  const { startDate, endDate } = lastNDaysRange(days)
  return querySearchAnalytics({ startDate, endDate, dimensions: ['page'], rowLimit: limit })
}

/** F3.T1 — páginas con impresiones ≥ minImpressions y CTR < maxCtr. Ordenadas por impresiones desc. */
export async function getLowCtrPages(opts: {
  days?: number
  minImpressions?: number
  maxCtr?: number
  limit?: number
} = {}): Promise<GscRow[]> {
  const { days = 28, minImpressions = 500, maxCtr = 0.02, limit = 15 } = opts
  const { startDate, endDate } = lastNDaysRange(days)
  const rows = await querySearchAnalytics({
    startDate,
    endDate,
    dimensions: ['page'],
    rowLimit: 1000,
  })
  return rows
    .filter(r => r.impressions >= minImpressions && r.ctr < maxCtr)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
}

/** F6.T5 — comparativa semana actual vs anterior por query. */
export async function getWeekOverWeekQueries(limit = 500): Promise<
  Array<{ query: string; clicksCurr: number; clicksPrev: number; posCurr: number; posPrev: number; deltaClicks: number; deltaPos: number }>
> {
  const now = new Date()
  now.setDate(now.getDate() - 2)
  const endCurr = now
  const startCurr = new Date(endCurr)
  startCurr.setDate(startCurr.getDate() - 6)
  const endPrev = new Date(startCurr)
  endPrev.setDate(endPrev.getDate() - 1)
  const startPrev = new Date(endPrev)
  startPrev.setDate(startPrev.getDate() - 6)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [curr, prev] = await Promise.all([
    querySearchAnalytics({ startDate: fmt(startCurr), endDate: fmt(endCurr), dimensions: ['query'], rowLimit: limit }),
    querySearchAnalytics({ startDate: fmt(startPrev), endDate: fmt(endPrev), dimensions: ['query'], rowLimit: limit }),
  ])

  const prevMap = new Map(prev.map(r => [r.keys[0] ?? '', r]))
  const queries = new Set<string>([...curr.map(r => r.keys[0] ?? ''), ...prev.map(r => r.keys[0] ?? '')])

  const out: Array<{ query: string; clicksCurr: number; clicksPrev: number; posCurr: number; posPrev: number; deltaClicks: number; deltaPos: number }> = []
  for (const q of queries) {
    if (!q) continue
    const c = curr.find(r => r.keys[0] === q)
    const p = prevMap.get(q)
    const clicksCurr = c?.clicks ?? 0
    const clicksPrev = p?.clicks ?? 0
    const posCurr = c?.position ?? 0
    const posPrev = p?.position ?? 0
    out.push({
      query: q,
      clicksCurr,
      clicksPrev,
      posCurr,
      posPrev,
      deltaClicks: clicksCurr - clicksPrev,
      deltaPos: posPrev > 0 && posCurr > 0 ? posPrev - posCurr : 0, // positivo = mejora
    })
  }
  return out
}
