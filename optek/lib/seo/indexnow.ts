/**
 * IndexNow — notifica a Bing/Yandex/Seznam/Naver cuando cambia una URL.
 *
 * Google NO soporta IndexNow. Para Google usamos sitemap.xml + crawler natural.
 *
 * Docs: https://www.indexnow.org/documentation
 */

import { logger } from '@/lib/logger'

const INDEXNOW_KEY = 'fe9c4816141564c97f07016fe17a7b96'
const HOST = 'oporuta.es'
const ENDPOINT = 'https://api.indexnow.org/IndexNow'

export interface IndexNowResult {
  ok: boolean
  status: number
  submitted: number
  error?: string
}

/** Envía 1–10.000 URLs a IndexNow en un solo POST. */
export async function submitUrls(urls: string[]): Promise<IndexNowResult> {
  if (urls.length === 0) return { ok: true, status: 200, submitted: 0 }
  if (urls.length > 10000) {
    throw new Error('IndexNow: máximo 10.000 URLs por request')
  }

  const body = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })

    // IndexNow acepta 200 (recibido) y 202 (pendiente de procesar)
    const ok = res.status === 200 || res.status === 202
    if (!ok) {
      const text = await res.text()
      logger.warn({ status: res.status, text: text.slice(0, 200) }, '[indexnow] HTTP error')
      return { ok: false, status: res.status, submitted: 0, error: text.slice(0, 200) }
    }
    logger.info({ submitted: urls.length, status: res.status }, '[indexnow] ok')
    return { ok: true, status: res.status, submitted: urls.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error({ err }, '[indexnow] network error')
    return { ok: false, status: 0, submitted: 0, error: msg }
  }
}

/** Conveniencia: envía 1 URL. */
export async function submitUrl(url: string): Promise<IndexNowResult> {
  return submitUrls([url])
}

export const INDEXNOW_CONFIG = { HOST, KEY: INDEXNOW_KEY, ENDPOINT }
