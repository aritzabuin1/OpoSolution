import { NextRequest, NextResponse } from 'next/server'
import { watchAllLeyes } from '@/lib/ai/boe-watcher'
import { runCostCheck, type CostCheckResult } from '@/lib/admin/cost-check'
import { logger } from '@/lib/logger'

/**
 * GET /api/cron/boe-watch — §2.13.6 + §2.23 (piggyback)
 *
 * Verifica cambios en el BOE para todas las leyes activas.
 * Invocado por Vercel Cron (vercel.json: "0 7 * * *") a las 07:00 UTC.
 *
 * Piggyback §2.23: también ejecuta el daily cost check (costes del día anterior)
 * para restaurar alertas sin necesitar un tercer cron (Vercel Hobby: 2 crons max).
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

  // ── 1. BOE watcher ─────────────────────────────────────────────────────────
  let boeResult: object = {}
  try {
    boeResult = await watchAllLeyes()
    log.info(boeResult, '[boe-watch] BOE check completado')
  } catch (err) {
    log.error({ err }, '[boe-watch] BOE check error — continuando con cost check')
    boeResult = { error: 'BOE check failed' }
  }

  // ── 2. §2.23 Piggyback: cost + infra check del día anterior ───────────────
  // Analiza costes de ayer (completo) desde el cron de 07:00 UTC.
  // Si falla, se loguea como no crítico — no afecta al resultado BOE.
  let costResult: CostCheckResult | { error: string }
  try {
    costResult = await runCostCheck() // default: ayer
    log.info(costResult, '[boe-watch] cost+infra check completado')
  } catch (err) {
    log.error({ err }, '[boe-watch] cost+infra check error — no crítico')
    costResult = { error: 'Cost check failed' }
  }

  return NextResponse.json({ ok: true, boe: boeResult, costs: costResult }, { status: 200 })
}
