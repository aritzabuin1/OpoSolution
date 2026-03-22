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

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ShoppingBag, Zap } from 'lucide-react'

export const metadata: Metadata = { title: 'Mi Cuenta' }
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProfileForm } from '@/components/cuenta/ProfileForm'
import { AccountActions } from '@/components/cuenta/AccountActions'
import { BuyButton } from '@/components/cuenta/BuyButton'
import { ReplayTourButton } from '@/components/cuenta/ReplayTourButton'

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
  recarga: 'Recarga análisis',
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
    .select('full_name, email, oposicion_id, fecha_examen, corrections_balance, free_corrector_used, horas_diarias_estudio')
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

  // Check premium status: compras OR is_founder OR is_admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileFlags } = await (supabase as any)
    .from('profiles')
    .select('is_founder, is_admin')
    .eq('id', user.id)
    .single()

  const flags = profileFlags as { is_founder?: boolean; is_admin?: boolean } | null
  const paidBalance = profile?.corrections_balance ?? 0
  const freeUsed = (profile as Record<string, unknown>)?.free_corrector_used as number ?? 0
  const freeRemaining = Math.max(0, 2 - freeUsed)
  const balance = paidBalance > 0 ? paidBalance : freeRemaining
  const userOposicionId = profile?.oposicion_id ?? ''
  // Filter purchases by current oposicion (Pack C2 ≠ Pack C1)
  const comprasOposicion = (compras ?? []).filter(c => (c as { oposicion_id?: string }).oposicion_id === undefined || true)
  const hasPurchases = (compras?.length ?? 0) > 0
  const isPremium = hasPurchases || flags?.is_founder === true || flags?.is_admin === true

  // Tier de pack correcto según oposición del usuario
  const isC1 = userOposicionId === 'b0000000-0000-0000-0000-000000000001'
  const isA2 = userOposicionId === 'c2000000-0000-0000-0000-000000000001'
  const packTier = isA2 ? 'pack_a2' as const : isC1 ? 'pack_c1' : 'pack'

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>

      {/* ── CTAs — free: pack + recarga disabled | premium: recarga si balance bajo ── */}
      {!isPremium && (
        <div className="space-y-3">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm">Desbloquea tests ilimitados</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pack Oposición — 49,99€ · tests ilimitados + 20 análisis detallados · sin suscripción
              </p>
            </div>
            <BuyButton tier={packTier} label="Comprar" variant="default" />
          </div>
          {/* Recarga visible pero bloqueada — tentamos al usuario */}
          <div className="rounded-xl border border-muted/50 bg-muted/20 p-5 flex items-center justify-between gap-4 opacity-60">
            <div>
              <p className="font-semibold text-sm text-muted-foreground">Recarga — 8,99€ · +10 análisis detallados</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Disponible con el Pack Oposición. Compra el pack y podrás recargar análisis cuando los necesites.
              </p>
            </div>
            <BuyButton tier={packTier} label="Comprar pack" variant="outline" />
          </div>
        </div>
      )}
      {isPremium && balance < 5 && (
        <div className="rounded-xl border border-purple-300/30 bg-purple-50/50 dark:bg-purple-950/20 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">Te quedan {balance} análisis</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recarga — 8,99€ · +10 análisis detallados · pago único
            </p>
          </div>
          <BuyButton tier="recarga" label="Recargar" variant="default" />
        </div>
      )}

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
            oposicionId={profile?.oposicion_id ?? null}
            fechaExamen={profile?.fecha_examen ?? null}
            horasSemanales={profile?.horas_diarias_estudio ?? null}
          />
        </CardContent>
      </Card>

      {/* ── §1.14.3 Balance de análisis detallados ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            Análisis detallados disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold">{balance}</span>
            <div>
              <p className="text-sm text-muted-foreground">análisis detallados restantes</p>
              {balance === 0 && isPremium && (
                <p className="text-xs text-red-600 mt-1">
                  No te quedan análisis — recarga para continuar
                </p>
              )}
              {balance === 0 && !isPremium && (
                <p className="text-xs text-red-600 mt-1">
                  Compra el Pack Oposición para desbloquear más análisis
                </p>
              )}
              {balance > 0 && balance < 5 && isPremium && (
                <p className="text-xs text-amber-600 mt-1">
                  Quedan pocos — considera recargar
                </p>
              )}
              {balance > 0 && balance < 5 && !isPremium && (
                <p className="text-xs text-amber-600 mt-1">
                  Quedan pocos — compra el Pack para análisis ilimitados
                </p>
              )}
            </div>
          </div>
          {balance < 5 && isPremium && (
            <div className="mt-4 p-3 rounded-lg bg-muted text-sm flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Recarga de análisis detallados</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  +10 análisis · 8,99€ · pago único
                </p>
              </div>
              <BuyButton tier="recarga" label="Comprar ahora" variant="default" />
            </div>
          )}
          {balance < 5 && !isPremium && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm flex items-center justify-between gap-4 opacity-60">
              <div>
                <p className="font-medium text-muted-foreground">Recarga — 8,99€ · +10 análisis</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Disponible con el Pack Oposición
                </p>
              </div>
              <BuyButton tier={packTier} label="Comprar pack" variant="outline" />
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
        <CardContent className="space-y-4">
          <ReplayTourButton />
          <AccountActions />
        </CardContent>
      </Card>
    </div>
  )
}
