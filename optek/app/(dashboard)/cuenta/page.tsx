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
import { ShoppingBag, Sparkles, Zap } from 'lucide-react'
import { PushNotificationToggle } from '@/components/shared/PushNotificationToggle'

export const metadata: Metadata = { title: 'Mi Cuenta' }
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_OPOSICION_ID } from '@/lib/freemium'
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
  pack_oposicion: 'Pack Oposición',
  subscription: 'Suscripción',
  recarga: 'Recarga análisis',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CuentaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // All oposiciones (for dynamic ProfileForm selector)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allOposicionesRaw } = await (supabase as any)
    .from('oposiciones')
    .select('id, nombre, slug, rama, nivel, activa')
    .order('rama')
    .order('orden')
  const allOposiciones = (allOposicionesRaw ?? []) as Array<{ id: string; nombre: string; slug: string; rama: string | null; nivel: string | null; activa: boolean }>

  // Profile + oposición
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, email, oposicion_id, fecha_examen, corrections_balance, free_corrector_used, horas_diarias_estudio')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null; email: string; oposicion_id: string; fecha_examen: string | null; corrections_balance: number; free_corrector_used: number; horas_diarias_estudio: number | null } | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: oposicion } = profile?.oposicion_id
    ? await (supabase as any)
        .from('oposiciones')
        .select('nombre, features')
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

  // Check premium status: compras scoped por oposición OR is_admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileFlags } = await (supabase as any)
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const flags = profileFlags as { is_admin?: boolean } | null
  const paidBalance = profile?.corrections_balance ?? 0
  const freeUsed = (profile as Record<string, unknown>)?.free_corrector_used as number ?? 0
  const freeRemaining = Math.max(0, 2 - freeUsed)
  const balance = paidBalance > 0 ? paidBalance : freeRemaining
  const userOposicionId = profile?.oposicion_id ?? DEFAULT_OPOSICION_ID
  // Filter purchases by current oposicion (Pack C2 ≠ Pack C1)
  const { count: purchaseCountForOpo } = await (supabase as any)
    .from('compras')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('oposicion_id', userOposicionId)
  const hasPurchases = (purchaseCountForOpo ?? 0) > 0
  const isPremium = hasPurchases || flags?.is_admin === true

  // Tier de pack correcto según oposición del usuario
  const OPOSICION_TIER_MAP: Record<string, string> = {
    'a0000000-0000-0000-0000-000000000001': 'pack',
    'b0000000-0000-0000-0000-000000000001': 'pack_c1',
    'c2000000-0000-0000-0000-000000000001': 'pack_a2',
    'd0000000-0000-0000-0000-000000000001': 'pack_correos',
    'e0000000-0000-0000-0000-000000000001': 'pack_auxilio',
    'e1000000-0000-0000-0000-000000000001': 'pack_tramitacion',
    'e2000000-0000-0000-0000-000000000001': 'pack_gestion_j',
    'f0000000-0000-0000-0000-000000000001': 'pack_hacienda',
    'f1000000-0000-0000-0000-000000000001': 'pack_penitenciarias',
    'ab000000-0000-0000-0000-000000000001': 'pack_ertzaintza',
    'ac000000-0000-0000-0000-000000000001': 'pack_guardia_civil',
    'ad000000-0000-0000-0000-000000000001': 'pack_policia_nacional',
  }
  const packTier = (OPOSICION_TIER_MAP[userOposicionId] ?? 'pack') as string
  const TIER_PRICES: Record<string, string> = {
    pack: '49,99€', pack_c1: '49,99€', pack_a2: '69,99€',
    pack_correos: '49,99€', pack_auxilio: '49,99€', pack_tramitacion: '49,99€', pack_gestion_j: '79,99€',
    pack_hacienda: '49,99€', pack_penitenciarias: '49,99€',
    pack_ertzaintza: '79,99€', pack_guardia_civil: '79,99€', pack_policia_nacional: '79,99€',
  }
  const TIER_CREDITS: Record<string, number> = {
    pack: 20, pack_c1: 20, pack_a2: 25,
    pack_correos: 20, pack_auxilio: 20, pack_tramitacion: 20, pack_gestion_j: 25,
    pack_hacienda: 20, pack_penitenciarias: 20,
    pack_ertzaintza: 20, pack_guardia_civil: 20, pack_policia_nacional: 20,
  }
  // supuestosBalance removed — supuestos now use unified créditos IA (2 per use)
  const opoFeatures = (oposicion as Record<string, unknown>)?.features as { supuesto_practico?: boolean } | null
  // Supuesto práctico: solo si la oposición lo tiene (A2). Admin NO override — debe depender de la oposición elegida.
  const hasSupuestoPractico = opoFeatures?.supuesto_practico === true

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
                {`Pack Oposición — ${TIER_PRICES[packTier] ?? '49,99€'} · tests ilimitados + ${TIER_CREDITS[packTier] ?? 20} créditos IA`} · sin suscripción
              </p>
            </div>
            <BuyButton tier={packTier} label="Comprar" variant="default" />
          </div>
          {/* Recarga visible pero bloqueada — tentamos al usuario */}
          <div className="rounded-xl border border-muted/50 bg-muted/20 p-5 flex items-center justify-between gap-4 opacity-60">
            <div>
              <p className="font-semibold text-sm text-muted-foreground">Recarga — 9,99€ · +10 créditos IA</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Disponible con el Pack Oposición. Compra el pack y podrás recargar créditos cuando los necesites.
              </p>
            </div>
            <BuyButton tier={packTier} label="Comprar pack" variant="outline" />
          </div>
        </div>
      )}
      {isPremium && balance < 5 && (
        <div className="rounded-xl border border-purple-300/30 bg-purple-50/50 dark:bg-purple-950/20 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-sm">Te quedan {balance} créditos IA</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Recarga — 9,99€ · +10 créditos IA · pago único
            </p>
          </div>
          <BuyButton tier="recarga" label="Recargar" variant="default" />
        </div>
      )}
      {/* Info supuestos prácticos — solo oposiciones A2, consume créditos IA */}
      {hasSupuestoPractico && (
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
          <p className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Supuestos prácticos con IA
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Caso práctico corregido con rúbrica oficial del tribunal. Cada supuesto consume 2 créditos IA (la IA genera tu caso + lo corrige).
          </p>
          {!isPremium && (
            <p className="text-xs text-amber-600 mt-1">Necesitas el Pack para acceder a supuestos prácticos.</p>
          )}
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
            oposiciones={allOposiciones}
          />
        </CardContent>
      </Card>

      {/* ── §1.14.3 Balance de créditos IA ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            Créditos IA disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold">{balance}</span>
            <div>
              <p className="text-sm text-muted-foreground">créditos IA restantes</p>
              {balance === 0 && isPremium && (
                <p className="text-xs text-red-600 mt-1">
                  No te quedan créditos — recarga para continuar
                </p>
              )}
              {balance === 0 && !isPremium && (
                <p className="text-xs text-red-600 mt-1">
                  Compra el Pack Oposición para desbloquear créditos IA
                </p>
              )}
              {balance > 0 && balance < 5 && isPremium && (
                <p className="text-xs text-amber-600 mt-1">
                  Quedan pocos — considera recargar
                </p>
              )}
              {balance > 0 && balance < 5 && !isPremium && (
                <p className="text-xs text-amber-600 mt-1">
                  Quedan pocos — compra el Pack para más créditos IA
                </p>
              )}
            </div>
          </div>
          {balance < 5 && isPremium && (
            <div className="mt-4 p-3 rounded-lg bg-muted text-sm flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Recarga de créditos IA</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  +10 créditos IA · 9,99€ · pago único
                </p>
              </div>
              <BuyButton tier="recarga" label="Comprar ahora" variant="default" />
            </div>
          )}
          {balance < 5 && !isPremium && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm flex items-center justify-between gap-4 opacity-60">
              <div>
                <p className="font-medium text-muted-foreground">Recarga — 9,99€ · +10 créditos IA</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Disponible con el Pack Oposición
                </p>
              </div>
              <BuyButton tier={packTier} label="Comprar pack" variant="outline" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Notificaciones push ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <PushNotificationToggle variant="toggle" />
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
