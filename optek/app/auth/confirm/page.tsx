'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { trackGTMEvent } from '@/lib/analytics/gtm'

/**
 * /auth/confirm?token_hash=xxx&type=email|recovery|magiclink
 *
 * Client-side email verification page. Runs verifyOtp in the BROWSER
 * where the Supabase client has access to PKCE code_verifier in localStorage.
 *
 * Server-side verifyOtp fails because it lacks the PKCE context.
 * This is the root cause of "verify_failed" errors on registration.
 *
 * Flow:
 *   1. Email link → this page with token_hash + type
 *   2. verifyOtp() runs client-side → session created
 *   3. Redirect to dashboard (or /reset-password for recovery)
 *   4. On error → friendly message + link to login
 *
 * New user setup (oposicion_id + welcome email) happens via
 * POST /api/auth/setup-new-user, called after successful verification.
 */

function LoadingCard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="text-4xl animate-pulse">🔐</div>
          <h2 className="text-xl font-bold">Verificando tu cuenta...</h2>
          <p className="text-sm text-muted-foreground">
            Esto solo tarda unos segundos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AuthConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'email' | 'recovery' | 'magiclink' | null

    if (!tokenHash || !type) {
      setStatus('error')
      setErrorMsg('Enlace incompleto. Solicita uno nuevo.')
      return
    }

    async function verify() {
      const supabase = createClient()

      const { error, data } = await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: type!,
      })

      if (error) {
        console.error('[auth/confirm] verifyOtp error:', error.message)

        // Fallback: maybe session was created as side effect
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.info('[auth/confirm] verifyOtp failed but session exists, proceeding')
          await setupNewUser()
          redirectUser(type!)
          return
        }

        setStatus('error')
        setErrorMsg('El enlace ha expirado o ya fue utilizado.')
        return
      }

      // Success — setup new user if needed
      if (data.user) {
        await setupNewUser()
        trackGTMEvent('sign_up', { method: 'email' })
      }

      setStatus('success')

      // Small delay so user sees success state
      setTimeout(() => redirectUser(type!), 500)
    }

    async function setupNewUser() {
      try {
        await fetch('/api/auth/setup-new-user', { method: 'POST' })
      } catch {
        console.error('[auth/confirm] setup-new-user call failed')
      }
    }

    function redirectUser(verifyType: string) {
      if (verifyType === 'recovery') {
        router.push('/reset-password')
      } else {
        router.push('/dashboard')
      }
    }

    verify()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'verifying') {
    return <LoadingCard />
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-bold">Cuenta verificada</h2>
            <p className="text-sm text-muted-foreground">
              Redirigiendo al dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold">Enlace no válido</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {errorMsg || 'El enlace ha expirado o ya fue utilizado.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Si acabas de registrarte, prueba a iniciar sesión directamente con tu email y contraseña.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/login">
              <Button className="w-full">Iniciar sesión</Button>
            </Link>
            <Link href="/register">
              <Button variant="ghost" className="w-full">
                Crear cuenta nueva
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <AuthConfirmInner />
    </Suspense>
  )
}
