'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { trackPixelEvent } from '@/lib/analytics/pixel'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

const OPOSICIONES = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    label: 'Auxiliar Administrativo (C2)',
    desc: '28 temas · 1.700 plazas',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    label: 'Administrativo del Estado (C1)',
    desc: '45 temas · 2.512 plazas',
  },
] as const

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [oposicionId, setOposicionId] = useState<string>(OPOSICIONES[0].id)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!privacyAccepted) {
      setError('Debes aceptar la política de privacidad para continuar.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() || null, oposicion_id: oposicionId },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        setError('Este email ya está registrado. ¿Quieres iniciar sesión?')
      } else {
        setError('Error al crear la cuenta. Inténtalo de nuevo.')
      }
      setLoading(false)
      return
    }

    // §1.20.4 — Conversion tracking: CompleteRegistration
    trackPixelEvent('CompleteRegistration')

    // Notificar a admin inmediatamente (sin esperar confirmación de email)
    const selectedOp = OPOSICIONES.find((op) => op.id === oposicionId)
    void fetch('/api/auth/notify-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        nombre: name.trim() || undefined,
        oposicion: selectedOp?.label,
      }),
    })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 text-center space-y-4">
          <div className="text-5xl">📧</div>
          <h2 className="text-xl font-bold">¡Casi listo!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Te hemos enviado un email de verificación a <strong>{email}</strong>.
            Haz clic en el enlace del email para activar tu cuenta y acceder a OpoRuta.
          </p>
          <p className="text-xs text-muted-foreground">
            ¿No lo encuentras? Revisa la carpeta de spam.
          </p>
          <Link href="/login">
            <Button variant="outline" className="mt-2">
              Ir al inicio de sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Crear cuenta gratis</CardTitle>
        <CardDescription>
          5 tests gratuitos · Sin tarjeta de crédito
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleSignInButton />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">o</span>
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre (opcional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          {/* Selector de oposición */}
          <div className="space-y-2">
            <Label>¿Qué oposición preparas?</Label>
            <div className="grid grid-cols-1 gap-2">
              {OPOSICIONES.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOposicionId(op.id)}
                  className={`rounded-lg border py-3 px-4 text-left transition-colors ${
                    oposicionId === op.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <p className="text-sm font-semibold">{op.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{op.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="privacy"
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
              required
            />
            <label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer">
              He leído y acepto la{' '}
              <Link
                href="/legal/privacidad"
                target="_blank"
                className="text-primary font-medium hover:underline"
              >
                política de privacidad
              </Link>{' '}
              y los{' '}
              <Link
                href="/legal/terminos"
                target="_blank"
                className="text-primary font-medium hover:underline"
              >
                términos y condiciones
              </Link>
              .
            </label>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}{' '}
              {error.includes('registrado') && (
                <Link href="/login" className="font-medium underline">
                  Iniciar sesión
                </Link>
              )}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta gratis'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
