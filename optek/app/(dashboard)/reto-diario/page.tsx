/**
 * app/(dashboard)/reto-diario/page.tsx — §2.20.7
 *
 * Página del Reto Diario Comunitario.
 * Mecánica Wordle: todos juegan el mismo reto, 1 intento/día, se resetea a medianoche.
 */

import type { Metadata } from 'next'
import { RetoDiarioCard } from '@/components/cazatrampas/RetoDiarioCard'

export const metadata: Metadata = {
  title: 'Reto Diario — OpoRuta',
  description:
    'El reto de Caza-Trampas del día. Todos los opositores juegan el mismo artículo con errores ocultos. ¿Puedes encontrar las trampas?',
}

export default function RetoDiarioPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reto Diario</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todos los opositores de OpoRuta juegan el mismo reto hoy. Solo puedes jugarlo una vez.
        </p>
      </div>
      <RetoDiarioCard />
    </div>
  )
}
