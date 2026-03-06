import { NextResponse } from 'next/server'
import { getInfraMetrics } from '@/lib/admin/infrastructure'
import { verifyAdmin } from '@/lib/admin/auth'

/**
 * GET /api/admin/infrastructure — §2.23
 *
 * Retorna métricas de infraestructura (cacheadas 5 min).
 * Uses centralized verifyAdmin() for authorization + audit logging.
 */
export async function GET() {
  const { authorized } = await verifyAdmin('/api/admin/infrastructure')

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const metrics = await getInfraMetrics()
  return NextResponse.json(metrics, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
