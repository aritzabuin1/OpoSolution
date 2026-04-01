import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { callAI } from '@/lib/ai/provider'
import { getSJTSystemPrompt, getSJTUserPrompt, scoreSJTResponse, getSJTFeedback } from '@/lib/personalidad/sjt'
import { logger } from '@/lib/logger'
import type { Dimension } from '@/lib/personalidad/types'

export const maxDuration = 30

const InputSchema = z.object({
  cuerpo_slug: z.enum(['ertzaintza', 'guardia-civil', 'policia-nacional']),
  dimension_focus: z.enum(['O', 'C', 'E', 'A', 'N']).optional(),
})

const ScoreInputSchema = z.object({
  sesion_id: z.string().uuid(),
  user_ranking: z.array(z.number().int().min(0).max(4)).length(5),
})

/**
 * POST /api/personalidad/sjt
 *
 * Two modes:
 * - action: "generate" — generates a new SJT scenario (costs 1 credit)
 * - action: "score" — scores user's ranking for an existing scenario (free)
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ endpoint: 'personalidad/sjt' })

  try {
    const body = await req.json()
    const action = body.action ?? 'generate'

    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceSupabase = await createServiceClient() as any

    if (action === 'score') {
      // Score an existing scenario — no credit cost
      const parsed = ScoreInputSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Input inválido', details: parsed.error.flatten() }, { status: 400 })
      }

      const { sesion_id, user_ranking } = parsed.data

      // Fetch the session
      const { data: sesion } = await serviceSupabase
        .from('personalidad_sesiones')
        .select('scores')
        .eq('id', sesion_id)
        .eq('user_id', user.id)
        .single()

      if (!sesion?.scores?.ranking_ideal) {
        return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
      }

      const concordancia = scoreSJTResponse(sesion.scores.ranking_ideal, user_ranking)
      const feedback = getSJTFeedback(concordancia)

      // Update session with user response
      await serviceSupabase
        .from('personalidad_sesiones')
        .update({
          respuestas: { user_ranking },
          scores: { ...sesion.scores, concordancia, feedback },
          completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sesion_id)

      return NextResponse.json({ concordancia, feedback })
    }

    // Generate mode — costs 1 credit
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input inválido', details: parsed.error.flatten() }, { status: 400 })
    }

    // Rate limit
    const rl = await checkRateLimit(`personalidad:sjt:${user.id}`, 'personalidad-sjt', 10, '1 m')
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento.' },
        { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rl.resetAt) } },
      )
    }

    // Check & deduct credit (admin skips — is_admin grants unlimited)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adminCheck } = await (serviceSupabase as any).from('profiles').select('is_admin').eq('id', user.id).single()
    const isAdmin = (adminCheck as { is_admin?: boolean } | null)?.is_admin === true
    if (!isAdmin) {
      const { data: hasCredit } = await serviceSupabase.rpc('use_personality_credit', { p_user_id: user.id })
      if (!hasCredit) {
        return NextResponse.json(
          { error: 'Sin créditos disponibles. Recarga para continuar.', code: 'NO_CREDITS' },
          { status: 402 },
        )
      }
    }

    const { cuerpo_slug, dimension_focus } = parsed.data

    // Generate scenario via AI
    const systemPrompt = getSJTSystemPrompt(cuerpo_slug)
    const userPrompt = getSJTUserPrompt(dimension_focus as Dimension | undefined)

    const aiResponse = await callAI(userPrompt, {
      systemPrompt,
      temperature: 0.7,
      endpoint: 'personalidad-sjt',
      userId: user.id,
    })

    // Parse AI response — extract JSON even if wrapped in markdown code blocks
    let scenario
    try {
      // Try direct parse first
      scenario = JSON.parse(aiResponse)
    } catch {
      // Try extracting from ```json ... ``` blocks
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        scenario = JSON.parse(jsonMatch[1].trim())
      } else {
        // Try finding first { to last }
        const start = aiResponse.indexOf('{')
        const end = aiResponse.lastIndexOf('}')
        if (start !== -1 && end > start) {
          scenario = JSON.parse(aiResponse.slice(start, end + 1))
        } else {
          log.error({ aiResponse: aiResponse.slice(0, 500) }, 'SJT: AI returned non-JSON')
          return NextResponse.json({ error: 'Error generando escenario. Inténtalo de nuevo.' }, { status: 500 })
        }
      }
    }

    // Save session
    const { data: sesion, error: insertError } = await serviceSupabase
      .from('personalidad_sesiones')
      .insert({
        user_id: user.id,
        tipo: 'sjt',
        oposicion_id: null, // SJT is transversal
        respuestas: {},
        scores: {
          escenario: scenario.escenario,
          opciones: scenario.opciones,
          ranking_ideal: scenario.ranking_ideal,
          dimension_focus: scenario.dimension_focus,
          explicacion: scenario.explicacion,
        },
        completed: false,
      })
      .select('id')
      .single()

    if (insertError) {
      log.error({ err: insertError }, 'Failed to save SJT session')
      return NextResponse.json({ error: 'Error guardando sesión' }, { status: 500 })
    }

    // Return scenario WITHOUT the ideal ranking (user must rank first)
    return NextResponse.json({
      sesion_id: sesion.id,
      escenario: scenario.escenario,
      opciones: scenario.opciones,
      dimension_focus: scenario.dimension_focus,
    })
  } catch (err) {
    log.error({ err }, 'SJT endpoint error')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
