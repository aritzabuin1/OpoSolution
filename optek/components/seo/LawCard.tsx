/**
 * components/seo/LawCard.tsx — Card para el hub de legislación
 *
 * Server Component. Muestra resumen de una ley con link a su página.
 */

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ArrowRight } from 'lucide-react'
import { getOposicionesForLey } from '@/data/seo/ley-oposicion-map'

interface LawCardProps {
  leyNombre: string
  slug: string
  shortName: string
  fullName: string
  articleCount: number
}

export function LawCard({ leyNombre, slug, shortName, fullName, articleCount }: LawCardProps) {
  const oposiciones = getOposicionesForLey(leyNombre)

  return (
    <Link href={`/ley/${slug}`} className="group block">
      <Card className="h-full transition-all hover:shadow-md hover:border-blue-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 flex-shrink-0 text-blue-500" />
              <span className="text-lg font-bold text-blue-600">{shortName}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
          </div>
          <p className="mt-2 text-sm text-gray-700 line-clamp-2">{fullName}</p>
          <p className="mt-2 text-xs text-gray-500">{articleCount} artículos</p>
          {oposiciones.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {oposiciones.slice(0, 3).map(opo => (
                <Badge key={opo.slug} variant="outline" className="text-xs">
                  {opo.name.replace(/\s*\([^)]+\)/, '')}
                </Badge>
              ))}
              {oposiciones.length > 3 && (
                <Badge variant="outline" className="text-xs text-gray-400">
                  +{oposiciones.length - 3} más
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
