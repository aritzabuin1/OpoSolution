import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/health
 *
 * Health check con verificación real de conectividad a Supabase.
 * DDIA Observability: endpoint de referencia para monitoring y CI/CD.
 *
 * Response:
 *   200 → { status: 'healthy', checks: { database: 'ok' }, latency_ms: number }
 *   503 → { status: 'unhealthy', checks: { database: 'error' }, error: string }
 */
export async function GET() {
  const start = Date.now()

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('oposiciones').select('id').limit(1)

    if (error) throw error

    const latencyMs = Date.now() - start
    logger.info({ latencyMs }, 'Health check: database OK')

    return NextResponse.json({
      status: 'healthy',
      checks: { database: 'ok' },
      latency_ms: latencyMs,
    })
  } catch (err) {
    const latencyMs = Date.now() - start
    logger.error({ err, latencyMs }, 'Health check: database error')

    return NextResponse.json(
      {
        status: 'unhealthy',
        checks: { database: 'error' },
        error: 'Database connection failed',
        latency_ms: latencyMs,
      },
      { status: 503 }
    )
  }
}
