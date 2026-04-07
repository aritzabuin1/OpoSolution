/**
 * components/seo/OposicionBadges.tsx — Badges de oposiciones para páginas de ley
 *
 * Server Component. Muestra qué oposiciones examinan una ley con links.
 */

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getOposicionesForLey } from '@/data/seo/ley-oposicion-map'

interface OposicionBadgesProps {
  leyNombre: string
  className?: string
}

export function OposicionBadges({ leyNombre, className }: OposicionBadgesProps) {
  const oposiciones = getOposicionesForLey(leyNombre)

  if (oposiciones.length === 0) return null

  return (
    <div className={className}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Se examina en
      </h2>
      <div className="flex flex-wrap gap-2">
        {oposiciones.map(opo => (
          <Link key={opo.slug} href={opo.path}>
            <Badge variant="secondary" className="hover:bg-blue-100 transition-colors cursor-pointer">
              {opo.name}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  )
}
