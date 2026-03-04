/**
 * lib/utils/simulacro-ranking.ts — §2.25.2
 *
 * Calcula si el usuario habría aprobado un simulacro oficial comparando
 * su nota con la puntuación de corte histórica de la convocatoria.
 *
 * Fuente de cortes: resoluciones INAP oficiales (datos públicos).
 */

export interface SimulacroRankingResult {
  habriaProbado: boolean
  tuNota: number      // nota normalizada sobre 10
  corteOficial: number
  diferencia: number  // tuNota - corteOficial (positivo = apruebas)
  anio: string
  plazas: number
  aspirantes: number
}

// Puntuaciones de corte históricas (resoluciones INAP)
const CORTES_OFICIALES: Record<string, { nota: number; plazas: number; aspirantes: number }> = {
  '2024': { nota: 6.50, plazas: 1800, aspirantes: 142000 },
  '2022': { nota: 6.00, plazas: 2200, aspirantes: 125000 },
  '2019': { nota: 5.75, plazas: 3000, aspirantes: 98000 },
}

/**
 * Calcula la nota del simulacro y la compara con el corte oficial del año.
 *
 * @param aciertos - Número de respuestas correctas
 * @param errores  - Número de respuestas incorrectas (penalización -1/3)
 * @param totalPreguntas - Total de preguntas del simulacro
 * @param anio - Año de la convocatoria (number | null)
 * @returns resultado del ranking, o null si no hay datos para ese año
 */
export function calcularNotaSimulacro(
  aciertos: number,
  errores: number,
  totalPreguntas: number,
  anio: number | null
): SimulacroRankingResult | null {
  if (!anio) return null
  const corte = CORTES_OFICIALES[String(anio)]
  if (!corte) return null

  const notaRaw = aciertos - errores / 3               // puntos directos (sobre totalPreguntas)
  const notaSobre10 = (notaRaw / totalPreguntas) * 10   // normalizada sobre 10
  const notaRedondeada = Math.round(notaSobre10 * 100) / 100

  return {
    habriaProbado: notaRedondeada >= corte.nota,
    tuNota: notaRedondeada,
    corteOficial: corte.nota,
    diferencia: Math.round((notaRedondeada - corte.nota) * 100) / 100,
    anio: String(anio),
    plazas: corte.plazas,
    aspirantes: corte.aspirantes,
  }
}
