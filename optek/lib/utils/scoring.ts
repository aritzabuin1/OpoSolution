/**
 * lib/utils/scoring.ts — §0.3 Motor de scoring configurable
 *
 * Calcula puntuaciones usando la scoring_config de cada oposición.
 * Soporta múltiples ejercicios (Justicia: test + práctico + ofimática)
 * y penalización configurable (Correos: sin penalización).
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface EjercicioConfig {
  nombre: string
  preguntas: number
  minutos: number
  acierto: number       // puntos por acierto (e.g. 1.0, 0.60)
  error: number         // puntos restados por error (e.g. 0.333, 0)
  max: number           // puntuación máxima del ejercicio
  min_aprobado: number | Record<string, number> | null  // nota mínima (object for multi-category: {reparto: 33, atc: 36})
  penaliza: boolean     // si los errores penalizan
  apto_no_apto?: boolean  // eliminatory pass/fail (e.g. GC ortografia/gramatica)
}

/** Per-exercise input data for multi-exercise scoring */
export interface EjercicioData {
  aciertos: number
  errores: number
  enBlanco: number
}

export interface ScoringConfig {
  num_opciones?: 3 | 4
  ejercicios: EjercicioConfig[]
}

/** Returns the number of answer options for this oposición (3 for PN, 4 for all others). */
export function getNumOpciones(scoringConfig?: ScoringConfig | null): 3 | 4 {
  return scoringConfig?.num_opciones ?? 4
}

export interface EjercicioResult {
  nombre: string
  aciertos: number
  errores: number
  enBlanco: number
  totalPreguntas: number
  puntosDirectos: number   // raw score after penalties
  notaSobre10: number      // normalized 0-10
  notaSobreMax: number     // score out of exercise max
  penaliza: boolean
  aprobado: boolean | null // null if no min_aprobado
}

export interface ScoringResult {
  ejercicios: EjercicioResult[]
  notaTotal: number        // sum of all ejercicio scores
  maxTotal: number         // sum of all max scores
  notaSobre10: number      // normalized 0-10
  penaliza: boolean        // true if ANY ejercicio penalizes
  aprobado: boolean        // true if ALL ejercicios pass their min_aprobado
}

// ─── Default config (AGE C2 — backward compatible) ─────────────────────────────

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  ejercicios: [{
    nombre: 'Test teórico',
    preguntas: 100,
    minutos: 70,
    acierto: 1.0,
    error: 0.333,
    max: 100,
    min_aprobado: null,
    penaliza: true,
  }],
}

// ─── Core calculation ──────────────────────────────────────────────────────────

/**
 * Calculates score for a single exercise.
 */
export function calcularEjercicio(
  aciertos: number,
  errores: number,
  enBlanco: number,
  config: EjercicioConfig
): EjercicioResult {
  const totalPreguntas = aciertos + errores + enBlanco

  // apto_no_apto exercises (e.g. GC ortografia/gramatica): pass/fail only, no numeric score
  // Guard against division by zero when acierto=0 or preguntas=0
  const maxPuntos = config.preguntas * config.acierto
  const penalizacion = config.penaliza ? errores * config.error : 0
  const puntosDirectos = Math.max(0, aciertos * config.acierto - penalizacion)
  const notaSobreMax = maxPuntos > 0 ? (puntosDirectos / maxPuntos) * config.max : 0
  const notaSobre10 = maxPuntos > 0 ? (puntosDirectos / maxPuntos) * 10 : 0

  // Resolve min_aprobado: if object (e.g. {reparto: 33, atc: 36}), use the HIGHEST threshold
  const minAprobadoNumeric = resolveMinAprobado(config.min_aprobado)

  return {
    nombre: config.nombre,
    aciertos,
    errores,
    enBlanco,
    totalPreguntas,
    puntosDirectos: Math.round(puntosDirectos * 100) / 100,
    notaSobre10: Math.round(notaSobre10 * 100) / 100,
    notaSobreMax: Math.round(notaSobreMax * 100) / 100,
    penaliza: config.penaliza,
    aprobado: config.apto_no_apto
      ? (minAprobadoNumeric !== null ? notaSobreMax >= minAprobadoNumeric : puntosDirectos > 0)
      : (minAprobadoNumeric !== null ? notaSobreMax >= minAprobadoNumeric : null),
  }
}

/**
 * Calculates the full score for a test using the oposición's scoring_config.
 *
 * Overload 1 (single exercise): pass scalar aciertos/errores/enBlanco.
 * Overload 2 (multi-exercise): pass EjercicioData[] with one entry per exercise.
 *
 * When called with scalars on a multi-exercise config, only the first exercise
 * is scored (backward compatible). Use the array form for full multi-exercise scoring.
 */
