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

// Puntuaciones de corte históricas por oposición (resoluciones INAP / MJU)
const CORTES_POR_OPOSICION: Record<string, Record<string, { nota: number; plazas: number; aspirantes: number }>> = {
  // C2 Auxiliar Administrativo
  'aux-admin-estado': {
    '2024': { nota: 6.50, plazas: 1800, aspirantes: 142000 },
    '2022': { nota: 6.00, plazas: 2200, aspirantes: 125000 },
    '2019': { nota: 5.75, plazas: 3000, aspirantes: 98000 },
  },
  // C1 Administrativo del Estado
  'administrativo-estado': {
    '2024': { nota: 4.73, plazas: 2512, aspirantes: 30000 },
    '2022': { nota: 4.50, plazas: 1500, aspirantes: 25000 },
    '2019': { nota: 4.20, plazas: 1200, aspirantes: 20000 },
  },
  // A2 Gestión Civil del Estado (próximamente)
  'gestion-estado': {
    '2024': { nota: 4.90, plazas: 2549, aspirantes: 17891 },
    '2023': { nota: 4.95, plazas: 1600, aspirantes: 12000 },
  },
}

// Backward-compatible default: C2
const CORTES_OFICIALES = CORTES_POR_OPOSICION['aux-admin-estado']

/**
 * Calcula la nota del simulacro y la compara con el corte oficial del año.
 *
 * @param aciertos - Número de respuestas correctas
 * @param errores  - Número de respuestas incorrectas (penalización -1/3)
 * @param totalPreguntas - Total de preguntas del simulacro
 * @param anio - Año de la convocatoria (number | null)
 * @param oposicionSlug - Slug de la oposición (optional, defaults to C2)
 * @param scoringConfig - Scoring config from DB (optional, uses default -1/3 if absent)
 * @returns resultado del ranking, o null si no hay datos para ese año
 */
export function calcularNotaSimulacro(
  aciertos: number,
  errores: number,
  totalPreguntas: number,
  anio: number | null,
  oposicionSlug?: string,
  scoringConfig?: { ejercicios: Array<{ penaliza: boolean; error: number; acierto: number }> } | null
): SimulacroRankingResult | null {
  if (!anio) return null
  const cortes = oposicionSlug ? (CORTES_POR_OPOSICION[oposicionSlug] ?? CORTES_OFICIALES) : CORTES_OFICIALES
  const corte = cortes[String(anio)]
  if (!corte) return null

  // Use scoring_config if available, otherwise default to AGE penalty (-1/3)
  const ej = scoringConfig?.ejercicios?.[0]
  const penaliza = ej?.penaliza ?? true
  const errorFactor = ej?.error ?? (1 / 3)
  const aciertoPts = ej?.acierto ?? 1

  const notaRaw = penaliza
    ? (aciertos * aciertoPts) - (errores * errorFactor)
    : aciertos * aciertoPts
  const maxPuntos = totalPreguntas * aciertoPts
  const notaSobre10 = (Math.max(0, notaRaw) / maxPuntos) * 10
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
