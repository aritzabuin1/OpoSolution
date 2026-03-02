import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/reto-diario — §2.20.5
 *
 * Devuelve el reto del día actual + el resultado del usuario si ya jugó.
 * Si no existe reto del día (cron falló) → genera on-demand como fallback.
 *
 * Output:
 *   { reto: { id, fecha, ley_nombre, articulo_numero, texto_trampa, num_errores },
 *     resultado?: { puntuacion, trampas_encontradas, completado, created_at } }
 *
 * NOTA: errores_reales NO se expone aquí (secreto hasta submit).
 */
export async function GET(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'reto-diario' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svcSupabase = await createServiceClient() as any

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  // ── Fetch reto del día ────────────────────────────────────────────────────
  let { data: reto } = await svcSupabase
    .from('reto_diario')
    .select('id, fecha, ley_nombre, articulo_numero, texto_trampa, num_errores')
    .eq('fecha', today)
    .maybeSingle()

  // Fallback: si el cron no corrió (primer día, outage, etc.) → generamos on-demand
  if (!reto) {
    log.info({ fecha: today }, '[reto-diario] no hay reto para hoy, generando on-demand')
    try {
      const { generateRetoDiarioOnDemand } = await import('@/lib/ai/reto-diario')
      reto = await generateRetoDiarioOnDemand(today)
    } catch (err) {
      log.error({ err }, '[reto-diario] error generando on-demand')
      return NextResponse.json({ error: 'El reto de hoy no está disponible aún. Vuelve más tarde.' }, { status: 503 })
    }
  }

  // ── Fetch resultado del usuario si ya jugó ────────────────────────────────
  const { data: resultado } = await svcSupabase
    .from('reto_diario_resultados')
    .select('puntuacion, trampas_encontradas, completado, created_at')
    .eq('reto_diario_id', reto.id)
    .eq('user_id', user.id)
    .maybeSingle()

  // ── Contar cuántos jugaron hoy ────────────────────────────────────────────
  const { count: totalJugadores } = await svcSupabase
    .from('reto_diario_resultados')
    .select('id', { count: 'exact', head: true })
    .eq('reto_diario_id', reto.id)
    .eq('completado', true)

  return NextResponse.json({
    reto: {
      id: reto.id,
      fecha: reto.fecha,
      ley_nombre: reto.ley_nombre,
      articulo_numero: reto.articulo_numero,
      texto_trampa: reto.texto_trampa,
      num_errores: reto.num_errores,
    },
    resultado: resultado ?? null,
    stats: {
      total_jugadores: totalJugadores ?? 0,
    },
  })
}
