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
  className?: string
}

export function LawCTA({ lawShortName, className }: LawCTAProps) {
  return (
    <div className={`rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 text-center ${className ?? ''}`}>
      <Sparkles className="mx-auto mb-3 h-8 w-8 text-blue-500" />
      <h2 className="mb-2 text-lg font-semibold text-gray-900">
        Practica con tests de {lawShortName}
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Genera tests personalizados con IA verificados contra la legislación oficial.
        Cada pregunta cita el artículo exacto.
      </p>
      <Link href="/register">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          Empieza gratis
        </Button>
      </Link>
    </div>
  )
}
