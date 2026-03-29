import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// Vercel Hobby max: 60s. On-demand reto generation uses AI (fallback when cron misses).
export const maxDuration = 60

/**
 * GET /api/reto-diario — §2.20.5
 *
 * Devuelve el reto del día actual para la rama del usuario + su resultado si ya jugó.
 * Si no existe reto del día para esa rama (cron falló) → genera on-demand como fallback.
 *
 * Output:
 *   { reto: { id, fecha, rama, ley_nombre, articulo_numero, texto_trampa, num_errores },
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

  // ── Get user's oposicion rama ─────────────────────────────────────────────
  const { data: profile, error: profileErr } = await svcSupabase
    .from('profiles')
    .select('oposicion_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileErr || !profile?.oposicion_id) {
    log.warn({ userId: user.id, err: profileErr }, '[reto-diario] No se encontró oposicion del usuario')
    return NextResponse.json({ error: 'No tienes una oposición seleccionada.' }, { status: 400 })
  }

  const { data: oposicion, error: opoErr } = await svcSupabase
    .from('oposiciones')
    .select('rama')
    .eq('id', profile.oposicion_id)
    .maybeSingle()

  if (opoErr || !oposicion?.rama) {
    log.warn({ oposicionId: profile.oposicion_id, err: opoErr }, '[reto-diario] No se encontró rama')
    return NextResponse.json({ error: 'No se pudo determinar tu rama de oposición.' }, { status: 400 })
  }

  const userRama = oposicion.rama as string

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  // ── Fetch reto del día for user's rama ────────────────────────────────────
  let { data: reto } = await svcSupabase
    .from('reto_diario')
    .select('id, fecha, rama, ley_nombre, articulo_numero, texto_trampa, num_errores')
    .eq('fecha', today)
    .eq('rama', userRama)
    .maybeSingle()

  // Fallback: si el cron no corrió para esta rama → generamos on-demand
  if (!reto) {
    log.info({ fecha: today, rama: userRama }, '[reto-diario] no hay reto para hoy+rama, generando on-demand')
    try {
      const { generateRetoDiarioOnDemand } = await import('@/lib/ai/reto-diario')
      reto = await generateRetoDiarioOnDemand(today, userRama)
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
      rama: reto.rama,
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
