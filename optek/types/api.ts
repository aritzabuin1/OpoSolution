/**
 * Error codes estándar de la API OPTEK.
 * USER_ERROR 400 | AUTH_ERROR 401 | RATE_LIMIT 429 | EXTERNAL_SERVICE 503 | INTERNAL 500
 */

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'PAYMENT_REQUIRED'
  | 'AI_TIMEOUT'
  | 'AI_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_INPUT: 'Los datos enviados no son válidos.',
  UNAUTHORIZED: 'No tienes acceso a este recurso.',
  RATE_LIMITED: 'Has superado el límite de peticiones. Espera un momento e inténtalo de nuevo.',
  PAYMENT_REQUIRED: 'Es necesario adquirir este tema para continuar.',
  AI_TIMEOUT: 'La IA tardó demasiado en responder. Inténtalo de nuevo.',
  AI_UNAVAILABLE: 'El servicio de IA no está disponible en este momento.',
  INTERNAL_ERROR: 'Ha ocurrido un error interno. Si el problema persiste, contáctanos.',
}

export interface ApiError {
  code: ErrorCode
  message: string
  status: number
  requestId: string
}

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }
