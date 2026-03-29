import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { callAIJSON } from '@/lib/ai/provider'
import { SYSTEM_CAZATRAMPAS, buildCazaTrampasPrompt } from '@/lib/ai/prompts'
import { CazaTrampasRawSchema } from '@/lib/ai/schemas'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/auth/cron-auth'
import { sendPushToAll } from '@/lib/push/send'

// Vercel Hobby max: 60s. Single-rama invocation needs 15-40s.
export const maxDuration = 60

/**
 * Laws relevant to each rama for reto diario generation.
 * Used to filter legislacion table so the reto is relevant to the oposicion.
 */
const RAMAS_CONFIG: Record<string, string[]> = {
  age: [
    'CE', 'LPAC', 'LRJSP', 'TREBEP', 'LGP',
    'LCSP', 'SUBVENCIONES', 'TRANSPARENCIA', 'LOIGUALDAD',
    'LGOB', 'LOPDGDD', 'LOTC',
  ],
  justicia: [
    'CE', 'LOPJ', 'LEC', 'LECrim', 'LECRIM', 'TREBEP',
    'LOTC', 'LOVIGEN', 'LGTBI',
  ],
  correos: [
    'CE', 'TREBEP', 'LEY_POSTAL', 'RD_POSTAL',
    'LOIGUALDAD', 'LGTBI', 'LOPDGDD',
  ],
}

type LegislacionRow = {
  id: string
  ley_nombre: string
  articulo_numero: string
  titulo_capitulo: string | null
  texto_integro: string
}

type RamaResult = { ok: boolean; skipped?: boolean; id?: string; reason?: string }

