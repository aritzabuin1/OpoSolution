/**
 * components/dashboard/ActivityFeed.tsx — §1.13.4
 *
 * Lista cronológica de tests + correcciones recientes.
 *
 * Server Component.
 */

import Link from 'next/link'
import { ClipboardCheck, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TestActividad {
  id: string
  tipo: 'test'
  fecha: string
  titulo: string
  puntuacion: number | null
}

interface CorreccionActividad {
  id: string
  tipo: 'corrector'
  fecha: string
  titulo: string
  nota: number | null
}

type Actividad = TestActividad | CorreccionActividad

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
      {actividades.map((act) => {
        const isTest = act.tipo === 'test'
        const valor = isTest ? (act as TestActividad).puntuacion : (act as CorreccionActividad).nota

        return (
          <div key={`${act.tipo}-${act.id}`} className="flex items-center gap-3 py-3">
            <div
              className={cn(
                'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                isTest ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
              )}
            >
              {isTest ? <ClipboardCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{act.titulo}</p>
              <p className="text-xs text-muted-foreground">{formatFecha(act.fecha)}</p>
            </div>
            <div className="shrink-0 text-right">
              {valor !== null ? (
                <p className={cn('text-sm font-bold', getPuntuacionColor(valor))}>
                  {isTest ? `${Math.round(valor)}%` : `${valor.toFixed(1)}/10`}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">—</p>
              )}
              {isTest && (
                <Link
                  href={`/tests/${act.id}/resultados`}
                  className="text-[10px] text-primary hover:underline"
                >
                  Ver
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
