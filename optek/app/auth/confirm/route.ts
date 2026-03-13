import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import type { EmailOtpType } from '@supabase/supabase-js'
import { sendWelcomeEmail, sendNewUserNotification } from '@/lib/email/client'

/**
 * GET /auth/confirm?token_hash=xxx&type=email|recovery|magiclink
 *
 * Server-side email link verification (token hash flow).
 * Supabase email templates point here with {{ .TokenHash }}.
 *
 * - type=email     -> /dashboard  (signup confirmation)
 * - type=recovery  -> /reset-password
 * - type=magiclink -> /dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/auth/error?reason=missing_params', origin))
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
    return NextResponse.redirect(new URL('/auth/error?reason=verify_failed', origin))
  }

  // Welcome email for new signups
  if (type === 'email' && data.user) {
    const createdAt = new Date(data.user.created_at).getTime()
    const isNewUser = Date.now() - createdAt < 10 * 60 * 1000
    if (isNewUser && data.user.email) {
      const nombre = data.user.user_metadata?.full_name as string | undefined
      void sendWelcomeEmail({ to: data.user.email, nombre })
      void sendNewUserNotification({ email: data.user.email, nombre })
    }
  }

  return response
}
