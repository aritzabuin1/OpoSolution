/**
 * components/shared/DailyBrief.tsx — §2.13.8
 *
 * Server Component. Muestra hasta 3 cards contextuales al usuario:
 *   1. Cambio BOE pendiente → flash test (de notificaciones no leídas)
 *   2. Punto débil del temario → practicar ahora
 *   3. Racha activa → mantenerla
 *   4. Usuario nuevo (sin historial) → bienvenida
 *
 * Acepta datos precalculados del dashboard para evitar queries redundantes.
 * Solo hace 1 query propia: notificaciones BOE no leídas.
 */

import Link from 'next/link'
import { Zap, Target, Flame, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TemaDebil {
  numero: number
  titulo: string
  notaMedia: number
}

interface Props {
  userId: string
  rachaActual: number
  totalTests: number
  temaDebil?: TemaDebil | null
}

interface NotificacionBOE {
  id: string
  titulo: string
  mensaje: string
  url_accion: string | null
}

// ─── Componente ───────────────────────────────────────────────────────────────

export async function DailyBrief({ userId, rachaActual, totalTests, temaDebil }: Props) {
  // Fetch notificaciones BOE no leídas (tabla añadida en migration 018)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient()
  const { data: notifBOE } = await (supabase as any)
    .from('notificaciones')
    .select('id, titulo, mensaje, url_accion')
    .eq('user_id', userId)
    .eq('tipo', 'boe_cambio')
    .eq('leida', false)
    .order('created_at', { ascending: false })
    .limit(1) as { data: NotificacionBOE[] | null }

  const boeCambio = notifBOE?.[0] ?? null
  const isNuevo = totalTests === 0
  const hasRacha = rachaActual >= 2

  // Si no hay nada que mostrar → null (no ocupa espacio)
  if (!boeCambio && !temaDebil && !hasRacha && !isNuevo) return null

  return (
    <div className="space-y-2">

      {/* ── Card: cambio BOE ───────────────────────────────────────────────── */}
      {boeCambio && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <Zap className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-800">{boeCambio.titulo}</p>
            <p className="text-xs text-blue-700 mt-0.5 line-clamp-2">{boeCambio.mensaje}</p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100 text-xs">
            <Link href={boeCambio.url_accion ?? '/tests'}>
              Practicar
            </Link>
          </Button>
        </div>
      )}

      {/* ── Card: usuario nuevo ────────────────────────────────────────────── */}
      {isNuevo && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <Star className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">¡Bienvenido a OPTEK!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Genera tu primer test de práctica para empezar a progresar.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0 text-xs">
            <Link href="/tests">Empezar</Link>
          </Button>
        </div>
      )}

      {/* ── Card: punto débil ─────────────────────────────────────────────── */}
      {temaDebil && !isNuevo && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Target className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              Tu punto débil: Tema {temaDebil.numero}
            </p>
            <p className="text-xs text-amber-700 mt-0.5 line-clamp-1">
              {temaDebil.titulo} — nota media {Math.round(temaDebil.notaMedia)}%
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 text-xs">
            <Link href="/tests">Reforzar</Link>
          </Button>
        </div>
      )}

      {/* ── Card: racha ───────────────────────────────────────────────────── */}
      {hasRacha && !isNuevo && (
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <Flame className="h-4 w-4 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800 flex-1">
            <span className="font-semibold">{rachaActual} días seguidos</span>
            {' — '}¡No pierdas tu racha de hoy!
          </p>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-orange-300 text-orange-700 hover:bg-orange-100 text-xs">
            <Link href="/tests">Estudiar hoy</Link>
          </Button>
        </div>
      )}

    </div>
  )
}