export function calcularPuntuacion(
  aciertos: number,
  errores: number,
  enBlanco: number,
  config?: ScoringConfig | null
): ScoringResult
export function calcularPuntuacion(
  ejerciciosData: EjercicioData[],
  config?: ScoringConfig | null
): ScoringResult
export function calcularPuntuacion(
  aciertosOrData: number | EjercicioData[],
  erroresOrConfig?: number | ScoringConfig | null,
  enBlancoArg?: number,
  configArg?: ScoringConfig | null
): ScoringResult {
  // Detect which overload was called
  if (Array.isArray(aciertosOrData)) {
    // Overload 2: multi-exercise with EjercicioData[]
    const ejerciciosData = aciertosOrData
    const sc = (erroresOrConfig as ScoringConfig | null | undefined) ?? DEFAULT_SCORING_CONFIG
    return _calcularMulti(ejerciciosData, sc)
  }

  // Overload 1: scalar (single exercise or first-exercise-only)
  const aciertos = aciertosOrData
  const errores = erroresOrConfig as number
  const enBlanco = enBlancoArg!
  const sc = configArg ?? DEFAULT_SCORING_CONFIG

  // Single exercise: straightforward
  if (sc.ejercicios.length === 1) {
    return _calcularMulti([{ aciertos, errores, enBlanco }], sc)
  }

  // Multi-exercise config but scalar input: score only first exercise
  // (backward compatible — caller doesn't have per-exercise data)
  const ej = calcularEjercicio(aciertos, errores, enBlanco, sc.ejercicios[0])
  const maxTotal = sc.ejercicios.reduce((sum, e) => sum + e.max, 0)

  return {
    ejercicios: [ej],
    notaTotal: ej.notaSobreMax,
    maxTotal,
    notaSobre10: (ej.notaSobreMax / maxTotal) * 10,
    penaliza: sc.ejercicios.some(e => e.penaliza),
    aprobado: ej.aprobado !== false,
  }
}

/** Internal: scores all exercises from EjercicioData[] */
function _calcularMulti(
  ejerciciosData: EjercicioData[],
  config: ScoringConfig
): ScoringResult {
  const results = config.ejercicios.map((ejConfig, i) => {
    const data = ejerciciosData[i] ?? { aciertos: 0, errores: 0, enBlanco: ejConfig.preguntas }
    return calcularEjercicio(data.aciertos, data.errores, data.enBlanco, ejConfig)
  })

  const maxTotal = config.ejercicios.reduce((sum, e) => sum + e.max, 0)
  const notaTotal = results.reduce((sum, r) => sum + r.notaSobreMax, 0)

  return {
    ejercicios: results,
    notaTotal: Math.round(notaTotal * 100) / 100,
    maxTotal,
    notaSobre10: maxTotal > 0 ? Math.round((notaTotal / maxTotal) * 10 * 100) / 100 : 0,
    penaliza: config.ejercicios.some(e => e.penaliza),
    aprobado: results.every(r => r.aprobado !== false),
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse scoring_config from DB (JSONB → typed).
 */
export function parseScoringConfig(raw: unknown): ScoringConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (!Array.isArray(obj.ejercicios) || obj.ejercicios.length === 0) return null
  return obj as unknown as ScoringConfig
}

/**
 * Human-readable penalty description for the UI.
 * For multi-exercise configs, describes each exercise separately.
 * Optional `ejercicioIndex` returns only that exercise's description.
 */
export function describePenalizacion(
  config: ScoringConfig | null,
  ejercicioIndex?: number
): string {
  if (!config) return 'Acierto: +1 · Error: -1/3 · En blanco: 0'

  const ejercicios = ejercicioIndex !== undefined
    ? [config.ejercicios[ejercicioIndex]].filter(Boolean)
    : config.ejercicios

  if (ejercicios.length === 0) return ''

  const descriptions = ejercicios.map(ej => {
    if (!ej.penaliza) {
      return config.ejercicios.length > 1
        ? `${ej.nombre}: Sin penalización`
        : 'Sin penalización — responde todas las preguntas'
    }

    const ratio = ej.acierto > 0 ? ej.error / ej.acierto : 0
    let errorStr: string
    if (Math.abs(ratio - 1 / 3) < 0.01) errorStr = '1/3'
    else if (Math.abs(ratio - 1 / 4) < 0.01) errorStr = '1/4'
    else if (Math.abs(ratio - 1 / 5) < 0.01) errorStr = '1/5'
    else errorStr = ej.error.toString()

    const prefix = config.ejercicios.length > 1 ? `${ej.nombre}: ` : ''
    return `${prefix}Acierto: +${ej.acierto} · Error: -${errorStr} del acierto · En blanco: 0`
  })

  return descriptions.join(' | ')
}

/**
 * Resolves min_aprobado to a numeric value.
 * If object (e.g. {reparto: 33, atc: 36}), returns the HIGHEST threshold.
 * If number, returns as-is. If null/undefined, returns null.
 */
export function resolveMinAprobado(min: number | Record<string, number> | null | undefined): number | null {
  if (min == null) return null
  if (typeof min === 'number') return min
  if (typeof min === 'object') {
    const values = Object.values(min).filter(v => typeof v === 'number')
    return values.length > 0 ? Math.max(...values) : null
  }
  return null
}

/**
 * Formats min_aprobado for display.
 * If object: "33 (reparto) / 36 (atc)"
 * If number: "33"
 */
export function formatMinAprobado(min: number | Record<string, number> | null | undefined): string {
  if (min == null) return ''
  if (typeof min === 'number') return String(min)
  if (typeof min === 'object') {
    return Object.entries(min)
      .filter(([, v]) => typeof v === 'number')
      .map(([k, v]) => `${v} (${k})`)
      .join(' / ')
  }
  return ''
}

/**
 * Returns timer duration in minutes based on scoring_config.
 * Falls back to proportional calculation if no config.
 */
export function getDuracionMinutos(
  totalPreguntas: number,
  config?: ScoringConfig | null
): number {
  if (config?.ejercicios[0]) {
    const ej = config.ejercicios[0]
    // Proportional: if exercise is 100q/70min but test has 20q → 14min
    return Math.round((totalPreguntas / ej.preguntas) * ej.minutos)
  }
  // Legacy fallback: 110q = 90min ratio
  return Math.max(5, Math.round((totalPreguntas / 110) * 90))
}
