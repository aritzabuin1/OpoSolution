import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/analytics/track
 *
 * Lightweight internal event tracking for product analytics.
 * Inserts into api_usage_log with cost=0 for UI events (views, clicks).
 *
 * Used to measure funnel: how many users SEE vs CLICK analysis CTAs.
 *
 * Body: { event: string } — e.g. "view:analysis-cta", "click:analysis-cta"
 */

const ALLOWED_EVENTS = new Set([
  'view:analysis-cta',
  'click:analysis-cta',
  'view:informe-simulacro-cta',
  'click:informe-simulacro-cta',
  'view:cazatrampas-analysis-cta',
  'click:cazatrampas-analysis-cta',
  'view:flashcard-analysis-cta',
  'click:flashcard-analysis-cta',
])

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const body = await request.json().catch(() => null)
    const event = body?.event
    if (typeof event !== 'string' || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const serviceSupabase = await createServiceClient()
    // Fire-and-forget — don't block response on DB insert
    void serviceSupabase.from('api_usage_log').insert({
      user_id: user.id,
      endpoint: event,
      model: 'track',
      tokens_in: 0,
      tokens_out: 0,
      cost_estimated_cents: 0,
      oposicion_id: null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
