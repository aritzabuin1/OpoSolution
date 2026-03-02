'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * /forgot-password
 *
 * Solicita un email de recuperación de contraseña.
 * Llama a supabase.auth.resetPasswordForEmail() → Supabase envía email
 * con un enlace que apunta a /auth/callback?next=/reset-password.
 * El callback intercambia el code por sesión y redirige a /reset-password.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (authError) {
      setError('No se pudo enviar el email. Verifica la dirección e inténtalo de nuevo.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="text-5xl">📬</div>
          <h2 className="text-xl font-bold">Revisa tu email</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Si <strong>{email}</strong> está registrado en OpoRuta, recibirás un enlace para
            restablecer tu contraseña. Revisa también la carpeta de spam.
          </p>
          <p className="text-xs text-muted-foreground">El enlace caduca en 1 hora.</p>
          <Link href="/login">
            <Button variant="outline" className="mt-2">
              Volver al inicio de sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
        <CardDescription>
          Te enviaremos un enlace para crear una nueva contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email de tu cuenta</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
