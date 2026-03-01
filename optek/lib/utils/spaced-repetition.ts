/**
 * lib/utils/spaced-repetition.ts — §2.1.3
 *
 * Algoritmo MVP de repaso espaciado con intervalos fijos.
 * SM-2 completo → Post-MVP.
 *
 * Intervalos: 1 → 3 → 7 → 14 → 30 días (secuencia de Fibonacci simplificada)
 * Fallar resetea a 1 día.
 *
 * Calidades de respuesta:
 *   'mal'    → resetea el intervalo a 1 día
 *   'dificil' → mantiene el intervalo actual (no avanza)
 *   'bien'   → avanza al siguiente intervalo
 *   'facil'  → salta 2 intervalos
 */

// Secuencia de intervalos en días (MVP)
export const INTERVALOS_DIAS = [1, 3, 7, 14, 30] as const
export type CalidadRespuesta = 'mal' | 'dificil' | 'bien' | 'facil'

/**
 * Calcula el siguiente intervalo en días basado en la calidad de la respuesta
 * y el intervalo actual.
 *
 * @param intervaloActual - Intervalo actual en días
 * @param calidad         - Calidad de la respuesta del usuario
 * @returns Nuevo intervalo en días
 */
export function getNextInterval(
  intervaloActual: number,
  calidad: CalidadRespuesta
): number {
  if (calidad === 'mal') return INTERVALOS_DIAS[0] // reset a 1 día

  const currentIdx = INTERVALOS_DIAS.findIndex((d) => d >= intervaloActual)
  const idx = currentIdx === -1 ? INTERVALOS_DIAS.length - 1 : currentIdx

  if (calidad === 'dificil') {
    // Mantiene el intervalo actual
    return INTERVALOS_DIAS[idx] ?? INTERVALOS_DIAS[INTERVALOS_DIAS.length - 1]
  }
  if (calidad === 'bien') {
    // Avanza 1 posición
    return INTERVALOS_DIAS[Math.min(idx + 1, INTERVALOS_DIAS.length - 1)] ?? INTERVALOS_DIAS[INTERVALOS_DIAS.length - 1]
  }
  // 'facil' → avanza 2 posiciones
  return INTERVALOS_DIAS[Math.min(idx + 2, INTERVALOS_DIAS.length - 1)] ?? INTERVALOS_DIAS[INTERVALOS_DIAS.length - 1]
}

/**
 * Calcula la próxima fecha de repaso.
 *
 * @param intervaloNuevo - Nuevo intervalo en días (resultado de getNextInterval)
 * @param desde          - Fecha base (por defecto, hoy)
 * @returns Fecha ISO (YYYY-MM-DD) del próximo repaso
 */
export function getNextReviewDate(
  intervaloNuevo: number,
  desde: Date = new Date()
): string {
  const d = new Date(desde)
  d.setDate(d.getDate() + intervaloNuevo)
  return d.toISOString().split('T')[0]!
}
