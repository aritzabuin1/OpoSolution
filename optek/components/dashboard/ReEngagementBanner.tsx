import Link from 'next/link'
import { Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReEngagementBannerProps {
  diasSinPracticar: number
  notaMedia: number | null
  diasParaExamen: number | null
}

export function ReEngagementBanner({
  diasSinPracticar,
  notaMedia,
  diasParaExamen,
}: ReEngagementBannerProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4 sm:p-5">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div className="flex items-start gap-3">
          <Flame className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Llevas {diasSinPracticar} días sin practicar
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {notaMedia !== null && <>Tu nota media era {Math.round(notaMedia)}%. </>}
              Un test rápido de 10 preguntas tarda solo 5 minutos.
              {diasParaExamen !== null && diasParaExamen > 0 && (
                <> Quedan <strong>{diasParaExamen} días</strong> para el examen.</>
              )}
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white">
          <Link href="/tests">Retomar práctica →</Link>
        </Button>
      </div>
    </div>
  )
}
