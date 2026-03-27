import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { checkPaidAccess, getOposicionFromProfile } from '@/lib/freemium'
import {
  getSupuestoTestConfig,
  hasSupuestoTest,
} from '@/lib/ai/supuesto-test'
import { logger } from '@/lib/logger'
import type { Json } from '@/types/database'

/**
 * POST /api/ai/generate-supuesto-test — FASE 2.5b
 *
 * Genera un supuesto práctico en formato test (MCQ vinculadas a un caso narrativo).
 * Módulo genérico: detecta oposición del usuario → carga config → sirve/genera.
 *
 * Flow:
 *   1. Free user → servir de free_supuesto_bank (1 supuesto fijo por oposición)
 *      - Si ya lo ha hecho → paywall
 *   2. Premium user → servir de supuesto_bank (unseen por ese user)
 *   3. Si no hay unseen → generar con IA → guardar en banco → servir
 *
 * Coste IA: ~$0.35 por supuesto generado (amortizado por banco progresivo).
 */

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-supuesto-test' })

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado. Inicia sesión para continuar.' },
      { status: 401 }
    )
  }

  const serviceSupabase = await createServiceClient()

  // ── 2. Get user's oposición + check it supports supuesto test ──────────
  const oposicionId = await getOposicionFromProfile(serviceSupabase, user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: opoData } = await (serviceSupabase as any)
    .from('oposiciones')
    .select('slug, nombre')
    .eq('id', oposicionId)
    .single()

  const slug = (opoData as { slug?: string })?.slug
  const opoNombre = (opoData as { nombre?: string })?.nombre ?? 'Oposición'

  if (!slug || !hasSupuestoTest(slug)) {
    return NextResponse.json(
      { error: 'Tu oposición no incluye supuesto práctico tipo test.' },
      { status: 400 }
    )
  }

  const config = getSupuestoTestConfig(slug)!

  // ── 3. Rate limit: 5/día ─────────────────────────────────────────────────
  const rateLimit = await checkRateLimit(user.id, 'supuesto-test-daily', 5, '24 h')
  if (!rateLimit.success) {
    log.warn({ userId: user.id }, '[generate-supuesto-test] daily limit reached')
    return NextResponse.json(
      { error: 'Has alcanzado el límite de 5 supuestos diarios. Vuelve mañana.' },
      { status: 429, headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) } }
    )
  }

  // ── 4. Check paid access ────────────────────────────────────────────────
  const isPremium = await checkPaidAccess(serviceSupabase, user.id, oposicionId)

  // ── 5. FREE USER → serve from free_supuesto_bank ────────────────────────
  if (!isPremium) {
    // Check if user already did the free supuesto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (serviceSupabase as any)
      .from('tests_generados')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('tipo', 'supuesto_test')
      .eq('oposicion_id', oposicionId)

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Ya has practicado el supuesto gratuito. Hazte premium para supuestos ilimitados.', code: 'PAYWALL_SUPUESTO_TEST' },
        { status: 402 }
      )
    }

    // Serve free supuesto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: freeSupuesto } = await (serviceSupabase as any)
      .from('free_supuesto_bank')
      .select('caso, preguntas')
      .eq('oposicion_id', oposicionId)
      .single()

    if (!freeSupuesto) {
      log.error({ oposicionId }, '[generate-supuesto-test] no free supuesto available')
      return NextResponse.json(
        { error: 'El supuesto gratuito aún no está disponible para tu oposición.' },
        { status: 503 }
      )
    }

    const free = freeSupuesto as { caso: Json; preguntas: Json }
    return await saveAndReturn(serviceSupabase, user.id, oposicionId, free.caso, free.preguntas, 'free-supuesto-1.0', log)
  }

  // ── 6. PREMIUM USER → serve unseen from supuesto_bank ───────────────────

  // Get supuestos this user hasn't seen
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unseenSupuestos } = await (serviceSupabase as any)
    .from('supuesto_bank')
    .select('id, caso, preguntas')
    .eq('oposicion_id', oposicionId)
    .not('id', 'in', `(SELECT supuesto_id FROM user_supuestos_seen WHERE user_id = '${user.id}')`)
    .limit(1)

  if (unseenSupuestos && (unseenSupuestos as unknown[]).length > 0) {
    const supuesto = (unseenSupuestos as { id: string; caso: Json; preguntas: Json }[])[0]

    // Track that user saw this supuesto
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceSupabase as any)
      .from('user_supuestos_seen')
      .insert({ user_id: user.id, supuesto_id: supuesto.id })

    // Increment times_served (best-effort, not critical)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceSupabase as any)
      .rpc('increment_supuesto_served', { supuesto_id: supuesto.id })
      .catch(() => { /* RPC may not exist yet */ })

    log.info({ userId: user.id, supuestoId: supuesto.id }, '[generate-supuesto-test] served from bank')
    return await saveAndReturn(serviceSupabase, user.id, oposicionId, supuesto.caso, supuesto.preguntas, 'supuesto-bank-1.0', log)
  }

  // ── 7. No unseen supuestos → serve LEAST RECENTLY SEEN from bank ────────
  // NO real-time AI generation. All supuestos come from the pre-verified bank.
  // The bank is populated offline via `pnpm seed:supuestos` which generates
  // with AI + verifies citations against BD before inserting.
  // This guarantees: instant response + verified content + no hallucinations.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oldestSeen } = await (serviceSupabase as any)
    .from('user_supuestos_seen')
    .select('supuesto_id, seen_at')
    .eq('user_id', user.id)
    .order('seen_at', { ascending: true })
    .limit(1)
    .single()

  if (oldestSeen) {
    const oldest = oldestSeen as { supuesto_id: string; seen_at: string }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recycled } = await (serviceSupabase as any)
      .from('supuesto_bank')
      .select('caso, preguntas')
      .eq('id', oldest.supuesto_id)
      .single()

    if (recycled) {
      const s = recycled as { caso: Json; preguntas: Json }
      log.info({ userId: user.id, recycledId: oldest.supuesto_id }, '[generate-supuesto-test] recycling oldest seen supuesto')
      return await saveAndReturn(serviceSupabase, user.id, oposicionId, s.caso, s.preguntas, 'recycled-bank-1.0', log)
    }
  }

  // Absolute fallback: serve ANY from bank (least served globally)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: anySupuesto } = await (serviceSupabase as any)
    .from('supuesto_bank')
    .select('caso, preguntas')
    .eq('oposicion_id', oposicionId)
    .order('times_served', { ascending: true })
    .limit(1)
    .single()

  if (anySupuesto) {
    const s = anySupuesto as { caso: Json; preguntas: Json }
    log.info({ userId: user.id }, '[generate-supuesto-test] serving least-served from bank')
    return await saveAndReturn(serviceSupabase, user.id, oposicionId, s.caso, s.preguntas, 'bank-fallback-1.0', log)
  }

  return NextResponse.json(
    { error: 'No hay supuestos disponibles para tu oposición. Estamos preparando más.' },
    { status: 503 }
  )
}

// ─── Helper: save test + return ─────────────────────────────────────────────

async function saveAndReturn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  oposicionId: string,
  caso: Json,
  preguntas: Json,
  promptVersion: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any
) {
  // Save as tests_generados with tipo='supuesto_test'
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
    log.error({ error: error.message }, '[generate-supuesto-test] failed to save test')
    return NextResponse.json(
      { error: 'Error guardando el supuesto. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    testId: (test as { id: string }).id,
    caso,
    preguntas,
  })
}
