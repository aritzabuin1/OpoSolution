import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { callAIStream } from '@/lib/ai/provider'
import { getInterviewSystemPrompt } from '@/lib/personalidad/interview'
import { createSafeStreamResponse } from '@/lib/utils/stream-helpers'
import { logger } from '@/lib/logger'
import type { Dimension } from '@/lib/personalidad/types'

export const maxDuration = 60

const InputSchema = z.object({
  sesion_id: z.string().uuid().optional(), // existing session to continue
  cuerpo_slug: z.enum(['ertzaintza', 'guardia-civil', 'policia-nacional']),
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(30).default([]),
})

/**
 * POST /api/personalidad/interview/stream
 * Streaming interview with AI psychologist.
 * First call costs 1 credit (creates session). Follow-up messages are free within same session.
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ endpoint: 'personalidad/interview/stream' })

  try {
    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input inválido', details: parsed.error.flatten() }, { status: 400 })
    }

    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceSupabase = await createServiceClient() as any
    const { sesion_id, cuerpo_slug, message, history } = parsed.data

    // Rate limit
    const rl = await checkRateLimit(`personalidad:interview:${user.id}`, 'personalidad-interview', 20, '1 m')
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rl.resetAt) } },
      )
    }

    let currentSesionId = sesion_id

    // If no session, create one (costs 1 credit; admin skips)
    if (!currentSesionId) {
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

      const { data: newSesion, error: insertError } = await serviceSupabase
        .from('personalidad_sesiones')
        .insert({
          user_id: user.id,
          tipo: 'entrevista',
          respuestas: { messages: [] },
          completed: false,
        })
        .select('id')
        .single()

      if (insertError || !newSesion) {
        log.error({ err: insertError }, 'Failed to create interview session')
        return NextResponse.json({ error: 'Error creando sesión' }, { status: 500 })
      }
      currentSesionId = newSesion.id
    }

    // Fetch user's Big Five profile if available (from most recent completed perfil session)
    let bigFiveProfile: Record<Dimension, number> | undefined
    const { data: latestProfile } = await serviceSupabase
      .from('personalidad_sesiones')
      .select('scores')
      .eq('user_id', user.id)
      .eq('tipo', 'perfil')
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (latestProfile?.scores?.dimensions) {
      bigFiveProfile = {} as Record<Dimension, number>
      for (const ds of latestProfile.scores.dimensions) {
        bigFiveProfile[ds.dimension as Dimension] = ds.t_score
      }
    }

    const systemPrompt = getInterviewSystemPrompt(cuerpo_slug, bigFiveProfile)

    // Build conversation for AI
    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Flatten multi-turn conversation into a single user prompt
    const conversationText = messages.map((m: { role: string; content: string }) =>
      `${m.role === 'user' ? 'Candidato' : 'Psicólogo'}: ${m.content}`
    ).join('\n\n')
    const userPrompt = conversationText || message

    const aiStream = await callAIStream(systemPrompt, userPrompt, {
      temperature: 0.6,
      endpoint: 'personalidad-interview',
      userId: user.id,
    })

    // Save updated conversation to session on completion
    const updatedMessages = [
      ...history,
      { role: 'user', content: message },
    ]

    return createSafeStreamResponse({
      aiStream,
      userId: user.id,
      endpoint: 'personalidad/interview/stream',
      onComplete: async () => {
        // Update session with latest messages
        await serviceSupabase
          .from('personalidad_sesiones')
          .update({
            respuestas: { messages: updatedMessages },
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentSesionId)
      },
    })
  } catch (err) {
    log.error({ err }, 'Interview stream error')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
