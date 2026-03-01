/**
 * app/(dashboard)/logros/page.tsx — §2.8.4
 *
 * Página completa de logros del usuario.
 * Muestra todos los badges del catálogo:
 *   - Desbloqueados: en color con fecha
 *   - Pendientes: en gris con descripción
 *
 * Server Component.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LOGROS_CATALOG } from '@/lib/utils/streaks'
import { Trophy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LogrosPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Cargar logros desbloqueados del usuario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: logrosData } = await (supabase as any)
    .from('logros')
    .select('tipo, desbloqueado_en')
    .eq('user_id', user.id) as { data: { tipo: string; desbloqueado_en: string }[] | null }

  const logrosMap = new Map(
    (logrosData ?? []).map((l) => [l.tipo, l.desbloqueado_en])
  )

  const todosLogros = Object.values(LOGROS_CATALOG)
  const desbloqueados = todosLogros.filter((l) => logrosMap.has(l.tipo))
  const pendientes = todosLogros.filter((l) => !logrosMap.has(l.tipo))

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">

      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Logros
            {desbloqueados.length > 0 && (
              <Badge variant="secondary" className="text-xs font-normal">
                {desbloqueados.length}/{todosLogros.length}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Desbloquea logros estudiando cada día y completando retos
          </p>
        </div>
        <Trophy className="h-7 w-7 text-primary/60 shrink-0 mt-1" />
      </div>

      {/* Logros desbloqueados */}
      {desbloqueados.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Desbloqueados ({desbloqueados.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {desbloqueados.map((logro) => {
              const fechaStr = logrosMap.get(logro.tipo)
              const fecha = fechaStr
                ? new Date(fechaStr).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : null

              return (
                <div
                  key={logro.tipo}
                  className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
                >
                  <span className="text-3xl leading-none shrink-0">{logro.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-snug">{logro.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {logro.descripcion}
                    </p>
                    {fecha && (
                      <p className="text-[10px] text-primary mt-1 font-medium">
                        ✓ Desbloqueado el {fecha}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Logros pendientes */}
      {pendientes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Por conseguir ({pendientes.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendientes.map((logro) => (
              <div
                key={logro.tipo}
                className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 opacity-60"
              >
                <span className="text-3xl leading-none shrink-0 grayscale">{logro.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-snug text-muted-foreground">
                    {logro.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">
                    {logro.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Estado vacío */}
      {desbloqueados.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-8 text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="font-semibold">Aún no tienes logros</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Completa tu primer test para empezar a desbloquear logros y llenar este panel.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
