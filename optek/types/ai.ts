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
  cita: CitaLegal
}

export interface TestGenerado {
  id: string
  preguntas: Pregunta[]
  temaId: string
  promptVersion: string
  createdAt: string
}

export interface CorreccionDesarrollo {
  puntuacion: number // 0-10
  feedback: string
  citasVerificadas: VerificationResult[]
  mejoras: string[]
  verificationScore: number // 0-1, porcentaje de citas verificadas
}