/**
 * Generate a reto diario for a single rama.
 * Extracted helper so the route can invoke it per-rama or in a loop.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateRetoForRama(rama: string, today: string, supabase: any, parentLog: any): Promise<RamaResult> {
  const ramaLog = parentLog.child({ rama })

  // Idempotency: check if reto already exists for today + this rama
  const { data: existing } = await supabase
    .from('reto_diario')
    .select('id, fecha')
    .eq('fecha', today)
    .eq('rama', rama)
    .maybeSingle()

  if (existing) {
    ramaLog.info({ id: existing.id }, '[reto-diario-cron] reto ya existe para hoy')
    return { ok: true, skipped: true, id: existing.id }
  }

  // Get laws for this rama
  const leyes = RAMAS_CONFIG[rama]
  if (!leyes || leyes.length === 0) {
    ramaLog.warn('[reto-diario-cron] No hay leyes configuradas para esta rama')
    return { ok: false, reason: 'no_laws_configured' }
  }

  // Fetch candidate articles filtered by rama's laws
  const { data: candidatos, error: fetchErr } = await supabase
    .from('legislacion')
    .select('id, ley_nombre, articulo_numero, titulo_capitulo, texto_integro')
    .eq('activo', true)
    .not('texto_integro', 'is', null)
    .in('ley_nombre', leyes)
    .limit(80)

  if (fetchErr || !candidatos || candidatos.length === 0) {
    ramaLog.error({ err: fetchErr }, '[reto-diario-cron] No hay artículos disponibles')
    return { ok: false, reason: 'no_articles' }
  }

  const validos = (candidatos as LegislacionRow[]).filter(
    (a) => a.texto_integro && a.texto_integro.length >= 300
  )

  if (validos.length === 0) {
    ramaLog.error('[reto-diario-cron] Sin artículos con texto suficiente')
    return { ok: false, reason: 'articles_too_short' }
  }

  const articulo = validos[Math.floor(Math.random() * validos.length)]!
  const NUM_ERRORES = 3

  // ── Generate Caza-Trampas ──────────────────────────────────────────
  let textoTrampa = ''
  let erroresVerificados: ReturnType<typeof CazaTrampasRawSchema.parse>['errores_reales'] = []
  let succeeded = false

  try {
    const prompt = buildCazaTrampasPrompt({
      textoOriginal: articulo.texto_integro,
      leyNombre: articulo.ley_nombre,
      articuloNumero: articulo.articulo_numero,
      numErrores: NUM_ERRORES,
    })

    const raw = await callAIJSON(SYSTEM_CAZATRAMPAS, prompt, CazaTrampasRawSchema, {
      endpoint: 'cron-reto-diario',
    })

    if (raw) {
      const fallos = raw.errores_reales.filter(
        (e) => !articulo.texto_integro.includes(e.valor_original)
      )
      const trampaOk = raw.errores_reales.every((e) => raw.texto_trampa.includes(e.valor_trampa))

      if (fallos.length === 0 && trampaOk) {
        textoTrampa = raw.texto_trampa
        erroresVerificados = raw.errores_reales
        succeeded = true
      } else {
        ramaLog.warn({ fallos: fallos.length, trampaOk }, '[reto-diario-cron] verificación fallida')
      }
    } else {
      ramaLog.warn('[reto-diario-cron] AI devolvió null')
    }
  } catch (err) {
    ramaLog.error({ err }, '[reto-diario-cron] Error en generación')
    return { ok: false, reason: 'generation_error' }
  }

  if (!succeeded) {
    ramaLog.warn('[reto-diario-cron] No se pudo generar — on-demand fallback will handle')
    return { ok: false, reason: 'verification_failed' }
  }

  // ── Insert into DB ────────────────────────────────────────────────
  const { data: inserted, error: insertErr } = await supabase
    .from('reto_diario')
    .insert({
      fecha: today,
      rama,
      ley_nombre: articulo.ley_nombre,
      articulo_numero: articulo.articulo_numero,
      texto_trampa: textoTrampa,
      errores_reales: erroresVerificados,
      num_errores: NUM_ERRORES,
    })
    .select('id')
    .single()

  if (insertErr) {
    if ((insertErr as { code?: string }).code === '23505') {
      ramaLog.info('[reto-diario-cron] UNIQUE conflict — otro worker ya generó el reto')
      return { ok: true, skipped: true }
    }
    ramaLog.error({ err: insertErr }, '[reto-diario-cron] Error insertando reto')
    return { ok: false, reason: 'db_insert_error' }
  }

  ramaLog.info({ id: inserted.id }, '[reto-diario-cron] Reto diario generado')

  // Send push notification (fire-and-forget)
  void sendPushToAll({
    title: 'Reto Diario disponible',
    body: `${articulo.ley_nombre}, art. ${articulo.articulo_numero} — ¿Encuentras los ${NUM_ERRORES} errores?`,
    url: '/reto-diario',
    tag: `reto-diario-${rama}`,
  }).catch(err => ramaLog.warn({ err }, '[reto-diario-cron] push notification failed'))

  return { ok: true, skipped: false, id: inserted.id }
}

/**
 * GET /api/cron/generate-reto-diario — §2.20.3
 *
 * Genera UN Reto Diario de Caza-Trampas para hoy.
 *
 * Two invocation modes:
 *   1. ?rama=age  → process ONLY that rama (fast, fits in Vercel Hobby 60s)
 *   2. No param   → process ALL active ramas sequentially (backward compat / fallback)
 *
 * Idempotente: si ya existe un reto para hoy + rama → skip.
 * Invocado por Vercel Cron (vercel.json: 3 staggered entries, one per rama).
 * Si falla alguna rama, el on-demand fallback (lib/ai/reto-diario.ts) genera
 * cuando el usuario visita /api/reto-diario.
 *
 * Autenticación: Bearer ${CRON_SECRET}.
 */
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'cron/generate-reto-diario' })

  try {
    // ── Auth (timing-safe) ─────────────────────────────────────────────────
    const authError = verifyCronSecret(request)
    if (authError) {
      log.warn('[reto-diario-cron] Unauthorized')
      return authError
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createServiceClient() as any

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC

    // ── Check for ?rama= query parameter (manual trigger) ──────────────────
    const ramaParam = request.nextUrl.searchParams.get('rama')

    if (ramaParam) {
      // Manual single-rama mode
      log.info({ rama: ramaParam }, '[reto-diario-cron] Single-rama mode')
      if (!RAMAS_CONFIG[ramaParam]) {
        return NextResponse.json({ ok: false, reason: 'unknown_rama', rama: ramaParam }, { status: 400 })
      }
      const result = await generateRetoForRama(ramaParam, today, supabase, log)
      return NextResponse.json({ ok: result.ok, fecha: today, results: { [ramaParam]: result } })
    }

    // ── Auto-rotate: find the FIRST active rama missing today's reto ────────
    // Vercel Hobby = 2 cron jobs max, so we use 1 cron that runs 3x staggered.
    // Each invocation generates for 1 rama that doesn't have a reto yet today.
    const { data: ramaRows, error: ramaErr } = await supabase
      .from('oposiciones')
      .select('rama')
      .eq('activa', true)

    if (ramaErr || !ramaRows || ramaRows.length === 0) {
      log.error({ err: ramaErr }, '[reto-diario-cron] No hay oposiciones activas')
      return NextResponse.json({ ok: false, reason: 'no_active_oposiciones' })
    }

    const activeRamas = [...new Set((ramaRows as { rama: string }[]).map(r => r.rama))] as string[]

    // Check which ramas already have a reto for today
    const { data: existingRetos } = await supabase
      .from('reto_diario')
      .select('rama')
      .eq('fecha', today)

    const ramasConReto = new Set((existingRetos ?? []).map((r: { rama: string }) => r.rama))
    const ramasPendientes = activeRamas.filter(r => !ramasConReto.has(r))

    if (ramasPendientes.length === 0) {
      log.info({ fecha: today }, '[reto-diario-cron] Todas las ramas ya tienen reto')
      return NextResponse.json({ ok: true, fecha: today, results: {}, message: 'all_done' })
    }

    // Generate for the FIRST pending rama only (stay under 60s timeout)
    const targetRama = ramasPendientes[0]
    log.info({ rama: targetRama, pendientes: ramasPendientes.length }, '[reto-diario-cron] Auto-rotate')

    const result = await generateRetoForRama(targetRama, today, supabase, log)
    log.info({ fecha: today, rama: targetRama, result, remaining: ramasPendientes.length - 1 }, '[reto-diario-cron] Done')
    return NextResponse.json({ ok: result.ok, fecha: today, results: { [targetRama]: result }, remaining: ramasPendientes.length - 1 })
  } catch (err) {
    // Global catch — prevents generic 500 HTML page from Vercel/Next.js
    log.error({ err }, '[reto-diario-cron] Unhandled error')
    return NextResponse.json({ ok: false, reason: 'unhandled_error' })
  }
}
