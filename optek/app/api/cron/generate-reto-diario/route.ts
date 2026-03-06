import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { callGPTJSON } from '@/lib/ai/openai'
import { SYSTEM_CAZATRAMPAS, buildCazaTrampasPrompt } from '@/lib/ai/prompts'
import { CazaTrampasRawSchema } from '@/lib/ai/schemas'
import { logger } from '@/lib/logger'
import { withTimeout, TimeoutError } from '@/lib/utils/timeout'

/**
 * GET /api/cron/generate-reto-diario — §2.20.3
 *
 * Genera el Reto Diario de Caza-Trampas para hoy.
 * Idempotente: si ya existe un reto para hoy → return 200 sin acción.
 * Invocado por Vercel Cron (vercel.json: "5 0 * * *") a las 00:05 UTC.
 *
 * Autenticación: Bearer ${CRON_SECRET}.
 */
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'cron/generate-reto-diario' })

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    log.warn('[reto-diario-cron] Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServiceClient() as any

  // ── Verificar idempotencia: ¿ya existe reto de hoy? ──────────────────────
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

  // ── Elegir artículo aleatorio con texto suficientemente largo ─────────────
  const { data: candidatos, error: fetchErr } = await supabase
    .from('legislacion')
    .select('id, ley_nombre, articulo_numero, titulo_capitulo, texto_integro')
    .eq('activo', true)
    .not('texto_integro', 'is', null)
    .limit(80)

  if (fetchErr || !candidatos || candidatos.length === 0) {
    log.error({ err: fetchErr }, '[reto-diario-cron] No hay artículos disponibles')
    return NextResponse.json({ error: 'No hay artículos disponibles' }, { status: 500 })
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
    return NextResponse.json({ error: 'Artículos demasiado cortos' }, { status: 500 })
  }

  const articulo = validos[Math.floor(Math.random() * validos.length)]!
  const NUM_ERRORES = 3

  // ── Generar Caza-Trampas con reintentos (timeout global 45s) ──────────────
  let textoTrampa = ''
  let erroresVerificados: ReturnType<typeof CazaTrampasRawSchema.parse>['errores_reales'] = []
  let succeeded = false

  try {
    await withTimeout(
      (async () => {
        for (let attempt = 0; attempt <= 2 && !succeeded; attempt++) {
          const prompt = buildCazaTrampasPrompt({
            textoOriginal: articulo.texto_integro,
            leyNombre: articulo.ley_nombre,
            articuloNumero: articulo.articulo_numero,
            numErrores: NUM_ERRORES,
          })

          const raw = await callGPTJSON(SYSTEM_CAZATRAMPAS, prompt, CazaTrampasRawSchema)
          if (!raw) {
            log.warn({ attempt }, '[reto-diario-cron] GPT devolvió null')
            continue
          }

          // Verificación determinista: valor_original debe existir en texto_original
          const fallos = raw.errores_reales.filter(
            (e) => !articulo.texto_integro.includes(e.valor_original)
          )
          if (fallos.length > 0) {
            log.warn({ attempt, fallos: fallos.length }, '[reto-diario-cron] verificación fallida — reintentando')
            continue
          }

          // Verificar que texto_trampa contiene los valor_trampa
          const trampaOk = raw.errores_reales.every((e) => raw.texto_trampa.includes(e.valor_trampa))
          if (!trampaOk) {
            log.warn({ attempt }, '[reto-diario-cron] texto_trampa inválido — reintentando')
            continue
          }

          textoTrampa = raw.texto_trampa
          erroresVerificados = raw.errores_reales
          succeeded = true
        }
      })(),
      45_000,
    )
  } catch (err) {
    if (err instanceof TimeoutError) {
      log.error('[reto-diario-cron] Timeout generando reto (45s)')
      return NextResponse.json({ error: 'Timeout generando el reto' }, { status: 504 })
    }
    throw err
  }

  if (!succeeded) {
    log.error('[reto-diario-cron] No se pudo generar tras 3 intentos')
    return NextResponse.json({ error: 'Error generando el reto' }, { status: 500 })
  }

  // ── Insertar en BD ────────────────────────────────────────────────────────
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
    return NextResponse.json({ error: 'Error guardando el reto' }, { status: 500 })
  }

  log.info({ fecha: today, id: inserted.id }, '[reto-diario-cron] Reto diario generado ✓')
  return NextResponse.json({ ok: true, skipped: false, fecha: today, id: inserted.id })
}
