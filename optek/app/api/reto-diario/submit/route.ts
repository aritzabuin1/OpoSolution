import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { ErrorInyectado } from '@/lib/ai/schemas'

/**
 * POST /api/reto-diario/submit — §2.20.6
 *
 * Registra el resultado del usuario en el reto del día.
 * Evaluación determinista (string comparison, igual que grade-cazatrampas).
 *
 * Input: { reto_id: string, detecciones: [{ valor_trampa_detectado, valor_original_propuesto }] }
 * Output: { puntuacion, aciertos, total, detalles, errores_reales }
 *
 * Regla: 1 submission por usuario por día. HTTP 409 si ya jugó hoy.
 */

const SubmitSchema = z.object({
  reto_id: z.string().uuid('reto_id debe ser un UUID válido'),
  detecciones: z.array(z.object({
    valor_trampa_detectado: z.string().min(1),
    valor_original_propuesto: z.string().min(1),
  })).min(0).max(10),
})

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'reto-diario/submit' })

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  // ── Validar input ─────────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }

  const parsed = SubmitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: `Input inválido: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
    }, { status: 400 })
  }

  const { reto_id, detecciones } = parsed.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svcSupabase = await createServiceClient() as any

  // ── Cargar reto (con errores_reales) ─────────────────────────────────────
  const { data: reto, error: retoErr } = await svcSupabase
    .from('reto_diario')
    .select('id, fecha, num_errores, errores_reales')
    .eq('id', reto_id)
    .maybeSingle()

  if (retoErr || !reto) {
    return NextResponse.json({ error: 'Reto no encontrado.' }, { status: 404 })
  }

  // Verificar que es el reto de hoy (no de días anteriores)
  const today = new Date().toISOString().slice(0, 10)
  if (reto.fecha !== today) {
    return NextResponse.json({ error: 'Este reto ya ha expirado. El reto de hoy está disponible.' }, { status: 410 })
  }

  // ── Verificar idempotencia: ¿ya jugó hoy? ────────────────────────────────
  const { data: existing } = await svcSupabase
    .from('reto_diario_resultados')
    .select('id, puntuacion, trampas_encontradas')
    .eq('reto_diario_id', reto_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Ya has jugado el reto de hoy. Vuelve mañana.' },
      { status: 409 }
    )
  }

  // ── Evaluación determinista ───────────────────────────────────────────────
  const erroresReales = reto.errores_reales as ErrorInyectado[]

  let aciertos = 0
  const detalles = erroresReales.map((error) => {
    // Un error se detecta correctamente si el usuario mencionó su valor_trampa (case-insensitive, trim)
    const deteccion = detecciones.find(
      (d) => d.valor_trampa_detectado.trim().toLowerCase() === error.valor_trampa.trim().toLowerCase()
    )
    const detectado = !!deteccion
    // La corrección es correcta si también acertó el valor_original
    const correccion_correcta = detectado &&
      deteccion!.valor_original_propuesto.trim().toLowerCase() === error.valor_original.trim().toLowerCase()

    if (detectado) aciertos++

    return {
      error,
      detectado,
      correccion_correcta,
      deteccion_usuario: deteccion ?? undefined,
    }
  })

  const puntuacion = erroresReales.length > 0
    ? Math.round((aciertos / erroresReales.length) * 10000) / 100  // 0.00 - 100.00
    : 0

  // ── Guardar resultado ─────────────────────────────────────────────────────
  const { error: insertErr } = await svcSupabase
    .from('reto_diario_resultados')
    .insert({
      reto_diario_id: reto_id,
      user_id: user.id,
      intentos_usados: 1,
      trampas_encontradas: aciertos,
      completado: true,
      puntuacion,
      detecciones: detecciones,
    })

  if (insertErr) {
    // 23505 = UNIQUE violation → race condition (usuario pulsó 2 veces)
    if ((insertErr as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Ya has jugado el reto de hoy.' }, { status: 409 })
    }
    log.error({ err: insertErr, userId: user.id }, '[reto-diario/submit] Error guardando resultado')
    return NextResponse.json({ error: 'Error guardando resultado.' }, { status: 500 })
  }

  log.info({ userId: user.id, puntuacion, aciertos }, '[reto-diario/submit] resultado guardado')

  // ── Contar total jugadores hoy (para stats) ───────────────────────────────
  const { count: totalJugadores } = await svcSupabase
    .from('reto_diario_resultados')
    .select('id', { count: 'exact', head: true })
    .eq('reto_diario_id', reto_id)
    .eq('completado', true)

  return NextResponse.json({
    puntuacion,
    aciertos,
    total: erroresReales.length,
    detalles,
    errores_reales: erroresReales,       // Ahora se revelan
    stats: { total_jugadores: totalJugadores ?? 1 },
  })
}
