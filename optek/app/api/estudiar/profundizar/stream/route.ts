import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkPaidAccess, getOposicionFromProfile } from '@/lib/freemium'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { callAIStream } from '@/lib/ai/provider'
import { SYSTEM_PROFUNDIZAR, buildProfundizarPrompt } from '@/lib/estudiar/prompts'
import { createSafeStreamResponse } from '@/lib/utils/stream-helpers'
import { logger } from '@/lib/logger'

export const maxDuration = 60

/**
 * POST /api/estudiar/profundizar/stream
 *
 * Deep-dive streaming sobre un artículo concreto.
 * Consume 1 crédito IA. Respuesta personalizada (no se cachea).
 */

const InputSchema = z.object({
  ley: z.string().min(1, 'ley es requerido'),
  articuloNumero: z.string().min(1, 'articuloNumero es requerido'),
  pregunta: z.string().min(5, 'La pregunta debe tener al menos 5 caracteres').max(500),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'estudiar-profundizar' })

  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  // Validate
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }
  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 })
  }
  const { ley, articuloNumero, pregunta } = parsed.data

  const serviceSupabase = await createServiceClient()

  // Check premium
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const isPaid = await checkPaidAccess(serviceSupabase, user.id, oposicionId)

  // Check credits
  const { data: profileCredits } = await serviceSupabase
    .from('profiles')
    .select('corrections_balance, free_corrector_used')
    .eq('id', user.id)
    .single()

  const hasPaidCredit = (profileCredits?.corrections_balance ?? 0) > 0
  const hasFreeCredit = !hasPaidCredit && (profileCredits?.free_corrector_used ?? 0) < 2

  if (!hasPaidCredit && !hasFreeCredit && !isPaid) {
    return NextResponse.json({
      error: 'No tienes créditos IA disponibles.',
      code: 'PAYWALL_CORRECTIONS',
    }, { status: 402 })
  }

  // Anti-spam
  const rl = await checkRateLimit(user.id, 'estudiar-profundizar', 10, '1 h')
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rl.resetAt) } }
    )
  }

  // Fetch the specific article
  const { data: articulo } = await serviceSupabase
    .from('legislacion')
    .select('articulo_numero, texto_integro, ley_nombre, ley_codigo')
    .eq('ley_codigo', ley)
    .eq('articulo_numero', articuloNumero)
    .single()

  if (!articulo) {
    return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 })
  }

  // Fetch adjacent articles for context (±3)
  const artNum = parseInt(articuloNumero, 10)
  const { data: contexto } = await serviceSupabase
    .from('legislacion')
    .select('articulo_numero, texto_integro')
    .eq('ley_codigo', ley)
    .neq('articulo_numero', articuloNumero)
    .order('articulo_numero')

  // Filter to ±3 adjacent
  const articulosAdyacentes = (contexto ?? []).filter(a => {
    const num = parseInt(a.articulo_numero, 10)
    return !isNaN(num) && !isNaN(artNum) && Math.abs(num - artNum) <= 3
  }).slice(0, 6)

  // Stream
  log.info({ userId: user.id, ley, articuloNumero, pregunta: pregunta.slice(0, 50) }, 'starting profundizar stream')

  let aiStream: ReadableStream<string>
  try {
    aiStream = await callAIStream(
      SYSTEM_PROFUNDIZAR,
      buildProfundizarPrompt(
        { numero: articulo.articulo_numero, texto_integro: articulo.texto_integro, ley_nombre: articulo.ley_nombre },
        pregunta,
        articulosAdyacentes.map(a => ({ numero: a.articulo_numero, texto_integro: a.texto_integro }))
      ),
      {
        maxTokens: 2000,
        requestId,
        endpoint: 'estudiar-profundizar',
        useHeavyModel: true,
        userId: user.id,
        oposicionId,
      }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err }, 'failed to start profundizar stream')
    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json({ error: 'IA no disponible temporalmente.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Error al generar respuesta.' }, { status: 500 })
  }

  // Pipe + deduct credit on completion
  const userId = user.id
  return createSafeStreamResponse({
    aiStream,
    userId,
    endpoint: 'estudiar-profundizar',
    context: { ley, articuloNumero },
    oposicionId,
    onComplete: async () => {
      if (hasPaidCredit) {
        await serviceSupabase.rpc('use_correction', { p_user_id: userId })
      } else {
        await serviceSupabase.rpc('use_free_correction', { p_user_id: userId })
      }
    },
  })
}
