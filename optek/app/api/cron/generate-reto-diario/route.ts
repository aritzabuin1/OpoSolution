import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { callAIJSON } from '@/lib/ai/provider'
import { SYSTEM_CAZATRAMPAS, buildCazaTrampasPrompt } from '@/lib/ai/prompts'
import { CazaTrampasRawSchema } from '@/lib/ai/schemas'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/auth/cron-auth'

// Vercel Hobby max: 60s. AI generation needs 15-40s.
export const maxDuration = 60

/**
 * GET /api/cron/generate-reto-diario — §2.20.3
 *
 * Genera el Reto Diario de Caza-Trampas para hoy.
 * Idempotente: si ya existe un reto para hoy → return 200 sin acción.
 * Invocado por Vercel Cron (vercel.json: "5 0 * * *") a las 00:05 UTC.
 *
 * Vercel Hobby max: 60s → single attempt with comfortable timeout.
 * Si falla, el on-demand fallback (lib/ai/reto-diario.ts) genera cuando
 * el usuario visita /api/reto-diario.
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

    // ── Verificar idempotencia: ¿ya existe reto de hoy? ────────────────────
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC

    const { data: existing } = await supabase
      .from('reto_diario')
      .select('id, fecha')
      .eq('fecha', today)
      .maybeSingle()

    if (existing) {
      log.info({ fecha: today, id: existing.id }, '[reto-diario-cron] reto ya existe para hoy')
      return NextResponse.json({ ok: true, skipped: true, fecha: today, id: existing.id })
    }

    // ── Elegir artículo aleatorio con texto suficientemente largo ───────────
    const { data: candidatos, error: fetchErr } = await supabase
      .from('legislacion')
      .select('id, ley_nombre, articulo_numero, titulo_capitulo, texto_integro')
      .eq('activo', true)
      .not('texto_integro', 'is', null)
      .limit(80)

    if (fetchErr || !candidatos || candidatos.length === 0) {
      log.error({ err: fetchErr }, '[reto-diario-cron] No hay artículos disponibles')
      return NextResponse.json({ ok: false, reason: 'no_articles' })
    }

    type LegislacionRow = {
      id: string
      ley_nombre: string
      articulo_numero: string
      titulo_capitulo: string | null
      texto_integro: string
    }

    const validos = (candidatos as LegislacionRow[]).filter(
      (a) => a.texto_integro && a.texto_integro.length >= 300
    )

    if (validos.length === 0) {
      log.error('[reto-diario-cron] Sin artículos con texto suficiente')
      return NextResponse.json({ ok: false, reason: 'articles_too_short' })
    }

    const articulo = validos[Math.floor(Math.random() * validos.length)]!
    const NUM_ERRORES = 3

    // ── Generar Caza-Trampas — single attempt, 8s timeout ──────────────────
    // Vercel Hobby kills at 10s. We use AbortController to bail at 8s
    // so we can return a clean JSON response instead of generic 500 HTML.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8_000)

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
        // Verificación determinista
        const fallos = raw.errores_reales.filter(
          (e) => !articulo.texto_integro.includes(e.valor_original)
        )
        const trampaOk = raw.errores_reales.every((e) => raw.texto_trampa.includes(e.valor_trampa))

        if (fallos.length === 0 && trampaOk) {
          textoTrampa = raw.texto_trampa
          erroresVerificados = raw.errores_reales
          succeeded = true
        } else {
          log.warn({ fallos: fallos.length, trampaOk }, '[reto-diario-cron] verificación fallida')
        }
      } else {
        log.warn('[reto-diario-cron] GPT devolvió null')
      }
    } catch (err) {
      if (controller.signal.aborted) {
        log.warn('[reto-diario-cron] Timeout (8s) — on-demand fallback will handle')
        return NextResponse.json({ ok: false, reason: 'timeout', fallback: 'on-demand' })
      }
      log.error({ err }, '[reto-diario-cron] Error en generación')
      return NextResponse.json({ ok: false, reason: 'generation_error' })
    } finally {
      clearTimeout(timer)
    }

    if (!succeeded) {
      log.warn('[reto-diario-cron] No se pudo generar — on-demand fallback will handle')
      return NextResponse.json({ ok: false, reason: 'verification_failed', fallback: 'on-demand' })
    }

    // ── Insertar en BD ──────────────────────────────────────────────────────
    const { data: inserted, error: insertErr } = await supabase
      .from('reto_diario')
      .insert({
        fecha: today,
        ley_nombre: articulo.ley_nombre,
        articulo_numero: articulo.articulo_numero,
        texto_trampa: textoTrampa,
        errores_reales: erroresVerificados,
        num_errores: NUM_ERRORES,
      })
      .select('id')
      .single()

    if (insertErr) {
      // 23505 = UNIQUE violation → race condition, otro worker ya insertó
      if ((insertErr as { code?: string }).code === '23505') {
        log.info('[reto-diario-cron] UNIQUE conflict — otro worker ya generó el reto')
        return NextResponse.json({ ok: true, skipped: true, fecha: today })
      }
      log.error({ err: insertErr }, '[reto-diario-cron] Error insertando reto')
      return NextResponse.json({ ok: false, reason: 'db_insert_error' })
    }

    log.info({ fecha: today, id: inserted.id }, '[reto-diario-cron] Reto diario generado')
    return NextResponse.json({ ok: true, skipped: false, fecha: today, id: inserted.id })
  } catch (err) {
    // Global catch — prevents generic 500 HTML page from Vercel/Next.js
    log.error({ err }, '[reto-diario-cron] Unhandled error')
    return NextResponse.json({ ok: false, reason: 'unhandled_error' })
  }
}
