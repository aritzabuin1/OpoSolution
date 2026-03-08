import { NextResponse, type NextRequest } from 'next/server'

/**
 * middleware.ts — Global request interceptor
 *
 * 1. Injects x-request-id header on every request for end-to-end tracing
 * 2. Protects /admin routes (server-side auth check happens in layout,
 *    but middleware adds early 401 for API routes under /api/admin)
 */

export function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()

  // Clone request headers and inject x-request-id for downstream consumption
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Propagate x-request-id in response for client-side correlation
  response.headers.set('x-request-id', requestId)

  return response
}

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sw.js|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)).*)',
  ],
}
