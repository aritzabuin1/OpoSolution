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
  min_aprobado: number | null  // nota mínima para no ser eliminado (null = no hay mínimo)
  penaliza: boolean     // si los errores penalizan
}

export interface ScoringConfig {
  ejercicios: EjercicioConfig[]
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
  const penalizacion = config.penaliza ? errores * config.error : 0
  const puntosDirectos = Math.max(0, aciertos * config.acierto - penalizacion)
  const notaSobreMax = (puntosDirectos / (config.preguntas * config.acierto)) * config.max
  const notaSobre10 = (puntosDirectos / (config.preguntas * config.acierto)) * 10

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
    aprobado: config.min_aprobado !== null
      ? notaSobreMax >= config.min_aprobado
      : null,
  }
}

/**
 * Calculates the full score for a test using the oposición's scoring_config.
 *
 * For single-exercise oposiciones (most common), pass aciertos/errores/enBlanco directly.
 * For multi-exercise, pass arrays.
 */
export function calcularPuntuacion(
  aciertos: number,
  errores: number,
  enBlanco: number,
  config?: ScoringConfig | null
): ScoringResult {
  const sc = config ?? DEFAULT_SCORING_CONFIG

  // Single exercise: use first config
  if (sc.ejercicios.length === 1) {
    const ej = calcularEjercicio(aciertos, errores, enBlanco, sc.ejercicios[0])
    return {
      ejercicios: [ej],
      notaTotal: ej.notaSobreMax,
      maxTotal: sc.ejercicios[0].max,
      notaSobre10: ej.notaSobre10,
      penaliza: sc.ejercicios[0].penaliza,
      aprobado: ej.aprobado !== false, // true if no min or passes min
    }
  }

  // Multi-exercise: for now, calculate first exercise only
  // (multi-exercise scoring requires separate aciertos per exercise)
  const ej = calcularEjercicio(aciertos, errores, enBlanco, sc.ejercicios[0])
  const maxTotal = sc.ejercicios.reduce((sum, e) => sum + e.max, 0)

  return {
    ejercicios: [ej],
    notaTotal: ej.notaSobreMax,
    maxTotal,
    notaSobre10: ej.notaSobre10,
    penaliza: sc.ejercicios.some(e => e.penaliza),
    aprobado: ej.aprobado !== false,
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
 */
export function describePenalizacion(config: ScoringConfig | null): string {
  if (!config) return 'Acierto: +1 · Error: -1/3 · En blanco: 0'

  const ej = config.ejercicios[0]
  if (!ej.penaliza) {
    return 'Sin penalización — responde todas las preguntas'
  }

  const errorStr = ej.error === 0.333 || ej.error === 1 / 3
    ? '1/3'
    : ej.error.toString()

  return `Acierto: +${ej.acierto} · Error: -${errorStr} · En blanco: 0`
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
