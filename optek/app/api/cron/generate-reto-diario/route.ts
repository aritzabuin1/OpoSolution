import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { callAIJSON } from '@/lib/ai/provider'
import { SYSTEM_CAZATRAMPAS, buildCazaTrampasPrompt } from '@/lib/ai/prompts'
import { CazaTrampasRawSchema } from '@/lib/ai/schemas'
import { logger } from '@/lib/logger'
import { verifyCronSecret } from '@/lib/auth/cron-auth'
import { sendPushToAll } from '@/lib/push/send'

// Vercel Hobby max: 60s. AI generation needs 15-40s per rama.
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

/**
 * GET /api/cron/generate-reto-diario — §2.20.3
 *
 * Genera UN Reto Diario de Caza-Trampas POR RAMA activa para hoy.
 * Idempotente: si ya existe un reto para hoy + rama → skip esa rama.
 * Invocado por Vercel Cron (vercel.json: "5 0 * * *") a las 00:05 UTC.
 *
 * Vercel Hobby max: 60s → generates sequentially per rama.
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

    // ── Get active ramas ───────────────────────────────────────────────────
    const { data: ramaRows, error: ramaErr } = await supabase
      .from('oposiciones')
      .select('rama')
      .eq('activa', true)

    if (ramaErr || !ramaRows || ramaRows.length === 0) {
      log.error({ err: ramaErr }, '[reto-diario-cron] No hay oposiciones activas')
      return NextResponse.json({ ok: false, reason: 'no_active_oposiciones' })
    }

    const activeRamas = [...new Set((ramaRows as { rama: string }[]).map(r => r.rama))] as string[]
    log.info({ ramas: activeRamas }, '[reto-diario-cron] Ramas activas')

    const results: Record<string, { ok: boolean; skipped?: boolean; id?: string; reason?: string }> = {}

    // ── Generate one reto per rama (sequential to stay within 60s) ──────────
    for (const rama of activeRamas) {
      const ramaLog = log.child({ rama })

      // Check if reto already exists for today + this rama
      const { data: existing } = await supabase
        .from('reto_diario')
        .select('id, fecha')
        .eq('fecha', today)
        .eq('rama', rama)
        .maybeSingle()

      if (existing) {
        ramaLog.info({ id: existing.id }, '[reto-diario-cron] reto ya existe para hoy')
        results[rama] = { ok: true, skipped: true, id: existing.id }
        continue
      }

      // Get laws for this rama
      const leyes = RAMAS_CONFIG[rama]
      if (!leyes || leyes.length === 0) {
        ramaLog.warn('[reto-diario-cron] No hay leyes configuradas para esta rama')
        results[rama] = { ok: false, reason: 'no_laws_configured' }
        continue
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
        results[rama] = { ok: false, reason: 'no_articles' }
        continue
      }

      const validos = (candidatos as LegislacionRow[]).filter(
        (a) => a.texto_integro && a.texto_integro.length >= 300
      )

      if (validos.length === 0) {
        ramaLog.error('[reto-diario-cron] Sin artículos con texto suficiente')
        results[rama] = { ok: false, reason: 'articles_too_short' }
        continue
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
        results[rama] = { ok: false, reason: 'generation_error' }
        continue
      }

      if (!succeeded) {
        ramaLog.warn('[reto-diario-cron] No se pudo generar — on-demand fallback will handle')
        results[rama] = { ok: false, reason: 'verification_failed' }
        continue
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
          results[rama] = { ok: true, skipped: true }
          continue
        }
        ramaLog.error({ err: insertErr }, '[reto-diario-cron] Error insertando reto')
        results[rama] = { ok: false, reason: 'db_insert_error' }
        continue
      }

      ramaLog.info({ id: inserted.id }, '[reto-diario-cron] Reto diario generado')
      results[rama] = { ok: true, skipped: false, id: inserted.id }

      // Send push notification (fire-and-forget)
      void sendPushToAll({
        title: 'Reto Diario disponible',
        body: `${articulo.ley_nombre}, art. ${articulo.articulo_numero} — ¿Encuentras los ${NUM_ERRORES} errores?`,
        url: '/reto-diario',
        tag: `reto-diario-${rama}`,
      }).catch(err => ramaLog.warn({ err }, '[reto-diario-cron] push notification failed'))
    }

    log.info({ fecha: today, results }, '[reto-diario-cron] Retos generados')
    return NextResponse.json({ ok: true, fecha: today, results })
  } catch (err) {
    // Global catch — prevents generic 500 HTML page from Vercel/Next.js
    log.error({ err }, '[reto-diario-cron] Unhandled error')
    return NextResponse.json({ ok: false, reason: 'unhandled_error' })
  }
}
