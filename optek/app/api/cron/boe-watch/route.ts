import { NextRequest, NextResponse } from 'next/server'
import { watchAllLeyes } from '@/lib/ai/boe-watcher'
import { runCostCheck, type CostCheckResult } from '@/lib/admin/cost-check'
import { runNurtureEmails, type NurtureResult } from '@/lib/email/nurture'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/auth/cron-auth'

// Vercel Hobby max: 60s. BOE fetch + cost check can take 10-30s.
export const maxDuration = 60

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

  // Verificar CRON_SECRET (timing-safe)
  const authError = verifyCronSecret(request)
  if (authError) {
    log.warn('[boe-watch] Unauthorized cron request')
    return authError
  }

  log.info('[boe-watch] cron iniciado')

  // ── 1. BOE watcher ─────────────────────────────────────────────────────────
  let boeResult: object = {}
  try {
    boeResult = await watchAllLeyes()
    log.info(boeResult, '[boe-watch] BOE check completado')
  } catch (err) {
    log.error({ err }, '[boe-watch] BOE check error — continuando con cost check')
    boeResult = { error: 'Fallo en comprobación BOE' }
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
    costResult = { error: 'Fallo en comprobación de costes' }
  }

  // ── 3. Piggyback: nurture email sequence ──────────────────────────────────
  // Sends personalized emails to free users based on registration age + behavior.
  // If it fails, it's non-critical — doesn't affect BOE or cost check.
  let nurtureResult: NurtureResult | { error: string }
  try {
    nurtureResult = await runNurtureEmails()
    log.info(nurtureResult, '[boe-watch] nurture emails completado')
  } catch (err) {
    log.error({ err }, '[boe-watch] nurture emails error — no crítico')
    nurtureResult = { error: 'Fallo en envío de nurture emails' }
  }

  return NextResponse.json({ ok: true, boe: boeResult, costs: costResult, nurture: nurtureResult }, { status: 200 })
}
