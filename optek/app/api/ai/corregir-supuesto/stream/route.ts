import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkIsAdmin, getOposicionFromProfile } from '@/lib/freemium'
import { callAIStream } from '@/lib/ai/provider'
import { getSystemCorregirSupuesto, buildCorreccionPrompt } from '@/lib/ai/supuesto-practico'
import type { SupuestoGenerado } from '@/lib/ai/supuesto-practico'
import { logger } from '@/lib/logger'
import { createSafeStreamResponse } from '@/lib/utils/stream-helpers'

export const maxDuration = 60

/**
 * POST /api/ai/corregir-supuesto/stream
 *
 * Corrige un supuesto práctico usando la rúbrica oficial INAP/MJU.
 * Consume 1 crédito IA (corrections_balance). La generación consume otro 1.
 * Total por supuesto desarrollo: 2 créditos (1 generar + 1 corregir).
 * Streaming response for real-time feedback.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const InputSchema = z.object({
  supuestoId: z.string().regex(UUID_REGEX),
  respuestas: z.record(z.string(), z.string()), // { "1": "respuesta...", "2": "..." }
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'corregir-supuesto-stream' })

  // Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  // Validate input
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }
  const parsed = InputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(i => i.message).join('; ') }, { status: 400 })
  }
  const { supuestoId, respuestas } = parsed.data

  // Rate limit
  const antiSpam = await checkRateLimit(user.id, 'ai-corregir-supuesto', 3, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) } }
    )
  }

  // Load supuesto
  const serviceSupabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: supuestoRow, error: fetchErr } = await (serviceSupabase as any)
    .from('supuestos_practicos')
    .select('id, user_id, caso, oposicion_id, corregido')
    .eq('id', supuestoId)
    .single()

  if (fetchErr || !supuestoRow) {
    return NextResponse.json({ error: 'Supuesto no encontrado.' }, { status: 404 })
  }
  if ((supuestoRow as { user_id: string }).user_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const caso = (supuestoRow as { caso: SupuestoGenerado }).caso
  const oposicionId = (supuestoRow as { oposicion_id: string }).oposicion_id

  // Resolve oposición slug for rubric selection (INAP vs MJU)
  let oposicionSlug = ''
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: opoRow } = await (serviceSupabase as any)
      .from('oposiciones')
      .select('slug')
      .eq('id', oposicionId)
      .single()
    oposicionSlug = (opoRow as { slug?: string } | null)?.slug ?? ''
  } catch { /* fallback to INAP rubric */ }

  // Check créditos IA balance (admin bypass). Corrección = 1 crédito.
  const isAdmin = await checkIsAdmin(serviceSupabase, user.id)
  let canCorrect = isAdmin

  if (!isAdmin) {
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('corrections_balance, free_corrector_used')
      .eq('id', user.id)
      .single()

    const paidBalance = profile?.corrections_balance ?? 0
    const freeRemaining = Math.max(0, 2 - (profile?.free_corrector_used ?? 0))
    canCorrect = (paidBalance + freeRemaining) >= 1
  }

  if (!canCorrect) {
    return NextResponse.json({
      error: 'Necesitas al menos 1 crédito IA para corregir un supuesto desarrollo.',
      code: 'PAYWALL_CORRECTIONS',
    }, { status: 402 })
  }

  // Build correction prompt with relevant legislation
  // Collect all referenced laws from the caso's cuestiones
  const leyesSet = new Set<string>()
  for (const c of caso.cuestiones) {
    for (const l of c.leyes_relevantes) leyesSet.add(l)
  }

  // Fetch relevant legislation text from DB
  let legislacionTexto = ''
  if (leyesSet.size > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: articles } = await (serviceSupabase as any)
      .from('legislacion')
      .select('ley_nombre, articulo_numero, texto_integro')
      .eq('activo', true)
      .limit(50)

    if (articles && articles.length > 0) {
      legislacionTexto = (articles as { ley_nombre: string; articulo_numero: string; texto_integro: string }[])
        .map(a => `${a.ley_nombre} Art. ${a.articulo_numero}: ${a.texto_integro.slice(0, 500)}`)
        .join('\n\n')
    }
  }

  // Convert respuestas keys to numbers
  const respuestasNum: Record<number, string> = {}
  for (const [key, val] of Object.entries(respuestas)) {
    respuestasNum[parseInt(key, 10)] = val
  }

  const systemPrompt = getSystemCorregirSupuesto(legislacionTexto || 'No se ha podido cargar la legislación de referencia. Evalúa basándote en tu conocimiento de las leyes españolas.', oposicionSlug)
  const userPrompt = buildCorreccionPrompt({ caso, respuestas: respuestasNum })

  // Save respuestas to DB before streaming
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceSupabase as any)
    .from('supuestos_practicos')
    .update({
      respuestas_usuario: respuestas,
      completado: true,
    })
    .eq('id', supuestoId)

  // Stream correction
  log.info({ userId: user.id, supuestoId, cuestiones: caso.cuestiones.length }, '[corregir-supuesto] starting')

  let aiStream: ReadableStream<string>
  try {
    aiStream = await callAIStream(systemPrompt, userPrompt, {
      maxTokens: 10000, // Balanced format: ~1500 tokens/cuestión + rúbrica. Fits in 60s Vercel Hobby.
      requestId,
      endpoint: 'corregir-supuesto-stream',
      useHeavyModel: true,
      userId: user.id,
      oposicionId,
    })
  } catch (err) {
    log.error({ err }, '[corregir-supuesto] AI failed')
    return NextResponse.json({ error: 'Error al corregir el supuesto.' }, { status: 500 })
  }

  const userId = user.id
  return createSafeStreamResponse({
    aiStream,
    userId,
    endpoint: 'corregir-supuesto-stream',
    context: { supuestoId },
    oposicionId,
    onComplete: async () => {
      // Deduct 1 crédito IA (admin bypass). Use paid credits first, then free.
      if (!isAdmin) {
        const { data: usedPaid } = await serviceSupabase.rpc('use_correction', { p_user_id: userId })
        if (!usedPaid) {
          await serviceSupabase.rpc('use_free_correction', { p_user_id: userId })
        }
      }

      // Mark as corrected
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceSupabase as any)
        .from('supuestos_practicos')
        .update({ corregido: true })
        .eq('id', supuestoId)
    },
  })
}
