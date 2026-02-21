import { NextRequest, NextResponse } from 'next/server'
import { ApiError, ErrorCode, ERROR_MESSAGES } from '@/types/api'
import { randomUUID } from 'crypto'

export function createApiError(
  code: ErrorCode,
  status: number,
  requestId?: string
): ApiError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    status,
    requestId: requestId ?? randomUUID(),
  }
}

type RouteHandler = (req: NextRequest) => Promise<NextResponse>

/**
 * Wrapper que captura errores no manejados en API routes y devuelve
 * una respuesta de error estructurada con requestId para trazabilidad.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest) => {
    const requestId = randomUUID()
    try {
      return await handler(req)
    } catch (err) {
      console.error({ requestId, err }, 'Unhandled API error')
      const error = createApiError('INTERNAL_ERROR', 500, requestId)
      return NextResponse.json({ data: null, error }, { status: 500 })
    }
  }
}
