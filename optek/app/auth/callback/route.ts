import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { sendWelcomeEmail } from '@/lib/email/client'

/**
 * GET /auth/callback
 *
 * Maneja el redirect de Supabase tras:
 * - Verificación de email en registro
 * - Magic link de login
 * - OAuth (si se habilita en el futuro)
 *
 * Intercambia el `code` por una sesión y redirige al dashboard.
 * En caso de error → /auth/error con reason en query string.
 *
 * §1.16.7: envía email de bienvenida en el primer login (created_at < 2 min).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
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

    if (!error && data.user) {
      // Detectar registro nuevo: created_at dentro de los últimos 2 minutos
      const createdAt = new Date(data.user.created_at).getTime()
      const isNewUser = Date.now() - createdAt < 2 * 60 * 1000

      if (isNewUser && data.user.email) {
        // No-op si Resend no está configurado (§1.16 condicional)
        const nombre = data.user.user_metadata?.full_name as string | undefined
        void sendWelcomeEmail({ to: data.user.email, nombre })
      }

      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/error?reason=callback', origin))
}
