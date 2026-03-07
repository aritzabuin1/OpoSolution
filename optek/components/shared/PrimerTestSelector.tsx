'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Loader2 } from 'lucide-react'

interface Oposicion {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  num_temas: number | null
}

interface Props {
  oposiciones: Oposicion[]
  userId: string
}

/**
 * Selector de oposición para el onboarding.
 * En un clic: guarda oposicion_id en el perfil + marca cookie de onboarding.
 */
export function PrimerTestSelector({ oposiciones, userId }: Props) {
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)

  async function handleSelect(oposicion: Oposicion) {
    if (selecting) return
    setSelecting(oposicion.id)

    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ oposicion_id: oposicion.id })
      .eq('id', userId)

    // Marcar onboarding completado en cookie (para evitar DB check en cada request)
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
    <div className="grid gap-4 sm:grid-cols-2">
      {oposiciones.map((op) => (
        <button
          key={op.id}
          onClick={() => handleSelect(op)}
          disabled={!!selecting}
          className="text-left"
          aria-label={`Seleccionar oposicion: ${op.nombre}`}
        >
          <Card className="h-full transition-all hover:border-primary hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
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
              {op.num_temas && (
                <Badge variant="secondary" className="text-xs">
                  {op.num_temas} temas
                </Badge>
              )}
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  )
}
