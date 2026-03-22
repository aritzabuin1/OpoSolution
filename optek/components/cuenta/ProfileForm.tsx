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
import { OPOSICION_CHANGED_EVENT } from '@/lib/hooks/useIsPremium'

// TODO: query oposiciones WHERE activa = true (requires server component or API)
const OPOSICIONES = [
  { id: 'a0000000-0000-0000-0000-000000000001', label: 'Auxiliar Administrativo (C2)' },
  { id: 'b0000000-0000-0000-0000-000000000001', label: 'Administrativo del Estado (C1)' },
  { id: 'c2000000-0000-0000-0000-000000000001', label: 'Gestión del Estado (A2)' },
] as const

interface ProfileFormProps {
  userId: string
  initialName: string | null
  email: string
  oposicionNombre: string | null
  oposicionId: string | null
  fechaExamen: string | null // ISO date string (YYYY-MM-DD)
  horasSemanales: number | null
}

const DEDICACION_OPTIONS = [
  { value: 5, label: 'Ligero', desc: '~5 h/semana' },
  { value: 10, label: 'Moderado', desc: '~10 h/semana' },
  { value: 15, label: 'Intenso', desc: '~15 h/semana' },
  { value: 25, label: 'Full', desc: '20+ h/semana' },
] as const

export function ProfileForm({
  userId,
  initialName,
  email,
  oposicionNombre,
  oposicionId: initialOposicionId,
  fechaExamen,
  horasSemanales,
}: ProfileFormProps) {
  const [nombre, setNombre] = useState(initialName ?? '')
  const [fecha, setFecha] = useState(fechaExamen ?? '')
  const [selectedOposicion, setSelectedOposicion] = useState(
    initialOposicionId ?? OPOSICIONES[0].id
  )
  const [dedicacion, setDedicacion] = useState<number | null>(horasSemanales)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: nombre.trim() || null,
        oposicion_id: selectedOposicion,
        fecha_examen: fecha || null,
        horas_diarias_estudio: dedicacion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)
    if (error) {
      toast.error('No se pudo guardar. Inténtalo de nuevo.')
    } else {
      toast.success('Perfil actualizado correctamente')
      // Notify hooks (useIsPremium, etc.) that oposición changed
      window.dispatchEvent(new Event(OPOSICION_CHANGED_EVENT))
      // Reload page to update sidebar features (Server Component can't react to client changes)
      if (selectedOposicion !== initialOposicionId) {
        setTimeout(() => window.location.reload(), 500)
      }
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

        {/* Oposición (editable) */}
        <div className="space-y-1.5">
          <Label>Oposición</Label>
          <select
            value={selectedOposicion}
            onChange={(e) => setSelectedOposicion(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {OPOSICIONES.map((op) => (
              <option key={op.id} value={op.id}>{op.label}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">Cambia aquí si preparas otra oposición</p>
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

      {/* Dedicación semanal */}
      <div className="space-y-2">
        <Label>Dedicación semanal</Label>
        <p className="text-xs text-muted-foreground -mt-1">
          Tu plan de estudio se adaptará a las horas que puedes dedicar
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEDICACION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDedicacion(dedicacion === opt.value ? null : opt.value)}
              className={`rounded-lg border py-3 px-2 text-center transition-colors ${
                dedicacion === opt.value
                  ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-[10px] mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Guardar cambios
      </Button>
    </div>
  )
}
