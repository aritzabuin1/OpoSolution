import { NextRequest, NextResponse } from 'next/server'
import { runCostCheck } from '@/lib/admin/cost-check'
import { logger } from '@/lib/logger'

/**
 * GET /api/cron/check-costs
 *
 * Endpoint manual para ejecutar el check de costes + infraestructura.
 * Requiere CRON_SECRET — NO está en el cron schedule (Vercel Hobby: 2 crons max).
 *
 * La ejecución diaria automática está piggybacked en /api/cron/boe-watch (07:00 UTC)
 * que llama a runCostCheck() para analizar los costes del día anterior.
 *
 * Uso manual:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://oporuta.es/api/cron/check-costs
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://oporuta.es/api/cron/check-costs?date=2026-03-01
 *
 * Ref: directives/OpoRuta_cost_observability.md §3 — §2.23
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn({ path: '/api/cron/check-costs' }, 'Unauthorized access attempt')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const log = logger.child({ cron: 'check-costs' })
  const { searchParams } = new URL(request.url)

  // Permitir especificar fecha para análisis histórico
  const dateParam = searchParams.get('date')
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : new Date().toISOString().split('T')[0] // hoy si no se especifica

  try {
    const result = await runCostCheck(date)
    log.info(result, 'check-costs completado')
    return NextResponse.json(result)
  } catch (err) {
    log.error({ err }, 'check-costs falló')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
