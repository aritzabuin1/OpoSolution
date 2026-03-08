import { NextRequest, NextResponse } from 'next/server'
import { ApiError, ErrorCode, ERROR_MESSAGES } from '@/types/api'
import { logger } from '@/lib/logger'

export function createApiError(
  code: ErrorCode,
  status: number,
  requestId?: string
): ApiError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    status,
    requestId: requestId ?? crypto.randomUUID(),
  }
}

/**
 * Standard JSON error response with consistent shape.
 * Use this in all API routes for uniform error responses.
 */
export function errorResponse(
  message: string,
  status: number,
  opts?: { code?: string; requestId?: string }
) {
  return NextResponse.json(
    {
      error: message,
      ...(opts?.code ? { code: opts.code } : {}),
      ...(opts?.requestId ? { requestId: opts.requestId } : {}),
    },
    { status }
  )
}

type RouteContext = { params?: Promise<Record<string, string>> }

/**
 * Wrapper that catches unhandled errors in API routes and returns
 * a structured error response with requestId for traceability.
 *
 * Usage (no params):
 *   export const POST = withErrorHandling(async (req) => { ... })
 *
 * Usage (with route params):
 *   export const GET = withErrorHandling(async (req, ctx) => {
 *     const { id } = await ctx.params
 *     ...
 *   })
 */
export function withErrorHandling(
  handler: (req: NextRequest, ctx: RouteContext) => Promise<NextResponse | Response>
) {
  return async (req: NextRequest, ctx: RouteContext) => {
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID()
    try {
      return await handler(req, ctx)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      const endpoint = new URL(req.url).pathname

      logger.error({ requestId, err, endpoint, method: req.method }, 'Unhandled API error')

      // Don't expose internal error details to client
      const error = createApiError('INTERNAL_ERROR', 500, requestId)
      return NextResponse.json({ data: null, error }, { status: 500 })
    }
  }
}
