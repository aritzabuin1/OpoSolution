'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Google Sign-In button using Google Identity Services (GIS).
 *
 * Uses signInWithIdToken() instead of signInWithOAuth() so the Google
 * consent screen shows oporuta.es (our origin) instead of supabase.co.
 *
 * Flow:
 *   1. Load Google GIS script
 *   2. User clicks → Google popup on OUR domain
 *   3. Google returns ID token (JWT)
 *   4. signInWithIdToken() → Supabase creates/links account
 *   5. Redirect to /dashboard (middleware handles /primer-test if needed)
 *
 * Requires:
 *   - NEXT_PUBLIC_GOOGLE_CLIENT_ID env var
 *   - Google provider enabled in Supabase Dashboard
 *   - Google Cloud Console: OAuth Client ID with JS origin https://oporuta.es
 */

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export function GoogleSignInButton() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || initializedRef.current) return

    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (!window.google || !buttonRef.current) return
      initializedRef.current = true

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      // Render the Google-styled button
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: buttonRef.current.offsetWidth,
        locale: 'es',
      })
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup on unmount — don't remove script (may be shared)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCredentialResponse(response: { credential: string }) {
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: response.credential,
    })

    if (authError) {
      console.error('[GoogleSignIn] signInWithIdToken error:', authError.message)
      setError('Error al iniciar sesión con Google. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    // New user setup (oposicion_id + welcome email)
    try {
      await fetch('/api/auth/setup-new-user', { method: 'POST' })
    } catch {
      // Non-blocking
    }

    router.push('/dashboard')
    router.refresh()
  }

  // Don't render if no client ID configured
  if (!GOOGLE_CLIENT_ID) return null

  return (
    <div className="space-y-3">
      <div
        ref={buttonRef}
        className="flex items-center justify-center min-h-[44px]"
        style={{ colorScheme: 'light' }}
      />

      {loading && (
        <p className="text-sm text-muted-foreground text-center">Iniciando sesión...</p>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}

// Type declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            config: {
              type?: string
              theme?: string
              size?: string
              text?: string
              shape?: string
              width?: number
              locale?: string
            }
          ) => void
        }
      }
    }
  }
}
