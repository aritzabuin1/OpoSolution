'use client'

/**
 * components/cuenta/ProfileForm.tsx — §1.14.1
 *
 * Formulario editable de perfil (nombre + fecha examen).
 * Client Component para manejo de estado del formulario.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ProfileFormProps {
  userId: string
  initialName: string | null
  email: string
  oposicionNombre: string | null
  fechaExamen: string | null // ISO date string (YYYY-MM-DD)
}

export function ProfileForm({
  userId,
  initialName,
  email,
  oposicionNombre,
  fechaExamen,
}: ProfileFormProps) {
  const [nombre, setNombre] = useState(initialName ?? '')
  const [fecha, setFecha] = useState(fechaExamen ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: nombre.trim() || null,
        fecha_examen: fecha || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)
    if (error) {
      toast.error('No se pudo guardar. Inténtalo de nuevo.')
    } else {
      toast.success('Perfil actualizado correctamente')
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre */}
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            maxLength={80}
          />
        </div>

        {/* Email (readonly) */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="opacity-60" />
          <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
        </div>

        {/* Oposición (readonly) */}
        <div className="space-y-1.5">
          <Label>Oposición</Label>
          <Input value={oposicionNombre ?? 'Sin seleccionar'} disabled className="opacity-60" />
        </div>

        {/* Fecha de examen */}
        <div className="space-y-1.5">
          <Label htmlFor="fecha_examen">Fecha del examen</Label>
          <Input
            id="fecha_examen"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Te mostraremos los días que quedan en el dashboard
          </p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Guardar cambios
      </Button>
    </div>
  )
}
