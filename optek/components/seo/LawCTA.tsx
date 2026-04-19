/**
 * components/seo/LawCTA.tsx — Call-to-action contextual para páginas de legislación
 *
 * Server Component. Botón de registro con contexto de la ley.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

interface LawCTAProps {
  lawShortName: string
  articleLabel?: string
  /** Ley nombre interno (p.ej. "CE") — se pasa como hint a /register. */
  leyNombre?: string
  /** Número de artículo (p.ej. "14") — se pasa como hint a /register. */
  articuloNumero?: string
  className?: string
}

export function LawCTA({ lawShortName, articleLabel, leyNombre, articuloNumero, className }: LawCTAProps) {
  const isArticleScope = !!articleLabel
  const heading = isArticleScope
    ? `Practica preguntas del ${articleLabel} de ${lawShortName}`
    : `Practica con tests de ${lawShortName}`

  const copy = isArticleScope
    ? `Genera un test centrado en este artículo con preguntas verificadas contra el texto oficial y referencias cruzadas con los exámenes reales.`
    : `Genera tests personalizados con IA verificados contra la legislación oficial. Cada pregunta cita el artículo exacto.`

  const ctaLabel = isArticleScope ? 'Practicar este artículo' : 'Empieza gratis'

  const href = isArticleScope && leyNombre && articuloNumero
    ? `/register?ref=ley&ley=${encodeURIComponent(leyNombre)}&art=${encodeURIComponent(articuloNumero)}`
    : '/register?ref=ley'

  return (
    <div className={`rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center ${className ?? ''}`}>
      <Sparkles className="mx-auto mb-3 h-8 w-8 text-blue-500" />
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{heading}</h2>
      <p className="mb-4 text-sm text-gray-600">{copy}</p>
      <Link href={href}>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          {ctaLabel}
        </Button>
      </Link>
    </div>
  )
}
