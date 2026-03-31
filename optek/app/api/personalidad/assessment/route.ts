import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { logger } from '@/lib/logger'
import {
  createCATState,
  selectNextItem,
  processResponse,
  getProgress,
} from '@/lib/personalidad/adaptive'
import { computeBigFiveProfile } from '@/lib/personalidad/scoring'
import { computeValidity } from '@/lib/personalidad/validity'
import type { IPIPBank, CATState, ItemResponse } from '@/lib/personalidad/types'
import ipipData from '@/data/personalidad/ipip_items.json'

export const maxDuration = 15

const bank = ipipData as IPIPBank

const InitSchema = z.object({
  action: z.literal('init'),
  cuerpo_slug: z.enum(['ertzaintza', 'guardia-civil', 'policia-nacional']),
})

const RespondSchema = z.object({
  action: z.literal('respond'),
  sesion_id: z.string().uuid(),
  item_id: z.string(),
  value: z.number().int().min(1).max(5),
})

/**
 * POST /api/personalidad/assessment
 *
 * Two actions:
 * - init: creates a new CAT session, returns first item
 * - respond: processes a response, returns next item or completion
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ endpoint: 'personalidad/assessment' })

  try {
    const body = await req.json()
    const action = body.action

    // Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceSupabase = await createServiceClient() as any

    // Rate limit
    const rl = await checkRateLimit(`personalidad:assessment:${user.id}`, 'personalidad-assessment', 120, '1 m')
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes' },
        { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rl.resetAt) } },
      )
    }

    if (action === 'init') {
      const parsed = InitSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Input inválido', details: parsed.error.flatten() }, { status: 400 })
      }

      // Check if there's an incomplete session to resume
      const { data: existing } = await serviceSupabase
        .from('personalidad_sesiones')
        .select('id, respuestas, scores')
        .eq('user_id', user.id)
        .eq('tipo', 'perfil')
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing?.respuestas?.cat_state) {
        // Resume existing session
        const catState = existing.respuestas.cat_state as CATState
        const nextItem = selectNextItem(catState, bank.items)
        const progress = getProgress(catState)

        return NextResponse.json({
          sesion_id: existing.id,
          next_item: nextItem ? { id: nextItem.id, texto: nextItem.texto } : null,
          progress,
          resumed: true,
        })
      }

      // Count completed profile sessions to determine session number
      const { count } = await serviceSupabase
        .from('personalidad_sesiones')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('tipo', 'perfil')
        .eq('completed', true)

      const sessionNumber = (count ?? 0) + 1
      const catState = createCATState(sessionNumber)
      const nextItem = selectNextItem(catState, bank.items)
      const progress = getProgress(catState)

      // Create session in DB
      const { data: sesion, error: insertError } = await serviceSupabase
        .from('personalidad_sesiones')
        .insert({
          user_id: user.id,
          tipo: 'perfil',
          respuestas: { cat_state: catState, raw_responses: [] },
          completed: false,
        })
        .select('id')
        .single()

      if (insertError || !sesion) {
        log.error({ err: insertError }, 'Failed to create assessment session')
        return NextResponse.json({ error: 'Error creando sesión' }, { status: 500 })
      }

      return NextResponse.json({
        sesion_id: sesion.id,
        next_item: nextItem ? { id: nextItem.id, texto: nextItem.texto } : null,
        progress,
      })
    }

    if (action === 'respond') {
      const parsed = RespondSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Input inválido', details: parsed.error.flatten() }, { status: 400 })
      }

      const { sesion_id, item_id, value } = parsed.data

      // Fetch session
      const { data: sesion } = await serviceSupabase
        .from('personalidad_sesiones')
        .select('id, respuestas, user_id')
        .eq('id', sesion_id)
        .eq('user_id', user.id)
        .single()

      if (!sesion) {
        return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
      }

      const catState = sesion.respuestas?.cat_state as CATState
      if (!catState) {
        return NextResponse.json({ error: 'Estado de sesión inválido' }, { status: 400 })
      }

      // Process response through CAT engine
      const newState = processResponse(
        catState,
        bank.items,
        item_id,
        value as 1 | 2 | 3 | 4 | 5,
      )

      const rawResponses = [...(sesion.respuestas?.raw_responses ?? []), { item_id, value }]

      if (newState.completed) {
        // Compute final scores
        const responses: ItemResponse[] = rawResponses.map((r: { item_id: string; value: number }) => ({
          item_id: r.item_id,
          value: r.value as 1 | 2 | 3 | 4 | 5,
        }))

        const profile = computeBigFiveProfile(bank.items, responses)
        const validity = computeValidity(bank.items, bank.consistency_pairs, responses)

        // Save completed session
        await serviceSupabase
          .from('personalidad_sesiones')
          .update({
            respuestas: { cat_state: newState, raw_responses: rawResponses },
            scores: { ...profile, validity },
            validity,
            completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sesion_id)

        // Save consistency data for each dimension
        for (const dim of profile.dimensions) {
          await serviceSupabase
            .from('personalidad_consistencia')
            .insert({
              user_id: user.id,
              dimension: dim.dimension,
              sesion_id: sesion_id,
              t_score: dim.t_score,
            })
        }

        return NextResponse.json({
          completed: true,
          profile,
          validity,
        })
      }

      // Not complete — save state and return next item
      const nextItem = selectNextItem(newState, bank.items)
      const progress = getProgress(newState)

      await serviceSupabase
        .from('personalidad_sesiones')
        .update({
          respuestas: { cat_state: newState, raw_responses: rawResponses },
          updated_at: new Date().toISOString(),
        })
        .eq('id', sesion_id)

      return NextResponse.json({
        completed: false,
        next_item: nextItem ? { id: nextItem.id, texto: nextItem.texto } : null,
        progress,
      })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (err) {
    log.error({ err }, 'Assessment endpoint error')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
