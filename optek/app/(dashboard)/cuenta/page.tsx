/**
 * app/(dashboard)/cuenta/page.tsx — §1.14
 *
 * Página de cuenta del usuario:
 *   §1.14.1 — Perfil editable (nombre, fecha examen)
 *   §1.14.2 — Mis compras
 *   §1.14.3 — Balance de correcciones
 *   §1.14.4 — Exportar datos
 *   §1.14.5 — Eliminar cuenta
 *   §1.14.6 — Cerrar sesión
 *
 * Server Component para fetch de datos. Componentes de acción son Client.
 */

import { redirect } from 'next/navigation'
import { ShoppingBag, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProfileForm } from '@/components/cuenta/ProfileForm'
import { AccountActions } from '@/components/cuenta/AccountActions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatEuros(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

const TIPO_LABELS: Record<string, string> = {
  tema: 'Acceso tema',
  pack: 'Pack Oposición',
  recarga: 'Recarga correcciones',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CuentaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile + oposición
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, oposicion_id, fecha_examen, corrections_balance')
    .eq('id', user.id)
    .single()

  const { data: oposicion } = profile?.oposicion_id
    ? await supabase
        .from('oposiciones')
        .select('nombre')
        .eq('id', profile.oposicion_id)
        .single()
    : { data: null }

  // Compras — cast necesario por limitación FK en tipos auto-generados
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: compras } = await (supabase as any)
    .from('compras')
    .select('id, created_at, tipo, amount_paid, tema_id, temas(titulo)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as {
      data: {
        id: string
        created_at: string
        tipo: string
        amount_paid: number
        tema_id: string | null
        temas: { titulo: string } | null
      }[] | null
    }

  const balance = profile?.corrections_balance ?? 0

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>

      {/* ── §1.14.1 Perfil ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            userId={user.id}
            initialName={profile?.full_name ?? null}
            email={profile?.email ?? user.email ?? ''}
            oposicionNombre={oposicion?.nombre ?? null}
            fechaExamen={profile?.fecha_examen ?? null}
          />
        </CardContent>
      </Card>

      {/* ── §1.14.3 Balance de correcciones ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            Correcciones disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold">{balance}</span>
            <div>
              <p className="text-sm text-muted-foreground">correcciones restantes</p>
              {balance < 5 && (
                <p className="text-xs text-amber-600 mt-1">
                  Quedan pocas — considera recargar
                </p>
              )}
            </div>
          </div>
          {balance < 5 && (
            <div className="mt-4 p-3 rounded-lg bg-muted text-sm">
              <p className="font-medium">Recarga de correcciones</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                +15 correcciones · 8,99€ · pago único
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Disponible próximamente — el sistema de pagos se activa en breve.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── §1.14.2 Mis compras ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            Mis compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!compras || compras.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Aún no has realizado ninguna compra.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {compras.map((compra) => (
                <div key={compra.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {TIPO_LABELS[compra.tipo] ?? compra.tipo}
                      {compra.temas && (
                        <span className="text-muted-foreground font-normal">
                          {' '}— {compra.temas.titulo.slice(0, 40)}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatFecha(compra.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatEuros(compra.amount_paid)}</p>
                    <Badge variant="outline" className="text-[10px]">
                      Completado
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── §1.14.4, 1.14.5, 1.14.6 Acciones ───────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestión de cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountActions />
        </CardContent>
      </Card>
    </div>
  )
}
