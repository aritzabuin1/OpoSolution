import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkPaidAccess, getOposicionFromProfile } from '@/lib/freemium'
import {
  getSupuestoTestConfig,
  hasSupuestoTest,
  getSystemPrompt,
  buildUserPrompt,
  SupuestoGeneradoSchema,
} from '@/lib/ai/supuesto-test'
import { callAIJSON } from '@/lib/ai/provider'
import { logger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import type { Json } from '@/types/database'

/**
 * POST /api/ai/generate-supuesto-test-batch — §2.7.2
 *
 * Generates 2-3 supuestos per invocation (Vercel Hobby 60s limit).
 * Frontend calls this in a loop until 10 supuestos are generated.
 *
 * Each successful generation:
 *   1. Validates with Zod schema
 *   2. Saves to supuesto_bank (grows the bank for all users)
 *   3. Deducts 1 crédito IA from corrections_balance
 *
 * Returns: { generated, pending, creditsUsed, duplicatesDiscarded }
 */

const BATCH_SIZE = 2 // safe for Vercel Hobby 60s (each supuesto ~15-20s)
const TARGET_LOTE = 10

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-supuesto-test-batch' })

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // ── Anti-abuse rate limit ───────────────────────────────────────────────
  const rl = await checkRateLimit(user.id, 'ai-supuesto-batch', 5, '10 m')
  if (!rl.success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Espera unos minutos.' }, { status: 429 })
  }

  const serviceSupabase = await createServiceClient()

  // ── 2. Get user's oposición + validate ────────────────────────────────
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoData } = await (serviceSupabase as any)
    .from('oposiciones')
    .select('slug')
    .eq('id', oposicionId)
    .single()

  const slug = (opoData as { slug?: string })?.slug
  if (!slug || !hasSupuestoTest(slug)) {
    return NextResponse.json(
      { error: 'Tu oposición no incluye supuesto práctico tipo test.' },
      { status: 400 }
    )
  }

  const config = getSupuestoTestConfig(slug)!

  // ── 3. Check premium ────────────────────────────────────────────────────
  const isPremium = await checkPaidAccess(serviceSupabase, user.id, oposicionId)
  if (!isPremium) {
    return NextResponse.json(
      { error: 'Necesitas un pack premium para generar supuestos.', code: 'PAYWALL' },
      { status: 402 }
    )
  }

  // ── 4. Check credits ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (serviceSupabase as any)
    .from('profiles')
    .select('corrections_balance')
    .eq('id', user.id)
    .single()

  const balance = (profile as { corrections_balance?: number } | null)?.corrections_balance ?? 0
  if (balance < 1) {
    return NextResponse.json(
      {
        error: 'No tienes créditos IA suficientes. Recarga para generar más supuestos.',
        code: 'INSUFFICIENT_CREDITS',
        balance,
      },
      { status: 402 }
    )
  }

  // Cap batch to available credits
  const batchCount = Math.min(BATCH_SIZE, balance)

  // ── 5. Check how many unseen remain (are we done?) ──────────────────────
  const { data: batchSeenRows } = await (serviceSupabase as any)
    .from('user_supuestos_seen')
    .select('supuesto_id')
    .eq('user_id', user.id)
  const batchSeenIds = (batchSeenRows ?? []).map((r: { supuesto_id: string }) => r.supuesto_id)

  let unseenCountQuery = (serviceSupabase as any)
    .from('supuesto_bank')
    .select('id', { count: 'exact', head: true })
    .eq('oposicion_id', oposicionId)
  if (batchSeenIds.length > 0) {
    unseenCountQuery = unseenCountQuery.not('id', 'in', `(${batchSeenIds.join(',')})`)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: unseenCount } = await unseenCountQuery

  if ((unseenCount ?? 0) >= TARGET_LOTE) {
    return NextResponse.json({
      generated: 0,
      pending: 0,
      creditsUsed: 0,
      duplicatesDiscarded: 0,
      message: 'Ya tienes suficientes supuestos sin ver.',
    })
  }

  // ── 6. Generate batch ───────────────────────────────────────────────────
  const systemPrompt = getSystemPrompt(config)
  const userPrompt = buildUserPrompt(config)

  let generated = 0
  let creditsUsed = 0
  let duplicatesDiscarded = 0

  for (let i = 0; i < batchCount; i++) {
    try {
      const result = await callAIJSON(
        systemPrompt,
        userPrompt,
        SupuestoGeneradoSchema,
        {
          useHeavyModel: true,
          requestId,
          maxTokens: 16000,
        }
      )

      // Validate minimum questions
      const minAcceptable = Math.ceil(config.preguntasPorCaso * 0.6)
      if (result.preguntas.length < minAcceptable) {
        log.warn({ preguntasCount: result.preguntas.length, min: minAcceptable },
          '[batch] supuesto rejected — too few questions')
        continue
      }

      // Re-number questions sequentially
      const renumbered = result.preguntas.map((p, idx) => ({ ...p, numero: idx + 1 }))

      // Insert into supuesto_bank
      const row = {
        oposicion_id: oposicionId,
        caso: {
          titulo: result.titulo,
          escenario: result.escenario,
          bloques_cubiertos: result.bloques_cubiertos,
        } as Json,
        preguntas: renumbered as unknown as Json,
        es_oficial: false,
        fuente: `ai-batch-${slug}-1.0`,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (serviceSupabase as any)
        .from('supuesto_bank')
        .insert(row)

      if (insertError) {
        log.error({ error: insertError.message }, '[batch] insert error')
        continue
      }

      // Deduct 1 credit atomically via use_correction RPC (prevents race conditions)
      await serviceSupabase.rpc('use_correction', { p_user_id: user.id })

      generated++
      creditsUsed++

      log.info({ titulo: result.titulo, preguntas: renumbered.length },
        '[batch] supuesto generated and banked')

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error({ error: msg, attempt: i }, '[batch] generation failed')
      // Don't deduct credit for failed generation
    }
  }

  // ── 7. Log API usage ────────────────────────────────────────────────────
  if (creditsUsed > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceSupabase as any)
      .from('api_usage_log')
      .insert({
        user_id: user.id,
        endpoint: 'generate-supuesto-test-batch',
        model: 'batch',
        prompt_tokens: 0,
        completion_tokens: 0,
        oposicion_id: oposicionId,
      })
      .catch(() => { /* best effort */ })
  }

  // Calculate how many more the user needs
  const { data: newSeenRows } = await (serviceSupabase as any)
    .from('user_supuestos_seen')
    .select('supuesto_id')
    .eq('user_id', user.id)
  const newSeenIds = (newSeenRows ?? []).map((r: { supuesto_id: string }) => r.supuesto_id)
  let newUnseenQuery = (serviceSupabase as any)
    .from('supuesto_bank')
    .select('id', { count: 'exact', head: true })
    .eq('oposicion_id', oposicionId)
  if (newSeenIds.length > 0) {
    newUnseenQuery = newUnseenQuery.not('id', 'in', `(${newSeenIds.join(',')})`)
  }
  const { count: newUnseenCount } = await newUnseenQuery

  const stillNeeded = Math.max(0, TARGET_LOTE - (newUnseenCount ?? 0))

  return NextResponse.json({
    generated,
    pending: stillNeeded,
    creditsUsed,
    duplicatesDiscarded,
    newBalance: balance - creditsUsed,
  })
}
