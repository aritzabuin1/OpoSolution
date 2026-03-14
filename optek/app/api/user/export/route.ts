import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
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
 *   - api_usage_log: registro de uso de API (observabilidad)
 *   - flashcards: tarjetas de spaced repetition
 *   - notificaciones: alertas BOE y sistema
 *   - cazatrampas_sesiones: ejercicios caza-trampas
 *   - reto_diario_resultados: participaciones en reto diario
 *   - sugerencias: feedback enviado por el usuario
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
    // Service client bypasses RLS — safe because we already verified auth
    // and ALL queries are filtered by user.id
    const service = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = service as any
    const [
      profileResult,
      testsResult,
      desarrollosResult,
      comprasResult,
      suscripcionesResult,
      reportesResult,
      logrosResult,
      apiUsageResult,
      flashcardsResult,
      notificacionesResult,
      cazatrampasResult,
      retoResult,
      sugerenciasResult,
    ] = await Promise.all([
      service.from('profiles').select('*').eq('id', user.id).single(),
      service
        .from('tests_generados')
        .select('id, tipo, tema_id, preguntas, respuestas_usuario, puntuacion, tiempo_segundos, completado, prompt_version, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      service
        .from('desarrollos')
        .select('id, tema_id, texto_usuario, evaluacion, citas_verificadas, prompt_version, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      service
        .from('compras')
        .select('id, tipo, tema_id, oposicion_id, amount_paid, stripe_checkout_session_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      service
        .from('suscripciones')
        .select('id, estado, fecha_inicio, fecha_fin, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      service
        .from('preguntas_reportadas')
        .select('id, test_id, pregunta_index, motivo, estado, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      sb
        .from('logros')
        .select('id, tipo, desbloqueado_en')
        .eq('user_id', user.id)
        .order('desbloqueado_en', { ascending: true }),
      service
        .from('api_usage_log')
        .select('id, endpoint, model, tokens_input, tokens_output, cost_estimated_cents, timestamp')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false }),
      sb
        .from('flashcards')
        .select('id, frente, reverso, cita_legal, intervalo_dias, facilidad, siguiente_repaso, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      sb
        .from('notificaciones')
        .select('id, tipo, titulo, mensaje, leida, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      sb
        .from('cazatrampas_sesiones')
        .select('id, legislacion_id, texto_trampa, errores_reales, errores_detectados, puntuacion, completada_at, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      sb
        .from('reto_diario_resultados')
        .select('id, reto_diario_id, intentos_usados, trampas_encontradas, completado, puntuacion, detecciones, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      sb
        .from('sugerencias')
        .select('id, mensaje, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    // Check for Supabase errors on each query — partial export = GDPR violation risk
    const queryErrors = [
      profileResult.error && 'perfil',
      testsResult.error && 'tests',
      desarrollosResult.error && 'correcciones',
      comprasResult.error && 'compras',
      suscripcionesResult.error && 'suscripciones',
      reportesResult.error && 'reportes',
      logrosResult.error && 'logros',
      apiUsageResult.error && 'api_usage',
      flashcardsResult.error && 'flashcards',
      notificacionesResult.error && 'notificaciones',
      cazatrampasResult.error && 'cazatrampas',
      retoResult.error && 'reto_diario',
      sugerenciasResult.error && 'sugerencias',
    ].filter(Boolean) as string[]

    if (queryErrors.length > 0) {
      log.error(
        {
          userId: user.id,
          failedTables: queryErrors,
          errors: {
            perfil: profileResult.error?.message,
            tests: testsResult.error?.message,
            correcciones: desarrollosResult.error?.message,
            compras: comprasResult.error?.message,
            suscripciones: suscripcionesResult.error?.message,
            reportes: reportesResult.error?.message,
            logros: (logrosResult as { error?: { message: string } }).error?.message,
            api_usage: apiUsageResult.error?.message,
            flashcards: flashcardsResult.error?.message,
            notificaciones: notificacionesResult.error?.message,
            cazatrampas: cazatrampasResult.error?.message,
            reto_diario: retoResult.error?.message,
            sugerencias: sugerenciasResult.error?.message,
          },
        },
        'Export parcial — algunas tablas fallaron'
      )
      return NextResponse.json(
        { error: `Error al exportar datos de: ${queryErrors.join(', ')}. Inténtalo de nuevo.` },
        { status: 500 }
      )
    }

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
      uso_api: apiUsageResult.data ?? [],
      flashcards: flashcardsResult.data ?? [],
      notificaciones: notificacionesResult.data ?? [],
      cazatrampas: cazatrampasResult.data ?? [],
      reto_diario: retoResult.data ?? [],
      sugerencias: sugerenciasResult.data ?? [],
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

    const fileName = `oporuta-datos-${user.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`

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
