export interface CitaLegal {
  ley: string
  articulo: string
  apartado?: string
  textoExacto: string
}

export interface VerificationResult {
  cita: CitaLegal
  verificada: boolean
  textoEnBD?: string
  error?: string
}

export interface Pregunta {
  enunciado: string
  opciones: [string, string, string, string]
  correcta: 0 | 1 | 2 | 3
  explicacion: string
  /** Cita legal verificada. Ausente en preguntas psicotécnicas. */
  cita?: CitaLegal
  /** Nivel de dificultad de la pregunta (disponible en tests generados tras v1.8.0) */
  dificultad?: 'facil' | 'media' | 'dificil'
  /**
   * §2.6.3 — UUID del tema al que pertenece esta pregunta.
   * Solo presente en preguntas de simulacros (preguntas_oficiales.tema_id).
   * Null si la pregunta no está mapeada a ningún tema.
   */
  temaId?: string | null
  /**
   * §2.6.3 — Título del tema (desnormalizado para evitar JOIN en resultados).
   * Solo presente en preguntas de simulacros con tema_id válido.
   */
  temaTitulo?: string | null
}

export interface TestGenerado {
  id: string
  preguntas: Pregunta[]
  temaId: string | null
  promptVersion: string
  createdAt: string
  /** Presente cuando el test es un simulacro basado en examen oficial */
  examenId?: string
}

/**
 * Explicación de un error en un simulacro (generada por Claude Haiku en §2.6A.5).
 */
export interface ExplicacionError {
  numero: number
  enunciado: string
  tuRespuesta: number
  correcta: number
  explicacion: string
}

/**
 * Datos de una convocatoria oficial para mostrar en SimulacroCard.
 */
export interface SimulacroOficial {
  id: string
  anio: number
  convocatoria: string   // 'libre' | 'promocion_interna'
  fuente_url: string | null
  numPreguntas: number
}

export interface CorreccionDesarrollo {
  puntuacion: number // 0-10
  feedback: string
  citasVerificadas: VerificationResult[]
  mejoras: string[]
  verificationScore: number // 0-1, porcentaje de citas verificadas
}
