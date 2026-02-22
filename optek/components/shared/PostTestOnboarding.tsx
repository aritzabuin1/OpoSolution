'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  userId: string
  open: boolean
  onClose: () => void
}

/**
 * Modal de onboarding post-primer-test (§0.18.4)
 *
 * Aparece tras completar el primer test.
 * Pide fecha de examen y horas/día de estudio — ambos opcionales.
 * El botón "Saltar" es prominente para no bloquear al usuario.
 */
export function PostTestOnboarding({ userId, open, onClose }: Props) {
  const [fechaExamen, setFechaExamen] = useState('')
  const [horasDiarias, setHorasDiarias] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)

    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({
        fecha_examen: fechaExamen || null,
        horas_diarias_estudio: horasDiarias ? parseInt(horasDiarias, 10) : null,
      })
      .eq('id', userId)

    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>¡Buen trabajo en tu primer test! 🎉</DialogTitle>
          <DialogDescription>
            Cuéntanos un poco más para personalizar tu plan de estudio.
            Todo es opcional — puedes saltarlo ahora.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="fecha-examen">
              ¿Cuándo es tu examen?{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="fecha-examen"
              type="date"
              value={fechaExamen}
              onChange={(e) => setFechaExamen(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="horas-estudio">
              ¿Cuántas horas al día estudias?{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="horas-estudio"
              type="number"
              placeholder="2"
              min="0"
              max="16"
              value={horasDiarias}
              onChange={(e) => setHorasDiarias(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={onClose} className="flex-1" disabled={saving}>
              Saltar por ahora
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
