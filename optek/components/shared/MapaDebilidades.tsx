/**
 * components/shared/MapaDebilidades.tsx — §2.25.1
 *
 * Muestra los 5 temas con peor rendimiento del usuario.
 * Usa los temaScores ya calculados en el dashboard — sin queries adicionales.
 *
 * Criterio: temas con al menos 1 test completado, ordenados por nota ascendente.
 */

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TemaScore {
  numero: number
  titulo: string
  notaMedia: number | null
  testsCount: number
}

interface MapaDebilidadesProps {
  temaScores: TemaScore[]
}

export function MapaDebilidades({ temaScores }: MapaDebilidadesProps) {
  const debilidades = temaScores
    .filter((t) => t.notaMedia !== null && t.testsCount >= 1)
    .sort((a, b) => (a.notaMedia ?? 100) - (b.notaMedia ?? 100))
    .slice(0, 5)

  if (debilidades.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Tus temas más débiles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {debilidades.map((t) => {
          const nota = t.notaMedia ?? 0
          const barColor =
            nota >= 70 ? 'bg-green-500' : nota >= 50 ? 'bg-amber-500' : 'bg-red-500'
          const textColor =
            nota >= 70 ? 'text-green-600' : nota >= 50 ? 'text-amber-600' : 'text-red-600'

          return (
            <div key={t.numero}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-muted-foreground truncate max-w-[200px]" title={t.titulo}>
                  T{t.numero}: {t.titulo}
                </span>
                <span className={`font-semibold shrink-0 ml-2 ${textColor}`}>
                  {Math.round(nota)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${nota}%` }}
                />
              </div>
            </div>
          )
        })}
        <Link href="/tests" className="block pt-1">
          <Button variant="outline" size="sm" className="w-full">
            Practicar tema más débil
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
