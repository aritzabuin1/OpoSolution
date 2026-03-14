import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import type { EmailOtpType } from '@supabase/supabase-js'
import { sendWelcomeEmail, sendNewUserNotification } from '@/lib/email/client'
import { logger } from '@/lib/logger'

/**
 * GET /auth/confirm?token_hash=xxx&type=email|recovery|magiclink
 *
 * Server-side email link verification (token hash flow).
 * Supabase email templates point here with {{ .TokenHash }}.
 *
 * - type=email     -> /dashboard  (signup confirmation)
 * - type=recovery  -> /reset-password
 * - type=magiclink -> /dashboard
 *
 * CRITICAL PATH: si esto falla, perdemos el usuario. Por eso:
 *   1. Logueamos SIEMPRE el error exacto de verifyOtp
 *   2. Si verifyOtp falla pero hay sesión activa, redirigimos al dashboard igualmente
 *   3. Solo mostramos error si realmente no hay sesión
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  if (!tokenHash || !type) {
    logger.warn({ tokenHash: !!tokenHash, type }, '[auth/confirm] missing params')
    return NextResponse.redirect(new URL('/error?reason=missing_params', origin))
  }

  // Determine redirect destination BEFORE verifying (needed for response object)
  let redirectTo = '/dashboard'
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    redirectTo = next
  } else if (type === 'recovery') {
    redirectTo = '/reset-password'
  }

  // Create the redirect response FIRST so we can set cookies on it
  const redirectUrl = new URL(redirectTo, origin)
  const response = NextResponse.redirect(redirectUrl)

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
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set on BOTH cookieStore and response — critical for redirects
            cookieStore.set(name, value, options)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error, data } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

  if (error) {
    logger.error(
      { error: error.message, code: error.status, type, tokenHashPrefix: tokenHash.slice(0, 8) },
      '[auth/confirm] verifyOtp failed'
    )

    // Fallback: verifyOtp puede fallar pero haber creado la sesión igualmente
    // (side effect de setAll durante el proceso). Si hay sesión, redirigir al dashboard.
    const { data: { user: sessionUser } } = await supabase.auth.getUser()
    if (sessionUser) {
      logger.info(
        { userId: sessionUser.id, email: sessionUser.email },
        '[auth/confirm] verifyOtp failed but session exists — redirecting to dashboard'
      )
      // Ejecutar lógica de nuevo usuario igualmente
      await handleNewUser(sessionUser, type)
      return response
    }

    return NextResponse.redirect(new URL('/error?reason=verify_failed', origin))
  }

  // Verificación exitosa
  if (data.user) {
    await handleNewUser(data.user, type)
  }

  return response
}

/**
 * Configura oposicion_id y envía emails de bienvenida para usuarios nuevos.
 */
async function handleNewUser(
  user: { id: string; created_at: string; email?: string; user_metadata?: Record<string, unknown> },
  type: string | null
) {
  if (type !== 'email') return

  const createdAt = new Date(user.created_at).getTime()
  const isNewUser = Date.now() - createdAt < 10 * 60 * 1000
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
      logger.info({ userId: user.id, oposicionId }, '[auth/confirm] oposicion_id set')
    } catch (err) {
      logger.error({ err, userId: user.id }, '[auth/confirm] failed to set oposicion_id')
    }
  }

  if (user.email) {
    const nombre = user.user_metadata?.full_name as string | undefined
    void sendWelcomeEmail({ to: user.email, nombre })
    void sendNewUserNotification({ email: user.email, nombre })
  }
}
