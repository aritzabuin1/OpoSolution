import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkPaidAccess, checkIsAdmin, getOposicionFromProfile } from '@/lib/freemium'
import {
  getSupuestoTestConfig,
  hasSupuestoTest,
  getSystemPrompt,
  buildUserPrompt,
  SupuestoGeneradoSchema,
} from '@/lib/ai/supuesto-test'
import { callAIJSON } from '@/lib/ai/provider'
import { logger } from '@/lib/logger'
import type { Json } from '@/types/database'

export const maxDuration = 60

/**
 * POST /api/ai/generate-supuesto-test — Banco progresivo de supuestos
 *
 * Body: { mode?: 'new' | 'repeat', supuestoId?: string }
 *
 * Modes:
 *   - 'new' (default): sirve unseen del banco gratis. Si no hay unseen, cobra 1 crédito
 *     y genera con IA (o sirve del banco si otro user generó mientras tanto).
 *   - 'repeat': repite un supuesto ya visto (gratis, para practicar).
 *
 * Free users: 1 supuesto fijo (free_supuesto_bank), luego paywall.
 *
 * Response includes stats: { totalBank, seen, unseen } for UI.
 */

const BodySchema = z.object({
  mode: z.enum(['new', 'repeat']).default('new'),
  supuestoId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-supuesto-test' })

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  let body: z.infer<typeof BodySchema>
  try {
    const raw = await request.json().catch(() => ({}))
    body = BodySchema.parse(raw)
  } catch {
    body = { mode: 'new' }
  }

  const serviceSupabase = await createServiceClient()

  // ── 2. Oposición + config ────────────────────────────────────────────────
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoData } = await (serviceSupabase as any)
    .from('oposiciones')
    .select('slug, nombre')
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

  // ── 3. Rate limit: 10/día premium, 5/día free ────���──────────────────────
  const [isPremium, isAdmin] = await Promise.all([
    checkPaidAccess(serviceSupabase, user.id, oposicionId),
    checkIsAdmin(serviceSupabase, user.id),
  ])
  const dailyLimit = isPremium || isAdmin ? 10 : 5
  const rateLimit = await checkRateLimit(user.id, 'supuesto-test-daily', dailyLimit, '24 h')
  if (!rateLimit.success && !isAdmin) {
    return NextResponse.json(
      { error: `Límite de ${dailyLimit} supuestos diarios alcanzado. Vuelve mañana.` },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) } }
    )
  }

  // ── 4. FREE USER → 1 supuesto fijo ──────────────────────────────────────
  if (!isPremium && !isAdmin) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (serviceSupabase as any)
      .from('tests_generados')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tipo', 'supuesto_test')
      .eq('oposicion_id', oposicionId)

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Ya has practicado el supuesto gratuito. Hazte premium para más.', code: 'PAYWALL_SUPUESTO_TEST' },
        { status: 402 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: freeSupuesto } = await (serviceSupabase as any)
      .from('free_supuesto_bank')
      .select('caso, preguntas')
      .eq('oposicion_id', oposicionId)
      .single()

    if (!freeSupuesto) {
      return NextResponse.json(
        { error: 'El supuesto gratuito aún no está disponible.' },
        { status: 503 }
      )
    }

    const free = freeSupuesto as { caso: Json; preguntas: Json }
    return await saveAndReturn(serviceSupabase, user.id, oposicionId, free.caso, free.preguntas, 'free-supuesto-1.0', null, log)
  }

  // ── 5. PREMIUM: get stats (scoped by oposición) ─────────────────────────
  const [{ count: totalBank }, { data: bankIds }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (serviceSupabase as any)
      .from('supuesto_bank')
      .select('id', { count: 'exact', head: true })
      .eq('oposicion_id', oposicionId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (serviceSupabase as any)
      .from('supuesto_bank')
      .select('id')
      .eq('oposicion_id', oposicionId),
  ])
  // Count seen only within this oposición's bank
  const opoIds = ((bankIds as { id: string }[] | null) ?? []).map(r => r.id)
  let seenForOpo = 0
  if (opoIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (serviceSupabase as any)
      .from('user_supuestos_seen')
      .select('supuesto_id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('supuesto_id', opoIds)
    seenForOpo = (count as number) ?? 0
  }

  const total = totalBank ?? 0
  const seen = seenForOpo
  const unseen = Math.max(0, total - seen)
  const stats = { totalBank: total, seen, unseen }

  // ── 6. MODE: repeat ─────────────────────────────────────────────────────
  if (body.mode === 'repeat') {
    if (!body.supuestoId) {
      return NextResponse.json({ error: 'supuestoId requerido para repetir.' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: supuesto } = await (serviceSupabase as any)
      .from('supuesto_bank')
      .select('caso, preguntas')
      .eq('id', body.supuestoId)
      .eq('oposicion_id', oposicionId)
      .single()

    if (!supuesto) {
      return NextResponse.json({ error: 'Supuesto no encontrado.' }, { status: 404 })
    }

    const s = supuesto as { caso: Json; preguntas: Json }
    return await saveAndReturn(serviceSupabase, user.id, oposicionId, s.caso, s.preguntas, 'repeat-1.0', stats, log)
  }

  // -- 7. PREMIUM QUOTA: first FREE_INCLUDED supuestos are free ---------------
  // After that, each unlock costs 1 credit (whether served from bank or AI-generated).
  // Credits pay for ACCESS, not generation. We only call AI when bank is exhausted.
  const FREE_INCLUDED = 5

  // Fetch unseen from bank (needed for both free and paid paths)
  // Step 1: get IDs the user has already seen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: seenRows } = await (serviceSupabase as any)
    .from('user_supuestos_seen')
    .select('supuesto_id')
    .eq('user_id', user.id)
  const seenIds = (seenRows ?? []).map((r: { supuesto_id: string }) => r.supuesto_id)

  // Step 2: fetch bank supuestos excluding seen ones
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let unseenQuery = (serviceSupabase as any)
    .from('supuesto_bank')
    .select('id, caso, preguntas')
    .eq('oposicion_id', oposicionId)
  if (seenIds.length > 0) {
    unseenQuery = unseenQuery.not('id', 'in', `(${seenIds.join(',')})`)
  }
  const { data: unseenRows } = await unseenQuery
    .order('created_at', { ascending: true })
    .limit(1)

  const hasUnseen = unseenRows && (unseenRows as unknown[]).length > 0

  // -- 7a. Within free quota: serve from bank, no credit ----------------------
  if (seen < FREE_INCLUDED && hasUnseen) {
    const supuesto = (unseenRows as { id: string; caso: Json; preguntas: Json }[])[0]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { await (serviceSupabase as any).from('user_supuestos_seen').insert({ user_id: user.id, supuesto_id: supuesto.id }) } catch { /* ignore duplicate */ }

    log.info({ userId: user.id, supuestoId: supuesto.id, seen, source: 'bank-free' }, 'Served free (within quota)')
    return await saveAndReturn(serviceSupabase, user.id, oposicionId, supuesto.caso, supuesto.preguntas, 'supuesto-bank-1.0', { ...stats, unseen: unseen - 1 }, log)
  }

  // -- 7b. Free quota used up OR no unseen: need credit -----------------------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (serviceSupabase as any)
    .from('profiles')
    .select('corrections_balance')
    .eq('id', user.id)
    .single()

  const balance = (profile as { corrections_balance?: number } | null)?.corrections_balance ?? 0

  if (balance < 1 && !isAdmin) {
    const msg = seen < FREE_INCLUDED
      ? 'No hay supuestos disponibles en el banco. Necesitas 1 credito IA para generar uno nuevo.'
      : `Has completado los ${FREE_INCLUDED} supuestos incluidos. Necesitas 1 credito IA para desbloquear el siguiente.`
    log.info({ userId: user.id, balance, seen, stats }, 'No credits - paywall')
    return NextResponse.json(
      { error: msg, code: 'PAYWALL_SUPUESTO_CREDITO', stats, balance },
      { status: 402 }
    )
  }

  // -- 8. Has credit + unseen in bank: charge 1 credit, serve from bank -------
  if (hasUnseen) {
    const supuesto = (unseenRows as { id: string; caso: Json; preguntas: Json }[])[0]

    // Deduct 1 credit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceSupabase as any).rpc('use_correction', { p_user_id: user.id })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { await (serviceSupabase as any).from('user_supuestos_seen').insert({ user_id: user.id, supuesto_id: supuesto.id }) } catch { /* ignore duplicate */ }

    log.info({ userId: user.id, supuestoId: supuesto.id, seen, source: 'bank-paid' }, 'Served from bank (1 credit)')
    return await saveAndReturn(serviceSupabase, user.id, oposicionId, supuesto.caso, supuesto.preguntas, 'supuesto-bank-1.0', { ...stats, unseen: unseen - 1 }, log)
  }

  // -- 9. Has credit + 0 unseen: generate with AI, save to bank, serve --------
  log.info({ userId: user.id, balance, seen }, 'Generating new supuesto with AI (bank exhausted)')

  try {
    const systemPrompt = getSystemPrompt(config)
    const userPrompt = buildUserPrompt(config)

    const result = await callAIJSON(
      systemPrompt,
      userPrompt,
      SupuestoGeneradoSchema,
      { useHeavyModel: true, requestId, maxTokens: 16000 }
    )

    // Validate minimum questions
    const minAcceptable = Math.ceil(config.preguntasPorCaso * 0.6)
    if (result.preguntas.length < minAcceptable) {
      log.error({ count: result.preguntas.length, min: minAcceptable }, 'Generated supuesto has too few questions')
      return NextResponse.json(
        { error: 'Error en la generación. Inténtalo de nuevo (no se ha cobrado crédito).', stats },
        { status: 500 }
      )
    }

    // Re-number questions
    const renumbered = result.preguntas.map((p, idx) => ({ ...p, numero: idx + 1 }))

    // Save to bank
    const caso = {
      titulo: result.titulo,
      escenario: result.escenario,
      bloques_cubiertos: result.bloques_cubiertos,
    } as Json

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertError } = await (serviceSupabase as any)
      .from('supuesto_bank')
      .insert({
        oposicion_id: oposicionId,
        caso,
        preguntas: renumbered as unknown as Json,
        es_oficial: false,
        fuente: `ai-ondemand-${slug}-1.0`,
      })
      .select('id')
      .single()

    if (insertError) {
      log.error({ error: insertError.message }, 'Failed to save generated supuesto to bank')
      return NextResponse.json(
        { error: 'Error guardando el supuesto. Inténtalo de nuevo (no se ha cobrado crédito).', stats },
        { status: 500 }
      )
    }

    // Deduct 1 credit atomically (only AFTER successful generation + save)
    if (!isAdmin) {
      await serviceSupabase.rpc('use_correction', { p_user_id: user.id })
    }

    // Track seen
    const supuestoId = (inserted as { id: string }).id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    try { await (serviceSupabase as any).from('user_supuestos_seen').insert({ user_id: user.id, supuesto_id: supuestoId }) } catch { /* ignore duplicate */ }

    log.info({ userId: user.id, supuestoId, titulo: result.titulo }, 'AI supuesto generated, banked, and served')

    return await saveAndReturn(
      serviceSupabase, user.id, oposicionId, caso, renumbered as unknown as Json,
      'ai-generated-1.0', { totalBank: total + 1, seen: seen + 1, unseen: 0 }, log
    )

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error({ error: msg }, 'AI generation failed — no credit charged')
    return NextResponse.json(
      { error: 'Error generando el supuesto. Inténtalo de nuevo (no se ha cobrado crédito).', stats },
      { status: 500 }
    )
  }
}

// ─── Helper: save test + return with stats ─────────────────────────────────

async function saveAndReturn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  oposicionId: string,
  caso: Json,
  preguntas: Json,
  promptVersion: string,
  stats: { totalBank: number; seen: number; unseen: number } | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any
) {
  const { data: test, error } = await supabase
    .from('tests_generados')
    .insert({
      user_id: userId,
      oposicion_id: oposicionId,
      tipo: 'supuesto_test',
      preguntas,
      supuesto_caso: caso,
      prompt_version: promptVersion,
      completado: false,
    })
    .select('id')
    .single()

  if (error) {
    log.error({ error: error.message }, 'Failed to save test')
    return NextResponse.json({ error: 'Error guardando el supuesto.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    testId: (test as { id: string }).id,
    caso,
    preguntas,
    ...(stats ? { stats } : {}),
  })
}
