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
import { getOposicionFromProfile, getFreeTemaStatus } from '@/lib/freemium'

export const metadata: Metadata = { title: 'Tests de práctica' }
import { TemaCard } from '@/components/tests/TemaCard'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardCheck, RefreshCw } from 'lucide-react'
import { RadarCard } from '@/components/tests/RadarCard'
import { RepasoButton } from '@/components/shared/RepasoButton'
import { AIGenerationBanner } from '@/components/shared/AIGenerationBanner'
import { Suspense } from 'react'
import { PurchaseTracker } from '@/components/analytics/PurchaseTracker'

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
    (supabase as any).from('temas').select('id, numero, titulo, descripcion, bloque').eq('oposicion_id', oposicionId).order('numero') as Promise<{ data: { id: string; numero: number; titulo: string; descripcion: string | null; bloque?: string }[] | null }>,
    (supabase as any).from('profiles').select('free_tests_used, is_admin').eq('id', user.id).single(),
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
      .eq('oposicion_id', oposicionId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('oposiciones').select('slug').eq('id', oposicionId).single(),
  ])

  const temas = temasResult.data ?? []
  const prof = profileResult.data as { free_tests_used?: number; is_admin?: boolean } | null
  const hasPaidAccess = (comprasResult.count ?? 0) > 0 || prof?.is_admin === true
  const testsAnteriores = (testsResult.data ?? []) as TestAnterior[]
  const oposicionSlug = (oposicionResult.data as { slug?: string } | null)?.slug ?? 'aux-admin-estado'

  // Free tier v2: get per-tema completion status
  const freeStatus = hasPaidAccess
    ? new Map<string, { completed: boolean; score: number | null; testId: string | null }>()
    : await getFreeTemaStatus(supabase, user.id, oposicionId)
  const temasCompleted = freeStatus.size
  const totalTemas = temas.length

  // ── Agrupar temas por bloque (dinámico, funciona con cualquier oposición) ──
  type TemaWithBloque = typeof temas[number] & { bloque?: string }
  const bloqueGroups = new Map<string, typeof temas>()
  for (const tema of temas) {
    const bloque = (tema as TemaWithBloque).bloque ?? (tema.numero <= 15 ? 'I' : 'II')
    if (!bloqueGroups.has(bloque)) bloqueGroups.set(bloque, [])
    bloqueGroups.get(bloque)!.push(tema)
  }
  // Backward compat: bloqueI/bloqueII for the 2-bloque case
  const bloqueI = bloqueGroups.get('I') ?? []
  const bloqueII = bloqueGroups.get('II') ?? []

  // ── Free tier v2: temas explorados ────────────────────────────────────────
  const temasRemaining = Math.max(0, totalTemas - temasCompleted)

  // ── "Recomendado para ti": weakest tema or next unexplored ───────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allCompletedTests } = await (supabase as any)
    .from('tests_generados')
    .select('tema_id, puntuacion')
    .eq('user_id', user.id)
    .eq('completado', true)
    .eq('oposicion_id', oposicionId)
    .not('tema_id', 'is', null)
    .limit(200)

  const temaScoreMap: Record<string, { sum: number; count: number }> = {}
  for (const t of (allCompletedTests ?? []) as Array<{ tema_id: string; puntuacion: number }>) {
    if (t.puntuacion == null) continue
    if (!temaScoreMap[t.tema_id]) temaScoreMap[t.tema_id] = { sum: 0, count: 0 }
    temaScoreMap[t.tema_id].sum += t.puntuacion
    temaScoreMap[t.tema_id].count++
  }

  let recommendedTema: { id: string; numero: number; titulo: string; reason: string } | null = null
  // Priority 1: weakest tema with avg < 60%
  const temasWithScores = temas.map(t => ({ ...t, avg: temaScoreMap[t.id] ? Math.round(temaScoreMap[t.id].sum / temaScoreMap[t.id].count) : null }))
  const weakest = temasWithScores.filter(t => t.avg !== null && t.avg < 60).sort((a, b) => a.avg! - b.avg!)
  if (weakest.length > 0) {
    recommendedTema = { id: weakest[0].id, numero: weakest[0].numero, titulo: weakest[0].titulo, reason: `Tu punto débil — ${weakest[0].avg}%` }
  } else {
    // Priority 2: next unexplored tema
    const exploredIds = new Set(Object.keys(temaScoreMap))
    const unexplored = temas.filter(t => !exploredIds.has(t.id))
    if (unexplored.length > 0) {
      recommendedTema = { id: unexplored[0].id, numero: unexplored[0].numero, titulo: unexplored[0].titulo, reason: 'Siguiente tema por explorar' }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Track purchase conversion from Stripe success redirect */}
      <Suspense fallback={null}><PurchaseTracker /></Suspense>

      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tests de práctica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Genera tests personalizados con citas legales verificadas
        </p>
      </div>

      {/* Banner IA */}
      <AIGenerationBanner />

      {/* Radar del Tribunal card — §2.14.4 (visible cuando viene de /radar) */}
      {modoRadar && (
        <RadarCard hasPaidAccess={hasPaidAccess} />
      )}

      {/* Banner freemium v2: temas explorados */}
      {!hasPaidAccess && (
        <FreemiumBanner
          temasCompleted={temasCompleted}
          totalTemas={totalTemas}
          temasRemaining={temasRemaining}
          oposicionSlug={oposicionSlug}
        />
      )}

      {/* Recomendado para ti — TemaCard completo con badge */}
      {recommendedTema && (() => {
        const tema = temas.find(t => t.id === recommendedTema.id)
        if (!tema) return null
        return (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-primary">Recomendado para ti</p>
              <Badge variant="outline" className="text-xs">{recommendedTema.reason}</Badge>
            </div>
            <TemaCard
              tema={tema}
              hasPaidAccess={hasPaidAccess}
              freeCompleted={freeStatus.get(tema.id)?.completed ?? false}
              freeScore={freeStatus.get(tema.id)?.score ?? null}
            />
          </div>
        )
      })()}

      {/* Todos los bloques — dinámico, funciona con 2 bloques (C2/C1) o 6 bloques (A2) */}
      {[...bloqueGroups.entries()].map(([bloque, bloqueItems]) => (
        <section key={bloque}>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-base font-semibold">
              Bloque {bloque}
            </h2>
            <Badge variant="secondary">{bloqueItems.length} temas</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {bloqueItems.map((tema) => (
              <div key={tema.id} id={`tema-${tema.numero}`}>
              <TemaCard
                tema={tema}
                hasPaidAccess={hasPaidAccess}
                freeCompleted={freeStatus.get(tema.id)?.completed ?? false}
                freeScore={freeStatus.get(tema.id)?.score ?? null}
              />
              </div>
            ))}
          </div>
        </section>
      ))}

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
  temasCompleted,
  totalTemas,
  temasRemaining,
  oposicionSlug,
}: {
  temasCompleted: number
  totalTemas: number
  temasRemaining: number
  oposicionSlug: string
}) {
  const checkoutHref = oposicionSlug === 'gestion-estado'
    ? '/cuenta?plan=pack_a2'
    : '/cuenta'
  const pct = totalTemas > 0 ? Math.round((temasCompleted / totalTemas) * 100) : 0

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-blue-900">
            Temas explorados
          </p>
          <span className="text-sm font-bold text-blue-700">
            {temasCompleted} de {totalTemas}
          </span>
        </div>
        {/* Barra de progreso */}
        <div className="h-2 w-full rounded-full bg-blue-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-blue-700">
          {temasRemaining > 0
            ? `1 test gratuito en cada tema · Te quedan ${temasRemaining} temas por explorar`
            : 'Has explorado todos los temas. Desbloquea tests ilimitados para mejorar tus puntos débiles.'
          }
        </p>
        {temasCompleted >= 5 && (
          <Link
            href={checkoutHref}
            className="mt-3 inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Desbloquear tests ilimitados
          </Link>
        )}
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
