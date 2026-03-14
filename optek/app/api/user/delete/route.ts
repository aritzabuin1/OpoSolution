import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

/**
 * DELETE /api/user/delete
 *
 * Elimina la cuenta del usuario y anonimiza los datos fiscales.
 *
 * Flujo:
 *   1. Verificar autenticación.
 *   2. Anonimizar compras (mantiene registro fiscal, borra user_id).
 *   3. Eliminar en cascada: tests, desarrollos, suscripciones, reportes, logros, perfil.
 *   4. Eliminar usuario de auth.users via admin API.
 *
 * Notas RGPD:
 *   - Las compras se anonimizan (no eliminan) para cumplir con la Ley 58/2003 General Tributaria
 *     que obliga a conservar registros fiscales 4 años.
 *   - El resto de datos se borra completamente.
 *   - Ref: §1.17.2 PLAN.md | directives/00_DATA_GOVERNANCE.md
 *
 * Nota: El doble-confirm en UI (escribir "ELIMINAR") es suficiente para GDPR.
 *     Email de confirmacion es mejora futura (no bloqueante para lanzamiento).
 */
export async function DELETE() {
  const supabase = await createClient()
  const log = logger.child({ route: 'DELETE /api/user/delete' })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  log.info({ userId: user.id }, 'Iniciando eliminación de cuenta')

  // service_role necesario para borrar filas de otras tablas y auth.users
  const serviceClient = await createServiceClient()

  try {
    // ── Paso 1: Anonimizar compras (conservar para cumplimiento fiscal) ────────
    // user_id → NULL (anonymized). El stripe_checkout_session_id y amount_paid
    // se mantienen para cumplir la obligación de registro de transacciones.
    // Nota: los tipos TS generados no reflejan que user_id es nullable para anonimización.
    //       Se usa SQL directo via RPC o cast. Pendiente: hacer user_id nullable en migración.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: comprasError } = await (serviceClient.from('compras') as any)
      .update({ user_id: null })
      .eq('user_id', user.id)

    if (comprasError) {
      log.error({ err: comprasError, userId: user.id }, 'Error al anonimizar compras')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 2: Eliminar suscripciones ─────────────────────────────────────────
    const { error: subsError } = await serviceClient
      .from('suscripciones')
      .delete()
      .eq('user_id', user.id)

    if (subsError) {
      log.error({ err: subsError, userId: user.id }, 'Error al eliminar suscripciones')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 3: Eliminar desarrollos ───────────────────────────────────────────
    const { error: desarrollosError } = await serviceClient
      .from('desarrollos')
      .delete()
      .eq('user_id', user.id)

    if (desarrollosError) {
      log.error({ err: desarrollosError, userId: user.id }, 'Error al eliminar desarrollos')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 4: Eliminar preguntas reportadas ──────────────────────────────────
    const { error: reportesError } = await serviceClient
      .from('preguntas_reportadas')
      .delete()
      .eq('user_id', user.id)

    if (reportesError) {
      log.error({ err: reportesError, userId: user.id }, 'Error al eliminar reportes')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 4b: Eliminar registros de uso de API ──────────────────────────────
    const { error: apiLogError } = await serviceClient
      .from('api_usage_log')
      .delete()
      .eq('user_id', user.id)

    if (apiLogError) {
      log.error({ err: apiLogError, userId: user.id }, 'Error al eliminar api_usage_log')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 5: Eliminar tests generados ───────────────────────────────────────
    // (preguntas_reportadas tiene FK a tests_generados — ya eliminadas arriba)
    const { error: testsError } = await serviceClient
      .from('tests_generados')
      .delete()
      .eq('user_id', user.id)

    if (testsError) {
      log.error({ err: testsError, userId: user.id }, 'Error al eliminar tests')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 5b: Eliminar flashcards ────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: flashcardsError } = await (serviceClient as any)
      .from('flashcards')
      .delete()
      .eq('user_id', user.id)

    if (flashcardsError) {
      log.error({ err: flashcardsError, userId: user.id }, 'Error al eliminar flashcards')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 5c: Eliminar cazatrampas_sesiones ───────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: cazatrampasError } = await (serviceClient as any)
      .from('cazatrampas_sesiones')
      .delete()
      .eq('user_id', user.id)

    if (cazatrampasError) {
      log.error({ err: cazatrampasError, userId: user.id }, 'Error al eliminar cazatrampas')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 5d: Eliminar notificaciones ─────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: notificacionesError } = await (serviceClient as any)
      .from('notificaciones')
      .delete()
      .eq('user_id', user.id)

    if (notificacionesError) {
      log.error({ err: notificacionesError, userId: user.id }, 'Error al eliminar notificaciones')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 5e: Eliminar reto_diario_resultados ─────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: retoError } = await (serviceClient as any)
      .from('reto_diario_resultados')
      .delete()
      .eq('user_id', user.id)

    if (retoError) {
      log.error({ err: retoError, userId: user.id }, 'Error al eliminar reto_diario_resultados')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 5f: Eliminar sugerencias ────────────────────────────────────────
    // ON DELETE SET NULL dejaría el mensaje huérfano — eliminar para RGPD Art. 17
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: sugerenciasError } = await (serviceClient as any)
      .from('sugerencias')
      .delete()
      .eq('user_id', user.id)

    if (sugerenciasError) {
      log.error({ err: sugerenciasError, userId: user.id }, 'Error al eliminar sugerencias')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 6: Eliminar logros ────────────────────────────────────────────────
    // Nota: la tabla 'logros' se añade en migración 008. Los tipos TS aún no la incluyen.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: logrosError } = await (serviceClient as any)
      .from('logros')
      .delete()
      .eq('user_id', user.id)

    if (logrosError) {
      log.error({ err: logrosError, userId: user.id }, 'Error al eliminar logros')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 7: Eliminar perfil ────────────────────────────────────────────────
    // (ON DELETE CASCADE en auth.users normalmente lo haría, pero lo hacemos
    //  explícitamente para mayor control y audit trail)
    const { error: profileError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      log.error({ err: profileError, userId: user.id }, 'Error al eliminar perfil')
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
    }

    // ── Paso 8: Eliminar usuario de auth ───────────────────────────────────────
    const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      log.error({ err: authDeleteError, userId: user.id }, 'Error al eliminar usuario de auth')
      // El perfil y datos ya se borraron — intentar recuperar no es práctico.
      // Retornar 500 y Aritz puede borrar manualmente desde Supabase Dashboard.
      return NextResponse.json(
        { error: 'Error al eliminar la cuenta de autenticación. Contacta con soporte.' },
        { status: 500 }
      )
    }

    log.info({ userId: user.id }, 'Cuenta eliminada correctamente')

    return NextResponse.json({ message: 'Cuenta eliminada correctamente' }, { status: 200 })
  } catch (err) {
    log.error({ err, userId: user.id }, 'Error inesperado al eliminar cuenta')
    return NextResponse.json({ error: 'Error al eliminar la cuenta' }, { status: 500 })
  }
}
