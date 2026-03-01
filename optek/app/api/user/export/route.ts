import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/user/export
 *
 * Exporta todos los datos del usuario como JSON descargable.
 * Cumple con el derecho de portabilidad del RGPD (Art. 20 GDPR).
 *
 * Tablas exportadas:
 *   - profiles: perfil y configuración
 *   - tests_generados: tests realizados con preguntas y respuestas
 *   - desarrollos: correcciones de desarrollos con evaluaciones
 *   - compras: historial de pagos
 *   - suscripciones: suscripciones activas/pasadas
 *   - preguntas_reportadas: reportes enviados
 *   - logros: logros/achievements desbloqueados
 *
 * Ref: §1.17.1 PLAN.md | directives/00_DATA_GOVERNANCE.md
 */
export async function GET() {
  const supabase = await createClient()
  const log = logger.child({ route: 'GET /api/user/export' })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  log.info({ userId: user.id }, 'Iniciando exportación de datos de usuario')

  try {
    // Consultas en paralelo — todas filtradas por user_id
    const [
      profileResult,
      testsResult,
      desarrollosResult,
      comprasResult,
      suscripcionesResult,
      reportesResult,
      logrosResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('tests_generados')
        .select('id, tipo, tema_id, preguntas, respuestas_usuario, puntuacion, tiempo_segundos, completado, prompt_version, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('desarrollos')
        .select('id, tema_id, texto_usuario, evaluacion, citas_verificadas, prompt_version, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('compras')
        .select('id, tipo, tema_id, oposicion_id, amount_paid, stripe_checkout_session_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('suscripciones')
        .select('id, estado, fecha_inicio, fecha_fin, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('preguntas_reportadas')
        .select('id, test_id, pregunta_index, motivo, estado, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      // Nota: tabla 'logros' se añade en migración 008, tipos TS pendientes de regenerar
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from('logros')
        .select('id, tipo, desbloqueado_en')
        .eq('user_id', user.id)
        .order('desbloqueado_en', { ascending: true }),
    ])

    const exportData = {
      exportado_el: new Date().toISOString(),
      version_schema: '1.0',
      usuario: {
        id: user.id,
        email: user.email,
        creado_en: user.created_at,
      },
      perfil: profileResult.data ?? null,
      tests_realizados: testsResult.data ?? [],
      correcciones: desarrollosResult.data ?? [],
      compras: comprasResult.data ?? [],
      suscripciones: suscripcionesResult.data ?? [],
      preguntas_reportadas: reportesResult.data ?? [],
      logros: logrosResult.data ?? [],
    }

    log.info(
      {
        userId: user.id,
        tests: (testsResult.data ?? []).length,
        correcciones: (desarrollosResult.data ?? []).length,
        compras: (comprasResult.data ?? []).length,
      },
      'Exportación completada'
    )

    const fileName = `optek-datos-${user.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err) {
    log.error({ err, userId: user.id }, 'Error al exportar datos de usuario')
    return NextResponse.json({ error: 'Error al exportar los datos' }, { status: 500 })
  }
}
