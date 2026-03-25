import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { RegisterForm, type OposicionOption } from '@/components/auth/RegisterForm'

export const metadata: Metadata = { title: 'Crear cuenta gratis' }

/**
 * /register — Server Component
 *
 * Queries active oposiciones from DB and passes them to the RegisterForm
 * client component. Oposiciones are grouped by rama and ordered by the
 * 'orden' column. Inactive oposiciones appear as "Próximamente".
 */
export default async function RegisterPage() {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('oposiciones')
    .select('id, nombre, slug, rama, nivel, descripcion, num_temas, plazas, activa')
    .order('rama')
    .order('orden')

  // Fallback: if query fails or DB doesn't have rama column yet, use hardcoded
  const oposiciones: OposicionOption[] = (data && data.length > 0 && data[0].rama !== null)
    ? (data as OposicionOption[])
    : [
        { id: 'a0000000-0000-0000-0000-000000000001', nombre: 'Auxiliar Administrativo (C2)', slug: 'aux-admin-estado', rama: 'age', nivel: 'C2', descripcion: '28 temas · 1.700 plazas', num_temas: 28, plazas: 1700, activa: true },
        { id: 'b0000000-0000-0000-0000-000000000001', nombre: 'Administrativo del Estado (C1)', slug: 'administrativo-estado', rama: 'age', nivel: 'C1', descripcion: '45 temas · 2.512 plazas', num_temas: 45, plazas: 2512, activa: true },
        { id: 'c2000000-0000-0000-0000-000000000001', nombre: 'Gestión del Estado (A2)', slug: 'gestion-estado', rama: 'age', nivel: 'A2', descripcion: '58 temas · 1.356 plazas', num_temas: 58, plazas: 1356, activa: true },
      ]

  return <RegisterForm oposiciones={oposiciones} />
}
