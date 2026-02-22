'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Componente interior que usa useSearchParams — debe ir dentro de <Suspense>
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(
        authError.message.includes('Invalid login credentials')
          ? 'Email o contraseña incorrectos.'
          : 'Error al iniciar sesión. Inténtalo de nuevo.'
      )
      setLoading(false)
      return
    }

    router.push(redirect)
    router.refresh()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (authError) {
      setError('No se pudo enviar el enlace. Verifica el email e inténtalo de nuevo.')
      setLoading(false)
      return
    }

    setMagicSent(true)
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bienvenido de vuelta</CardTitle>
        <CardDescription>Accede a tu cuenta OPTEK</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="password">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="password">Contraseña</TabsTrigger>
            <TabsTrigger value="magic">Enlace mágico</TabsTrigger>
          </TabsList>

          {/* ── Tab: password ── */}
          <TabsContent value="password">
            <form onSubmit={handlePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-pass">Email</Label>
                <Input
                  id="email-pass"
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando…' : 'Iniciar sesión'}
              </Button>
            </form>
          </TabsContent>

          {/* ── Tab: magic link ── */}
          <TabsContent value="magic">
            {magicSent ? (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">📬</div>
                <p className="font-medium">¡Enlace enviado!</p>
                <p className="text-sm text-muted-foreground">
                  Revisa tu bandeja de entrada en <strong>{email}</strong> y haz clic en el
                  enlace para acceder.
                </p>
                <Button variant="ghost" size="sm" onClick={() => setMagicSent(false)}>
                  Usar otro email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Te enviaremos un enlace de acceso directo. Sin contraseñas.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="email-magic">Email</Label>
                  <Input
                    id="email-magic"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando…' : 'Enviar enlace de acceso'}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Regístrate gratis
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Suspense requerido por Next.js para páginas que usan useSearchParams en static rendering
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md h-96 animate-pulse rounded-xl bg-muted" />}>
      <LoginForm />
    </Suspense>
  )
}
