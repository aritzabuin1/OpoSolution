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

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TemaCard } from '@/components/tests/TemaCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardCheck, Lock } from 'lucide-react'

// ─── Mapping estático: ley_codigo → números de tema que cubre ─────────────────
// Se actualiza cuando se indexan nuevas leyes en data/legislacion/
const LEY_A_TEMAS: Record<string, number[]> = {
  CE:            [1],
  LOTC:          [2],
  LOPJ:          [4],
  LGOB:          [5],
  TRANSPARENCIA: [7],
  LPAC:          [11],
  LRJSP:         [11],
  LOPDGDD:       [12],
  TREBEP:        [13, 14],
  LGP:           [15],
  LGTBI:         [16],
  LOIGUALDAD:    [16],
  LOVIGEN:       [16],
  LCSP:          [],
}

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

export default async function TestsPage() {
  const supabase = await createClient()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ── Fetch en paralelo ─────────────────────────────────────────────────────
  const [temasResult, profileResult, comprasResult, testsResult, legislacionResult] = await Promise.all([
    supabase.from('temas').select('id, numero, titulo, descripcion').order('numero'),
    supabase.from('profiles').select('free_tests_used').eq('id', user.id).single(),
    supabase
      .from('compras')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('tests_generados')
      .select('id, created_at, puntuacion, tipo, tema_id, temas(titulo)')
      .eq('user_id', user.id)
      .eq('completado', true)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('legislacion')
      .select('ley_codigo', { count: 'exact' })
      .limit(50),
  ])

  const temas = temasResult.data ?? []
  const freeTestsUsed = profileResult.data?.free_tests_used ?? 0
  const hasPaidAccess = (comprasResult.count ?? 0) > 0
  const testsAnteriores = (testsResult.data ?? []) as TestAnterior[]

  // Construir Set de números de tema con legislación indexada
  const leyCodigos = new Set(
    (legislacionResult.data ?? []).map((r) => r.ley_codigo)
  )
  const temasConLegislacion = new Set<number>()
  for (const [ley, nums] of Object.entries(LEY_A_TEMAS)) {
    if (leyCodigos.has(ley)) {
      for (const n of nums) temasConLegislacion.add(n)
    }
  }

  // ── Agrupar temas por bloque ───────────────────────────────────────────────
  // Bloque I = temas 1–16 (Organización Pública)
  // Bloque II = temas 17–28 (Actividad Administrativa y Ofimática)
  const bloqueI = temas.filter((t) => t.numero <= 16)
  const bloqueII = temas.filter((t) => t.numero > 16)

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
                hasLegislacion={temasConLegislacion.has(tema.numero)}
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
                hasLegislacion={temasConLegislacion.has(tema.numero)}
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
