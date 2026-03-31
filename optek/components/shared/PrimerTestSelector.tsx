'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Lock, Loader2 } from 'lucide-react'

interface Oposicion {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  num_temas: number | null
  activa: boolean
  rama: string | null
  plazas: number | null
}

const RAMA_LABELS: Record<string, string> = {
  age: 'Administración del Estado',
  justicia: 'Justicia',
  correos: 'Correos',
  hacienda: 'Hacienda Pública',
  penitenciarias: 'Instituciones Penitenciarias',
  seguridad: 'Fuerzas y Cuerpos de Seguridad',
}

interface Props {
  oposiciones: Oposicion[]
  userId: string
}

/**
 * Selector de oposición para el onboarding.
 * Muestra activas como seleccionables e inactivas como "Próximamente".
 */
export function PrimerTestSelector({ oposiciones, userId }: Props) {
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)

  const active = oposiciones.filter(o => o.activa)
  const inactive = oposiciones.filter(o => !o.activa)

  // Group inactive by rama
  const inactiveByRama = inactive.reduce<Record<string, Oposicion[]>>((acc, op) => {
    const rama = op.rama ?? 'other'
    if (!acc[rama]) acc[rama] = []
    acc[rama].push(op)
    return acc
  }, {})

  async function handleSelect(oposicion: Oposicion) {
    if (selecting || !oposicion.activa) return
    setSelecting(oposicion.id)

    await fetch('/api/user/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oposicion_id: oposicion.id }),
    })

    document.cookie = 'oporuta_onboarded=1; path=/; max-age=31536000; SameSite=Lax'

    router.push('/dashboard')
    router.refresh()
  }

  if (oposiciones.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8 text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No hay oposiciones disponibles en este momento. Vuelve pronto.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (selecting) {
    const selected = oposiciones.find(op => op.id === selecting)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <div>
            <p className="font-semibold text-lg">Preparando tu espacio...</p>
            {selected && (
              <p className="text-sm text-muted-foreground mt-1">{selected.nombre}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">Un momento, estamos configurando todo para ti</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Active oposiciones — selectable */}
      <div className="grid gap-4 sm:grid-cols-2">
        {active.map((op) => (
          <button
            key={op.id}
            onClick={() => handleSelect(op)}
            disabled={!!selecting}
            className="text-left"
            aria-label={`Seleccionar oposicion: ${op.nombre}`}
          >
            <Card className="h-full transition-all hover:border-primary hover:shadow-md cursor-pointer">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <BookOpen className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">{op.nombre}</h3>
                  {op.descripcion && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      {op.descripcion}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {op.num_temas && (
                    <Badge variant="secondary" className="text-xs">
                      {op.num_temas} temas
                    </Badge>
                  )}
                  {op.plazas && (
                    <Badge variant="secondary" className="text-xs">
                      {op.plazas.toLocaleString('es-ES')} plazas
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {/* Inactive oposiciones — "Próximamente" */}
      {inactive.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Próximamente</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(inactiveByRama).map(([rama, ops]) =>
              ops.map((op) => (
                <div key={op.id} className="relative">
                  <Card className="h-full opacity-60 border-dashed">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          Próximamente
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-semibold leading-tight text-muted-foreground">{op.nombre}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {RAMA_LABELS[rama] ?? rama}
                          {op.num_temas ? ` · ${op.num_temas} temas` : ''}
                          {op.plazas ? ` · ${op.plazas.toLocaleString('es-ES')} plazas` : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
