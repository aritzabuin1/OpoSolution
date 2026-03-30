import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkIsAdmin, getOposicionFromProfile } from '@/lib/freemium'
import { callAIJSON } from '@/lib/ai/provider'
import { SYSTEM_GENERATE_SUPUESTO } from '@/lib/ai/supuesto-practico'
import type { SupuestoGenerado } from '@/lib/ai/supuesto-practico'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import type { Json } from '@/types/database'

export const maxDuration = 60

/**
 * POST /api/ai/generate-supuesto
 *
 * Genera un supuesto práctico realista para GACE (A2).
 * Consume 1 crédito IA (corrections_balance). La corrección posterior consume otro.
 * Premium only — free users cannot access.
 */

const SupuestoSchema = z.object({
  titulo: z.string(),
  contexto: z.string(),
  cuestiones: z.array(z.object({
    numero: z.number(),
    enunciado: z.string(),
    subpreguntas: z.array(z.string()),
    bloque: z.enum(['IV', 'V', 'VI']),
    leyes_relevantes: z.array(z.string()),
  })),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-supuesto' })

  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  // Rate limit
  const antiSpam = await checkRateLimit(user.id, 'ai-supuesto', 3, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) } }
    )
  }

  // Check supuestos balance
  const serviceSupabase = await createServiceClient()
  const isAdmin = await checkIsAdmin(serviceSupabase, user.id)
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)

  if (!isAdmin) {
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('corrections_balance, free_corrector_used')
      .eq('id', user.id)
      .single()

    const paidBalance = profile?.corrections_balance ?? 0
    const freeRemaining = Math.max(0, 2 - (profile?.free_corrector_used ?? 0))
    if ((paidBalance + freeRemaining) < 1) {
      return NextResponse.json({
        error: 'No tienes créditos IA disponibles.',
        code: 'PAYWALL_CORRECTIONS',
      }, { status: 402 })
    }
  }

  // Generate supuesto via AI
  log.info({ userId: user.id }, '[generate-supuesto] generating')

  const userPrompt = `Genera un supuesto práctico completo para el examen GACE A2 con 5 cuestiones.
Mezcla obligatoriamente: al menos 1 cuestión de contratación (Bloque IV), 1 de personal (Bloque V) y 1 de presupuestos (Bloque VI).
Las otras 2 cuestiones pueden ser de cualquiera de los 3 bloques.`

  let supuesto: SupuestoGenerado
  try {
    supuesto = await callAIJSON(
      SYSTEM_GENERATE_SUPUESTO,
      userPrompt,
      SupuestoSchema,
      {
        maxTokens: 8000,
        endpoint: 'generate-supuesto',
        userId: user.id,
        requestId,
        oposicionId,
        temperature: 0.7, // More variety in cases
      }
    )
  } catch (err) {
    log.error({ err }, '[generate-supuesto] AI failed')
    return NextResponse.json({ error: 'Error al generar el supuesto práctico.' }, { status: 500 })
  }

  // Save to DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: insertErr } = await (serviceSupabase as any)
    .from('supuestos_practicos')
    .insert({
      user_id: user.id,
      oposicion_id: oposicionId,
      caso: supuesto as unknown as Json,
      completado: false,
      corregido: false,
    })
    .select('id')
    .single()

  if (insertErr || !row) {
    log.error({ err: insertErr }, '[generate-supuesto] DB insert failed')
    return NextResponse.json({ error: 'Error al guardar el supuesto.' }, { status: 500 })
  }

  // Deduct 1 crédito IA for generation. Correction deducts 1 more. Total: 2/supuesto.
  if (!isAdmin) {
    const { data: p } = await serviceSupabase
      .from('profiles')
      .select('corrections_balance')
      .eq('id', user.id)
      .single()
    if ((p?.corrections_balance ?? 0) > 0) {
      await serviceSupabase.rpc('use_correction', { p_user_id: user.id })
    } else {
      await serviceSupabase.rpc('use_free_correction', { p_user_id: user.id })
    }
  }

  log.info({ userId: user.id, supuestoId: (row as { id: string }).id }, '[generate-supuesto] created')

  return NextResponse.json({
    id: (row as { id: string }).id,
    caso: supuesto,
  })
}
