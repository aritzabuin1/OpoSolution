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
 * Corrige un supuesto práctico usando la rúbrica oficial INAP.
 * Consume 1 crédito de supuesto (supuestos_balance).
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

  // Check supuestos balance (admin bypass)
  const isAdmin = await checkIsAdmin(serviceSupabase, user.id)
  let canCorrect = isAdmin

  if (!isAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (serviceSupabase as any)
      .from('profiles')
      .select('supuestos_balance')
      .eq('id', user.id)
      .single()

    const balance = (profile as { supuestos_balance?: number } | null)?.supuestos_balance ?? 0
    canCorrect = balance > 0
  }

  if (!canCorrect) {
    return NextResponse.json({
      error: 'No tienes correcciones de supuesto disponibles.',
      code: 'PAYWALL_SUPUESTOS',
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

  const systemPrompt = getSystemCorregirSupuesto(legislacionTexto || 'No se ha podido cargar la legislación de referencia. Evalúa basándote en tu conocimiento de las leyes españolas.')
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
      // Deduct 1 supuesto credit (admin bypass)
      if (!isAdmin) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: currentProfile } = await (serviceSupabase as any)
          .from('profiles')
          .select('supuestos_balance')
          .eq('id', userId)
          .single()
        const currentBalance = (currentProfile as { supuestos_balance?: number } | null)?.supuestos_balance ?? 0
        if (currentBalance > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (serviceSupabase as any)
            .from('profiles')
            .update({ supuestos_balance: currentBalance - 1 })
            .eq('id', userId)
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
