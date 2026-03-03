'use client'

/**
 * components/flashcards/FlashcardSessionStarter.tsx
 *
 * Botón "Iniciar repaso" que abre una sesión de FlashcardReview en modal.
 * Evita navegar a una nueva página — repaso inline.
 */

import { useState } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FlashcardReview } from '@/components/flashcards/FlashcardReview'

interface FlashcardItem {
  id: string
  frente: string
  reverso: string
  cita_legal: { ley: string; articulo: string; texto_ref: string } | null
  intervalo_dias: number
  veces_acertada: number
  veces_fallada: number
  tema_titulo?: string
}

interface Props {
  flashcards: FlashcardItem[]
  label?: string
  variant?: 'default' | 'outline' | 'secondary'
}

export function FlashcardSessionStarter({ flashcards, label = 'Iniciar repaso', variant = 'default' }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="sm"
        variant={variant}
        onClick={() => setOpen(true)}
        className="shrink-0 gap-2"
      >
        <Play className="h-4 w-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Sesión de repaso</span>
              <span className="text-sm font-normal text-muted-foreground">
                — {flashcards.length} tarjetas
              </span>
            </DialogTitle>
          </DialogHeader>
          <FlashcardReview
            flashcards={flashcards}
            onComplete={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
