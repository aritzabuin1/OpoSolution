import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { callAIStream } from '@/lib/ai/provider'
import { getCoachingSystemPrompt, getCoachingUserPrompt } from '@/lib/personalidad/coaching'
import { computeBigFiveProfile } from '@/lib/personalidad/scoring'
import { createSafeStreamResponse } from '@/lib/utils/stream-helpers'
import { logger } from '@/lib/logger'
import type { Dimension } from '@/lib/personalidad/types'

export const maxDuration = 60

/**
 * POST /api/personalidad/coaching/stream
 * Generates a personalized coaching report based on the user's Big Five profile.
 * Costs 1 credit.
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ endpoint: 'personalidad/coaching/stream' })

  try {
    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceSupabase = await createServiceClient() as any

    // Rate limit
    const rl = await checkRateLimit(`personalidad:coaching:${user.id}`, 'personalidad-coaching', 5, '1 m')
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rl.resetAt) } },
      )
    }

    // Check credit (admin skips)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adminCheck } = await (serviceSupabase as any).from('profiles').select('is_admin').eq('id', user.id).single()
    const isAdmin = (adminCheck as { is_admin?: boolean } | null)?.is_admin === true
    if (!isAdmin) {
      const { data: hasCredit } = await serviceSupabase.rpc('use_personality_credit', { p_user_id: user.id })
      if (!hasCredit) {
        return NextResponse.json(
          { error: 'Sin créditos disponibles.', code: 'NO_CREDITS' },
          { status: 402 },
        )
      }
    }

    // Fetch latest completed profile session
    const { data: latestProfile } = await serviceSupabase
      .from('personalidad_sesiones')
      .select('scores')
      .eq('user_id', user.id)
      .eq('tipo', 'perfil')
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!latestProfile?.scores?.dimensions) {
      return NextResponse.json(
        { error: 'Completa primero un assessment de personalidad.' },
        { status: 400 },
      )
    }

    // Reconstruct BigFiveProfile from stored scores
    const profile = latestProfile.scores as import('@/lib/personalidad/types').BigFiveProfile

    // Fetch session history for trend data
    const { data: allSessions } = await serviceSupabase
      .from('personalidad_sesiones')
      .select('id, scores, created_at')
      .eq('user_id', user.id)
      .eq('tipo', 'perfil')
      .eq('completed', true)
      .order('created_at', { ascending: true })

    const sessionRecords = (allSessions ?? [])
      .filter((s: { scores?: { dimensions?: Array<{ dimension: string; t_score: number }> } }) => s.scores?.dimensions)
      .map((s: { id: string; scores: { dimensions: Array<{ dimension: string; t_score: number }> }; created_at: string }) => ({
        session_id: s.id,
        date: s.created_at.split('T')[0],
        dimension_scores: Object.fromEntries(
          s.scores.dimensions.map((d: { dimension: string; t_score: number }) => [d.dimension, d.t_score])
        ) as Record<Dimension, number>,
      }))

    const systemPrompt = getCoachingSystemPrompt()
    const userPrompt = getCoachingUserPrompt(profile, sessionRecords.length > 1 ? sessionRecords : undefined)

    const aiStream = await callAIStream(systemPrompt, userPrompt, {
      temperature: 0.4,
      endpoint: 'personalidad-coaching',
      userId: user.id,
    })

    // Save coaching session
    const { data: sesion } = await serviceSupabase
      .from('personalidad_sesiones')
      .insert({
        user_id: user.id,
        tipo: 'coaching',
        scores: { profile_snapshot: profile },
        respuestas: {},
        completed: false,
      })
      .select('id')
      .single()

    return createSafeStreamResponse({
      aiStream,
      userId: user.id,
      endpoint: 'personalidad/coaching/stream',
      onComplete: async () => {
        if (sesion) {
          await serviceSupabase
            .from('personalidad_sesiones')
            .update({ completed: true, updated_at: new Date().toISOString() })
            .eq('id', sesion.id)
        }
      },
    })
  } catch (err) {
    log.error({ err }, 'Coaching stream error')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
