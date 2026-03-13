/**
 * app/(dashboard)/tests/page.tsx — §1.9.2
 *
 * Página de tests: lista todos los temas agrupados por bloque temático.
 *
 * Arquitectura:
 *   - Server Component: fetches datos (temas, perfil, tests anteriores)
 *   - TemaCard: Client Component (interactividad — config + generación)
 *
 * Datos que carga:
 *   - temas: todos los temas de la oposición, ordenados por número
 *   - profile: free_tests_used, corrections_balance
 *   - compras: si count > 0 → hasPaidAccess = true
 *   - tests anteriores: últimos 5 tests_generados completados
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFreeTemas, getOposicionFromProfile } from '@/lib/freemium'

export const metadata: Metadata = { title: 'Tests de práctica' }
import { TemaCard } from '@/components/tests/TemaCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardCheck, Lock, RefreshCw } from 'lucide-react'
import { RadarCard } from '@/components/tests/RadarCard'
import { RepasoButton } from '@/components/shared/RepasoButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(isoString: string): string {
  return new Date(isoString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getPuntuacionColor(puntuacion: number | null): string {
  if (puntuacion === null) return 'text-muted-foreground'
  if (puntuacion >= 70) return 'text-green-600'
  if (puntuacion >= 50) return 'text-amber-600'
  return 'text-red-600'
}

// ─── Tipos locales ─────────────────────────────────────────────────────────────

interface TestAnterior {
  id: string
  created_at: string
  puntuacion: number | null
  tipo: string
  tema_id: string | null
  // Joined from temas
  temas: { titulo: string } | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TestsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>
}) {
  const params = await (searchParams ?? Promise.resolve({} as Record<string, string>))
  const modoRadar = (params as Record<string, string>).modo === 'radar'
  const supabase = await createClient()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ── Obtener oposición del usuario ────────────────────────────────────────
  const oposicionId = await getOposicionFromProfile(supabase, user.id)

  // ── Fetch en paralelo — filtrar temas por oposición del usuario ─────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [temasResult, profileResult, comprasResult, testsResult, oposicionResult] = await Promise.all([
    supabase.from('temas').select('id, numero, titulo, descripcion').eq('oposicion_id', oposicionId).order('numero'),
    (supabase as any).from('profiles').select('free_tests_used, is_admin, is_founder').eq('id', user.id).single(),
    supabase
      .from('compras')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('oposicion_id', oposicionId),
    supabase
      .from('tests_generados')
      .select('id, created_at, puntuacion, tipo, tema_id, temas(titulo)')
      .eq('user_id', user.id)
      .eq('completado', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('oposiciones').select('slug').eq('id', oposicionId).single(),
  ])

  const temas = temasResult.data ?? []
  const prof = profileResult.data as { free_tests_used?: number; is_admin?: boolean; is_founder?: boolean } | null
  const freeTestsUsed = prof?.free_tests_used ?? 0
  const hasPaidAccess = (comprasResult.count ?? 0) > 0 || prof?.is_admin === true || prof?.is_founder === true
  const testsAnteriores = (testsResult.data ?? []) as TestAnterior[]
  const oposicionSlug = (oposicionResult.data as { slug?: string } | null)?.slug ?? 'aux-admin-estado'
  const freeTemas = getFreeTemas(oposicionSlug)

  // ── Agrupar temas por bloque ───────────────────────────────────────────────
  // Bloque I/II depende de la oposición; usamos el campo bloque de la BD cuando exista
  // C2: Bloque I = 1–16, II = 17–28 | C1: Bloque I = 1–37, II = 38–45
  const bloqueI = temas.filter((t) => t.numero <= (oposicionSlug === 'administrativo-estado' ? 37 : 16))
  const bloqueII = temas.filter((t) => t.numero > (oposicionSlug === 'administrativo-estado' ? 37 : 16))

  // ── Calcular tests gratuitos restantes ────────────────────────────────────
  const freeTestsRemaining = Math.max(0, 5 - freeTestsUsed)
  const freeLimitReached = !hasPaidAccess && freeTestsUsed >= 5

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tests de práctica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Genera tests personalizados con citas legales verificadas
        </p>
      </div>

      {/* Radar del Tribunal card — §2.14.4 (visible cuando viene de /radar) */}
      {modoRadar && (
        <RadarCard hasPaidAccess={hasPaidAccess} />
      )}

      {/* Banner freemium */}
      {!hasPaidAccess && (
        <FreemiumBanner
          freeTestsUsed={freeTestsUsed}
          freeTestsRemaining={freeTestsRemaining}
          freeLimitReached={freeLimitReached}
        />
      )}

      {/* Bloque I */}
      {bloqueI.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold">
              Bloque I — Organización Pública
            </h2>
            <Badge variant="secondary">{bloqueI.length} temas</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {bloqueI.map((tema) => (
              <TemaCard
                key={tema.id}
                tema={tema}
                hasPaidAccess={hasPaidAccess}
                freeTestsUsed={freeTestsUsed}

                isFreeAllowed={freeTemas.includes(tema.numero)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Bloque II */}
      {bloqueII.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold">
              Bloque II — Actividad Administrativa y Ofimática
            </h2>
            <Badge variant="secondary">{bloqueII.length} temas</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {bloqueII.map((tema) => (
              <TemaCard
                key={tema.id}
                tema={tema}
                hasPaidAccess={hasPaidAccess}
                freeTestsUsed={freeTestsUsed}

                isFreeAllowed={freeTemas.includes(tema.numero)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Estado vacío: no hay temas en BD */}
      {temas.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No hay temas disponibles aún. El equipo está cargando el temario.
          </p>
        </div>
      )}

      {/* Repasar errores — §repaso_errores */}
      {testsAnteriores.length > 0 && (
        <Card className="border-primary/20 bg-primary/3">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">Repasar mis errores</p>
                <p className="text-xs text-muted-foreground">
                  Test personalizado con las preguntas que has fallado. Gratis.
                </p>
              </div>
            </div>
            <RepasoButton />
          </CardContent>
        </Card>
      )}

      {/* Tests anteriores */}
      {testsAnteriores.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold">Tests anteriores</h2>
          <div className="space-y-2">
            {testsAnteriores.map((test) => (
              <TestAnteriorRow key={test.id} test={test} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Sub-componentes servidor ──────────────────────────────────────────────────

function FreemiumBanner({
  freeTestsUsed,
  freeTestsRemaining,
  freeLimitReached,
}: {
  freeTestsUsed: number
  freeTestsRemaining: number
  freeLimitReached: boolean
}) {
  if (freeLimitReached) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 pt-4 pb-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-amber-900">
              Has agotado tus 5 tests gratuitos
            </p>
            <p className="text-xs text-amber-700">
              Desbloquea acceso ilimitado a tests + correcciones de desarrollos con IA.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/cuenta"
                className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Ver planes
              </Link>
              <span className="self-center text-xs text-amber-600">
                Academia tradicional: desde 150€/mes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-blue-900">
            Tests gratuitos restantes
          </p>
          <span className="text-sm font-bold text-blue-700">
            {freeTestsRemaining} de 5
          </span>
        </div>
        {/* Barra de progreso */}
        <div className="h-2 w-full rounded-full bg-blue-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${(freeTestsUsed / 5) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-blue-700">
          {freeTestsRemaining > 0
            ? `Aprovecha tus ${freeTestsRemaining} test${freeTestsRemaining !== 1 ? 's' : ''} restante${freeTestsRemaining !== 1 ? 's' : ''} gratuito${freeTestsRemaining !== 1 ? 's' : ''}`
            : 'Último test gratuito — ¡úsalo bien!'}
        </p>
      </CardContent>
    </Card>
  )
}

function TestAnteriorRow({ test }: { test: TestAnterior }) {
  const titulo = test.temas?.titulo ?? 'Test general'
  const puntuacion = test.puntuacion
  const fecha = formatFecha(test.created_at)

  return (
    <Link
      href={`/tests/${test.id}`}
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-medium line-clamp-1">{titulo}</p>
          <p className="text-xs text-muted-foreground">{fecha}</p>
        </div>
      </div>
      {puntuacion !== null ? (
        <span className={`text-sm font-bold ${getPuntuacionColor(puntuacion)}`}>
          {puntuacion}%
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">En curso</span>
      )}
    </Link>
  )
}
