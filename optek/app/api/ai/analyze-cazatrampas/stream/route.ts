import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkPaidAccess, getOposicionFromProfile, getOposicionNombreFromProfile } from '@/lib/freemium'
import { callAIStream } from '@/lib/ai/provider'
import { getSystemAnalyzeCazatrampas } from '@/lib/ai/prompts'
import { logger } from '@/lib/logger'
import { createSafeStreamResponse } from '@/lib/utils/stream-helpers'

export const maxDuration = 60

/**
 * POST /api/ai/analyze-cazatrampas/stream
 *
 * Análisis profundo IA de una sesión Caza-Trampas completada.
 * Consume 1 crédito IA. Streaming de texto plano.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const InputSchema = z.object({
  sesionId: z.string().regex(UUID_REGEX, 'sesionId debe ser un UUID válido'),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'analyze-cazatrampas-stream' })

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
  const { sesionId } = parsed.data

  // Anti-spam
  const antiSpam = await checkRateLimit(user.id, 'ai-analyze-ct', 3, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) } }
    )
  }

  // Load session
  const serviceSupabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sesion, error: fetchErr } = await (serviceSupabase as any)
    .from('cazatrampas_sesiones')
    .select('id, user_id, legislacion_id, texto_trampa, errores_reales, errores_detectados, puntuacion, completada_at')
    .eq('id', sesionId)
    .single()

  if (fetchErr || !sesion) {
    log.error({ fetchErr, sesionId }, 'Sesión cazatrampas no encontrada')
    return NextResponse.json({ error: 'Sesión no encontrada.' }, { status: 404 })
  }
  if (sesion.user_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }
  if (!sesion.completada_at) {
    return NextResponse.json({ error: 'Completa el ejercicio antes de pedir el análisis.' }, { status: 400 })
  }

  // Fetch ley info from legislacion table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: leyInfo } = await (serviceSupabase as any)
    .from('legislacion')
    .select('ley_nombre, articulo_numero')
    .eq('id', sesion.legislacion_id)
    .single()

  const leyNombre = leyInfo?.ley_nombre ?? 'Ley desconocida'
  const articuloNumero = leyInfo?.articulo_numero ?? '?'

  // Check credits
  const { data: profileCredits } = await serviceSupabase
    .from('profiles')
    .select('corrections_balance, free_corrector_used')
    .eq('id', user.id)
    .single()

  const hasPaidCredit = (profileCredits?.corrections_balance ?? 0) > 0
  const hasFreeCredit = !hasPaidCredit && (profileCredits?.free_corrector_used ?? 0) < 2
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)
  const isPaid = await checkPaidAccess(serviceSupabase, user.id, oposicionId)

  if (!hasPaidCredit && !hasFreeCredit && !isPaid) {
    return NextResponse.json({
      error: 'No tienes créditos IA disponibles.',
      code: 'PAYWALL_CORRECTIONS',
    }, { status: 402 })
  }

  // Build prompt
  type ErrorReal = { tipo: string; valor_original: string; valor_trampa: string; explicacion: string }
  const errores = sesion.errores_reales as ErrorReal[]
  const trampasTexto = errores
    .map((e: ErrorReal, i: number) =>
      `Trampa ${i + 1} (${e.tipo}):\n` +
      `  Original: "${e.valor_original}"\n` +
      `  Modificado a: "${e.valor_trampa}"\n` +
      `  Explicación básica: ${e.explicacion}`
    )
    .join('\n\n')

  const userPrompt = `Analiza en profundidad las siguientes trampas del ejercicio Caza-Trampas sobre ${leyNombre}, Art. ${articuloNumero}:\n\n${trampasTexto}`

  // Stream
  log.info({ userId: user.id, sesionId, trampas: errores.length, hasPaidCredit }, 'starting stream')

  let aiStream: ReadableStream<string>
  try {
    const oposicionNombre = await getOposicionNombreFromProfile(serviceSupabase, user.id)
    aiStream = await callAIStream(getSystemAnalyzeCazatrampas(oposicionNombre), userPrompt, {
      maxTokens: 2500,
      requestId,
      endpoint: 'analyze-cazatrampas-stream',
      useHeavyModel: true,
      userId: user.id,
      oposicionId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err }, 'failed to start stream')
    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json({ error: 'IA no disponible temporalmente.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Error al generar análisis.' }, { status: 500 })
  }

  // Pipe + deduct credit on completion
  const userId = user.id
  return createSafeStreamResponse({
    aiStream,
    userId,
    endpoint: 'analyze-cazatrampas-stream',
    context: { sesionId, trampas: errores.length },
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
