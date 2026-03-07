/**
 * components/dashboard/ActivityFeed.tsx — §1.13.4
 *
 * Lista cronológica de tests recientes.
 * Server Component.
 */

import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Actividad {
  id: string
  tipo: 'test'
  fecha: string
  titulo: string
  puntuacion: number | null
}

interface ActivityFeedProps {
  actividades: Actividad[]
}

function getPuntuacionColor(val: number | null): string {
  if (val === null) return 'text-muted-foreground'
  if (val >= 70) return 'text-green-600'
  if (val >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ActivityFeed({ actividades }: ActivityFeedProps) {
  if (actividades.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aún no hay actividad. ¡Genera tu primer test!
      </p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {actividades.map((act) => (
        <div key={`test-${act.id}`} className="flex items-center gap-3 py-3">
          <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{act.titulo}</p>
            <p className="text-xs text-muted-foreground">{formatFecha(act.fecha)}</p>
          </div>
          <div className="shrink-0 text-right">
            {act.puntuacion !== null ? (
              <p className={cn('text-sm font-bold', getPuntuacionColor(act.puntuacion))}>
                {Math.round(act.puntuacion)}%
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">—</p>
            )}
            <Link
              href={`/tests/${act.id}/resultados`}
              className="text-[10px] text-primary hover:underline"
            >
              Ver
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
