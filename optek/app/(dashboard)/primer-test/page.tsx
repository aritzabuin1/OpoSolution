import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrimerTestSelector } from '@/components/shared/PrimerTestSelector'

/**
 * /primer-test — Onboarding: seleccionar oposición
 *
 * Flujo §0.18: el usuario acaba de registrarse. Le mostramos las oposiciones
 * disponibles para que elija la suya en un clic. Sin wizard, sin formularios.
 * Test directo después de seleccionar.
 */
export default async function PrimerTestPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: oposiciones } = await supabase
    .from('oposiciones')
    .select('id, nombre, slug, descripcion, num_temas')
    .eq('activa', true)
    .order('nombre')

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            ¿A qué oposición te presentas?
          </h1>
          <p className="text-muted-foreground">
            Elige tu oposición y generamos tu primer test al instante.
          </p>
        </div>

        <PrimerTestSelector oposiciones={oposiciones ?? []} userId={user.id} />

        <p className="text-center text-xs text-muted-foreground">
          Podrás cambiar de oposición más adelante desde tu perfil.
        </p>
      </div>
    </div>
  )
}
