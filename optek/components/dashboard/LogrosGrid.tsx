/**
 * components/dashboard/LogrosGrid.tsx — §1.13B.6
 *
 * Mini-sección de logros desbloqueados.
 * Muestra los últimos 3 + total de logros.
 *
 * Server Component.
 */

import Link from 'next/link'
import { LOGROS_CATALOG } from '@/lib/utils/streaks'

interface LogroDesbloqueado {
  tipo: string
  desbloqueado_en: string
}

interface LogrosGridProps {
  logros: LogroDesbloqueado[]
}

export function LogrosGrid({ logros }: LogrosGridProps) {
  if (logros.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Completa tu primer test para desbloquear logros 🎯
      </p>
    )
  }

  const ultimos = logros.slice(0, 3)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {ultimos.map((logro) => {
          const info = LOGROS_CATALOG[logro.tipo]
          if (!info) return null
          return (
            <div
              key={logro.tipo}
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"
              title={info.descripcion}
            >
              <span className="text-xl">{info.emoji}</span>
              <div>
                <p className="text-xs font-semibold leading-tight">{info.titulo}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(logro.desbloqueado_en).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <Link href="/logros" className="text-xs text-primary hover:underline">
        Ver todos los logros →
      </Link>
    </div>
  )
}
