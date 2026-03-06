'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Client-side auth detection for marketing nav.
 * Allows the marketing layout to be statically cached (no server-side cookie access).
 */
export function MarketingNavAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  // While loading, show register CTA (default for new visitors)
  if (isLoggedIn === null) {
    return (
      <>
        <Link href="/login">
          <Button variant="ghost" size="sm">Iniciar sesion</Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Registrarse gratis</Button>
        </Link>
      </>
    )
  }

  if (isLoggedIn) {
    return (
      <Link href="/dashboard">
        <Button size="sm">Mi dashboard →</Button>
      </Link>
    )
  }

  return (
    <>
      <Link href="/login">
        <Button variant="ghost" size="sm">Iniciar sesion</Button>
      </Link>
      <Link href="/register">
        <Button size="sm">Registrarse gratis</Button>
      </Link>
    </>
  )
}
