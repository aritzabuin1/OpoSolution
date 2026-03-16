import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { sendWelcomeEmail, sendNewUserNotification } from '@/lib/email/client'
import { logger } from '@/lib/logger'

/**
 * GET /auth/callback
 *
 * Maneja el redirect de Supabase tras:
 * - Verificación de email en registro (PKCE code flow)
 * - Magic link de login
 * - OAuth (si se habilita en el futuro)
 *
 * Intercambia el `code` por una sesión y redirige al dashboard.
 *
 * CRITICAL PATH: si esto falla, perdemos el usuario. Logueamos todo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Validar `next` para prevenir open redirect — solo rutas relativas internas
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  if (!code) {
    logger.warn('[auth/callback] no code parameter')
    return NextResponse.redirect(new URL('/error?reason=callback', origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error, data } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    logger.error(
      { error: error.message, code: error.status },
      '[auth/callback] exchangeCodeForSession failed'
    )

    // Fallback: si hay sesión activa a pesar del error, redirigir igualmente
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    if (sessionUser) {
      logger.info(
        { userId: sessionUser.id },
        '[auth/callback] exchange failed but session exists — redirecting'
      )
      await handleNewUser(sessionUser)
      return NextResponse.redirect(new URL(next, origin))
    }

    return NextResponse.redirect(new URL('/error?reason=callback', origin))
  }

  if (data.user) {
    await handleNewUser(data.user)
  }

  return NextResponse.redirect(new URL(next, origin))
}

/**
 * Configura oposicion_id y envía emails de bienvenida para usuarios nuevos.
 */
async function handleNewUser(
  user: { id: string; created_at: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  const createdAt = new Date(user.created_at).getTime()
  const isNewUser = Date.now() - createdAt < 10 * 60 * 1000 // 10 min window (confirm puede tardar)
  if (!isNewUser) return

  // Set oposicion_id from registration metadata
  const oposicionId = user.user_metadata?.oposicion_id as string | undefined
  if (oposicionId) {
    try {
      const { createServiceClient } = await import('@/lib/supabase/server')
      const serviceClient = await createServiceClient()
      await serviceClient
        .from('profiles')
        .update({ oposicion_id: oposicionId })
        .eq('id', user.id)
      logger.info({ userId: user.id, oposicionId }, '[auth/callback] oposicion_id set')
    } catch (err) {
      logger.error({ err, userId: user.id }, '[auth/callback] failed to set oposicion_id')
    }
  }

  if (user.email) {
    const nombre = user.user_metadata?.full_name as string | undefined
    void sendWelcomeEmail({ to: user.email, nombre })
    void sendNewUserNotification({ email: user.email, nombre, confirmed: true })

    // Persistent registration log — survives account deletion (GDPR: no PII, just email + timestamp)
    try {
      const { createServiceClient } = await import('@/lib/supabase/server')
      const svc = await createServiceClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (svc as any).from('registration_log').insert({
        user_email: user.email,
        user_id: user.id,
        event: 'register_confirmed',
      })
    } catch {
      // Non-blocking
    }
  }
}
