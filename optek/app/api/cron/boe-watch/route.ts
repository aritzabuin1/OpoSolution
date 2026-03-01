import { NextRequest, NextResponse } from 'next/server'
import { watchAllLeyes } from '@/lib/ai/boe-watcher'
import { logger } from '@/lib/logger'

/**
 * GET /api/cron/boe-watch — §2.13.6
 *
 * Verifica cambios en el BOE para todas las leyes activas.
 * Invocado por Vercel Cron (vercel.json: "0 7 * * *") a las 07:00 UTC.
 *
 * Autenticación: Bearer ${CRON_SECRET} en Authorization header.
 */
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'cron/boe-watch' })

  // Verificar CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('[boe-watch] Unauthorized cron request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  log.info('[boe-watch] cron iniciado')

  try {
    const result = await watchAllLeyes()
    log.info(result, '[boe-watch] cron completado')
    return NextResponse.json({ ok: true, ...result }, { status: 200 })
  } catch (err) {
    log.error({ err }, '[boe-watch] cron error')
    return NextResponse.json({ error: 'Error ejecutando BOE watcher' }, { status: 500 })
  }
}
