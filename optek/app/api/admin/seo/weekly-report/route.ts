/**
 * GET /api/admin/seo/weekly-report — PlanSEO F6.T5
 *
 * Compara queries/posiciones GSC semana actual vs semana anterior.
 * Admin-protected. Se puede disparar desde /admin/seo (botón refresh).
 */

import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin/auth'
import { getWeekOverWeekQueries } from '@/lib/seo/gsc-queries'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const auth = await verifyAdmin('seo-weekly-report')
  if (!auth.authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!process.env.GSC_SERVICE_ACCOUNT_EMAIL) {
    return NextResponse.json({ error: 'GSC no configurado' }, { status: 503 })
  }

  try {
    const rows = await getWeekOverWeekQueries(500)

    // Queries que subieron/bajaron ≥3 posiciones (con ambos datos)
    const moved = rows.filter(r => r.posCurr > 0 && r.posPrev > 0 && Math.abs(r.deltaPos) >= 3)
    const rising = moved.filter(r => r.deltaPos > 0).sort((a, b) => b.deltaPos - a.deltaPos).slice(0, 20)
    const falling = moved.filter(r => r.deltaPos < 0).sort((a, b) => a.deltaPos - b.deltaPos).slice(0, 20)

    // Caídas de clics ≥30%
    const clickDrops = rows
      .filter(r => r.clicksPrev >= 5 && r.clicksCurr < r.clicksPrev * 0.7)
      .sort((a, b) => a.deltaClicks - b.deltaClicks)
      .slice(0, 20)

    // Nuevas queries (solo en semana actual con clics)
    const newQueries = rows
      .filter(r => r.clicksPrev === 0 && r.clicksCurr > 0)
      .sort((a, b) => b.clicksCurr - a.clicksCurr)
      .slice(0, 20)

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      totals: {
        queries_analizadas: rows.length,
        subieron_3pos: rising.length,
        bajaron_3pos: falling.length,
        caida_clicks_30pct: clickDrops.length,
        queries_nuevas: newQueries.length,
      },
      rising,
      falling,
      click_drops: clickDrops,
      new_queries: newQueries,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
