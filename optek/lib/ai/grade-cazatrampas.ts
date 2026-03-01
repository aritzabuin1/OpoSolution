/**
 * lib/ai/grade-cazatrampas.ts — §2.12.8
 *
 * Evaluación 100% determinista de respuestas Caza-Trampas.
 * NO usa IA en ningún momento — comparación por string exacto.
 *
 * Lógica:
 *   Para cada error real, el usuario debe proporcionar:
 *     { valor_trampa (lo que detectó como error), valor_original (la corrección propuesta) }
 *
 *   Un error se considera CORRECTO si el usuario identificó valor_trampa
 *   (case-insensitive, trim) que existe en errores_reales.
 *
 *   Puntuación: (detectados_correctos / total_errores) * 100
 */

import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { ErrorInyectado } from '@/lib/ai/schemas'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DeteccionUsuario {
  /** El texto que el usuario marcó como error (lo que encontró en texto_trampa) */
  valor_trampa_detectado: string
  /** La corrección que propone el usuario */
  valor_original_propuesto: string
}

export interface ResultadoGrading {
  puntuacion: number                   // 0-100
  aciertos: number
  total: number
  detalles: Array<{
    error: ErrorInyectado
    detectado: boolean
    correccion_correcta: boolean
    deteccion_usuario?: DeteccionUsuario
  }>
}

// ─── Grading ─────────────────────────────────────────────────────────────────

/**
 * Evalúa las respuestas del usuario y actualiza la BD.
 *
 * @param sesionId    UUID de la sesión Caza-Trampas
 * @param userId      ID del usuario (verificación de propiedad)
 * @param detecciones Array de detecciones del usuario
 */
export async function gradeCazaTrampas(
  sesionId: string,
  userId: string,
  detecciones: DeteccionUsuario[]
): Promise<ResultadoGrading> {
  const supabase = await createServiceClient()

  // 1. Cargar sesión con errores_reales
  const { data: sesion, error: fetchErr } = await (supabase as any)
    .from('cazatrampas_sesiones')
    .select('id, user_id, errores_reales, completada_at')
    .eq('id', sesionId)
    .single()

  if (fetchErr || !sesion) {
    throw new Error('Sesión no encontrada')
  }

  if ((sesion as { user_id: string }).user_id !== userId) {
    throw new Error('No autorizado')
  }

  if ((sesion as { completada_at: string | null }).completada_at) {
    throw new Error('Esta sesión ya ha sido completada')
  }

  const erroresReales = (sesion as { errores_reales: ErrorInyectado[] }).errores_reales

  // 2. Evaluación determinista
  const normalize = (s: string) => s.trim().toLowerCase()

  const detalles: ResultadoGrading['detalles'] = erroresReales.map((error) => {
    const normalizedTrampa = normalize(error.valor_trampa)

    // Buscar si el usuario detectó este error específico
    const deteccion = detecciones.find(
      (d) => normalize(d.valor_trampa_detectado) === normalizedTrampa
    )

    const detectado = deteccion !== undefined
    const correccion_correcta = detectado
      ? normalize(deteccion.valor_original_propuesto) === normalize(error.valor_original)
      : false

    return {
      error,
      detectado,
      correccion_correcta,
      deteccion_usuario: deteccion,
    }
  })

  const aciertos = detalles.filter((d) => d.detectado).length
  const puntuacion = Math.round((aciertos / erroresReales.length) * 100 * 100) / 100

  // 3. Guardar resultado en BD
  const { error: updateErr } = await (supabase as any)
    .from('cazatrampas_sesiones')
    .update({
      errores_detectados: detecciones,
      puntuacion,
      completada_at: new Date().toISOString(),
    })
    .eq('id', sesionId)

  if (updateErr) {
    logger.error({ err: updateErr, sesionId }, '[cazatrampas] error guardando resultado')
    throw new Error('Error al guardar el resultado')
  }

  logger.info(
    { sesionId, userId, aciertos, total: erroresReales.length, puntuacion },
    '[cazatrampas] sesión completada'
  )

  return {
    puntuacion,
    aciertos,
    total: erroresReales.length,
    detalles,
  }
}
