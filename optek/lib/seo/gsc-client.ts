/**
 * PlanSEO F6.T3/T5 + F3.T1 — Google Search Console API client
 *
 * Service account auth (JWT). Envvars requeridas:
 *   - GSC_SERVICE_ACCOUNT_EMAIL
 *   - GSC_SERVICE_ACCOUNT_PRIVATE_KEY (con \n literales, se normalizan aquí)
 *   - GSC_SITE_URL (ej: "sc-domain:oporuta.es")
 */

import { google } from 'googleapis'
import type { searchconsole_v1 } from 'googleapis'

const GSC_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

let clientPromise: Promise<searchconsole_v1.Searchconsole> | null = null

function getClient(): Promise<searchconsole_v1.Searchconsole> {
  if (clientPromise) return clientPromise

  const email = process.env.GSC_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !rawKey) {
    return Promise.reject(new Error('GSC_SERVICE_ACCOUNT_EMAIL/PRIVATE_KEY no configurados'))
  }

  const privateKey = rawKey.replace(/\\n/g, '\n')
  const auth = new google.auth.JWT({ email, key: privateKey, scopes: GSC_SCOPES })

  clientPromise = auth.authorize().then(() => google.searchconsole({ version: 'v1', auth }))
  return clientPromise
}

export function gscSiteUrl(): string {
  const site = process.env.GSC_SITE_URL
  if (!site) throw new Error('GSC_SITE_URL no configurado')
  return site
}

export interface GscRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscQueryOptions {
  startDate: string
  endDate: string
  dimensions: Array<'query' | 'page' | 'country' | 'device' | 'date'>
  rowLimit?: number
  startRow?: number
  dimensionFilterGroups?: searchconsole_v1.Schema$ApiDimensionFilterGroup[]
}

export async function querySearchAnalytics(opts: GscQueryOptions): Promise<GscRow[]> {
  const client = await getClient()
  const res = await client.searchanalytics.query({
    siteUrl: gscSiteUrl(),
    requestBody: {
      startDate: opts.startDate,
      endDate: opts.endDate,
      dimensions: opts.dimensions,
      rowLimit: opts.rowLimit ?? 1000,
      startRow: opts.startRow ?? 0,
      dimensionFilterGroups: opts.dimensionFilterGroups,
    },
  })
  return (res.data.rows ?? []).map(r => ({
    keys: r.keys ?? [],
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }))
}

/** Formatea Date → YYYY-MM-DD. */
export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Rango últimos N días (endDate = ayer, GSC tiene delay de 1-3 días). */
export function lastNDaysRange(days: number): { startDate: string; endDate: string } {
  const end = new Date()
  end.setDate(end.getDate() - 2) // 2 días de margen por el delay de GSC
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  return { startDate: fmtDate(start), endDate: fmtDate(end) }
}
