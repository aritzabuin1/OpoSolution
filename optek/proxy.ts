import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Proxy (middleware) de Next.js 16 — OPTEK
 *
 * Responsabilidades:
 * 1. Refresh automático de sesión Supabase (access token 1h, refresh 7d)
 * 2. Protección de rutas /(dashboard)/* → redirige a /login si no autenticado
 * 3. Security headers (CSP, X-Frame-Options, etc.)
 * 4. x-request-id por request para trazabilidad
 *
 * DDIA Reliability: el refresh de token es idempotente — si falla, el usuario
 * verá un error de auth al hacer la siguiente acción, no un crash silencioso.
 *
 * Nota: Usa Web Crypto API (globalThis.crypto) — compatible con Edge Runtime.
 */
export async function proxy(request: NextRequest) {
  const requestId = globalThis.crypto.randomUUID()

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // ── 1. Supabase session refresh ───────────────────────────────────────────
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresca el token — DEBE llamarse antes de cualquier verificación de auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 2. Protección de rutas dashboard ─────────────────────────────────────
  const { pathname } = request.nextUrl

  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/tests') ||
    pathname.startsWith('/corrector') ||
    pathname.startsWith('/simulacros') ||
    pathname.startsWith('/cuenta')

  if (isDashboardRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirigir usuarios autenticados que intenten ir a /login o /register
  if ((pathname === '/login' || pathname === '/register') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── 3. Cabeceras de trazabilidad y seguridad ──────────────────────────────
  response.headers.set('x-request-id', requestId)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|api/).*)',
  ],
}
