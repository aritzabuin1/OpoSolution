/**
 * app/(dashboard)/corrector/page.tsx — §1.12
 *
 * Página del corrector de desarrollos escritos.
 * Server Component: carga temas, perfil y correcciones anteriores.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditorView } from '@/components/corrector/EditorView'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getNotaColor(n: number) {
  if (n >= 8) return 'text-green-600'
  if (n >= 6) return 'text-blue-600'
  if (n >= 5) return 'text-amber-600'
  return 'text-red-600'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CorrectorPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [temasResult, profileResult, comprasResult, correccionesResult] = await Promise.all([
    supabase.from('temas').select('id, numero, titulo').order('numero'),
    supabase
      .from('profiles')
      .select('free_corrector_used, corrections_balance')
      .eq('id', user.id)
      .single(),
    supabase
      .from('compras')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('desarrollos')
      .select('id, created_at, evaluacion, tema_id, temas(titulo)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const temas = temasResult.data ?? []
  const freeCorrectionsUsed = profileResult.data?.free_corrector_used ?? 0
  const hasPaidAccess =
    (comprasResult.count ?? 0) > 0 ||
    (profileResult.data?.corrections_balance ?? 0) > 0
  const correcciones = correccionesResult.data ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Corrector de desarrollos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escribe tu desarrollo y recibe feedback jurídico con citas verificadas
        </p>
      </div>

      {/* Editor + feedback */}
      <EditorView
        temas={temas}
        freeCorrectionsUsed={freeCorrectionsUsed}
        hasPaidAccess={hasPaidAccess}
      />

      {/* Historial de correcciones */}
      {correcciones.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Correcciones anteriores</h2>
          <div className="space-y-2">
            {correcciones.map((c) => {
              const evaluacion = c.evaluacion as Record<string, unknown> | null
              const puntuacion =
                typeof evaluacion?.puntuacion === 'number' ? evaluacion.puntuacion : null
              const temaTitulo =
                (c.temas as { titulo: string } | null)?.titulo ?? 'Tema sin título'

              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{temaTitulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFecha(c.created_at)}
                      </p>
                    </div>
                  </div>
                  {puntuacion !== null && (
                    <span className={`text-sm font-bold ${getNotaColor(puntuacion)}`}>
                      {puntuacion.toFixed(1)}/10
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
