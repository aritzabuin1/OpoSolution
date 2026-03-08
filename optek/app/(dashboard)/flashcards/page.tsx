/**
 * app/(dashboard)/flashcards/page.tsx — §2.2.2
 *
 * Página de flashcards: mazos por tema con contador de pendientes hoy.
 * Server Component: carga flashcards desde Supabase.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Mis Flashcards' }
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, BookOpen, CheckCircle2, Clock, Lock, Trophy } from 'lucide-react'
import { FlashcardSessionStarter } from '@/components/flashcards/FlashcardSessionStarter'

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface FlashcardRow {
  id: string
  frente: string
  reverso: string
  cita_legal: unknown
  intervalo_dias: number
  veces_acertada: number
  veces_fallada: number
  siguiente_repaso: string
  tema_id: string | null
  temas: { titulo: string } | null
}

interface TemaGroup {
  tema_id: string | null
  tema_titulo: string
  total: number
  pendientes: number
  cards: FlashcardRow[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FlashcardsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check premium status (compra OR admin OR founder)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: compra }, { data: profileData }] = await Promise.all([
    supabase.from('compras').select('id').eq('user_id', user.id).limit(1),
    (supabase as any).from('profiles').select('is_admin, is_founder').eq('id', user.id).single(),
  ])
  const prof = profileData as { is_admin?: boolean; is_founder?: boolean } | null
  const isPaid = (compra?.length ?? 0) > 0 || prof?.is_admin === true || prof?.is_founder === true

  // Free users: show premium teaser
  if (!isPaid) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
            <Lock className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">Flashcards de Repaso Espaciado</h1>
            <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-xs">Premium</Badge>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Cada test que haces genera automaticamente flashcards de tus errores.
            El algoritmo de repaso espaciado se adapta a tu ritmo para que no olvides lo importante.
          </p>
        </div>

        <div className="text-left max-w-sm mx-auto space-y-2.5">
          {[
            'Generacion automatica desde tus errores en tests',
            'Algoritmo de repaso espaciado (no olvidas nada)',
            'Organizacion por temas del temario',
            'Seguimiento de progreso por mazo',
            'Citas legales incluidas en cada tarjeta',
          ].map((b) => (
            <div key={b} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span className="text-sm">{b}</span>
            </div>
          ))}
        </div>

        {/* Sample preview */}
        <div className="relative max-w-sm mx-auto">
          <div className="rounded-xl border bg-card p-4 space-y-2 blur-[2px] select-none pointer-events-none">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Tema 3: Gobierno y Administracion</span>
            </div>
            <div className="h-24 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
              Segun el art. 97 CE, el Gobierno dirige la politica...
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="h-8 w-8 text-amber-500/80" />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
            <span className="line-through text-destructive/60">Academia presencial: desde 150 EUR/mes</span>
            {' · '}
            <span className="font-semibold text-foreground">OpoRuta: 49,99 EUR una sola vez</span>
          </div>
          <Button asChild size="lg" className="w-full max-w-xs">
            <Link href="/cuenta">Desbloquear Pack Oposicion</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Pago seguro con Stripe · Sin suscripcion · Sin caducidad
          </p>
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]!

  // Cargar todas las flashcards del usuario con info del tema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: flashcards } = await (supabase as any)
    .from('flashcards')
    .select('id, frente, reverso, cita_legal, intervalo_dias, veces_acertada, veces_fallada, siguiente_repaso, tema_id, temas(titulo)')
    .eq('user_id', user.id)
    .order('siguiente_repaso', { ascending: true })

  const rows = (flashcards ?? []) as FlashcardRow[]

  // Calcular pendientes hoy
  const pendientesHoy = rows.filter((c) => c.siguiente_repaso <= today)

  // Agrupar por tema
  const groupMap = new Map<string, TemaGroup>()
  for (const card of rows) {
    const key = card.tema_id ?? '__sin_tema__'
    const titulo = (card.temas as { titulo: string } | null)?.titulo ?? 'Sin tema'
    if (!groupMap.has(key)) {
      groupMap.set(key, { tema_id: card.tema_id, tema_titulo: titulo, total: 0, pendientes: 0, cards: [] })
    }
    const group = groupMap.get(key)!
    group.total++
    group.cards.push({ ...card, temas: card.temas })
    if (card.siguiente_repaso <= today) group.pendientes++
  }

  const grupos = Array.from(groupMap.values()).sort((a, b) => b.pendientes - a.pendientes)

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-12">
      {/* Cabecera */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Mis flashcards</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Repasa las tarjetas generadas automáticamente desde tus errores en tests.
        </p>
      </div>

      {/* Resumen: pendientes hoy */}
      {pendientesHoy.length > 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {pendientesHoy.length === 1
                      ? '1 flashcard pendiente'
                      : `${pendientesHoy.length} flashcards pendientes`}
                    {' '}para hoy
                  </p>
                  <p className="text-xs text-muted-foreground">Dedica 5 minutos al repaso diario</p>
                </div>
              </div>
              <FlashcardSessionStarter
                flashcards={pendientesHoy.map((c) => ({
                  id: c.id,
                  frente: c.frente,
                  reverso: c.reverso,
                  cita_legal: c.cita_legal as FlashcardRow['cita_legal'] as never,
                  intervalo_dias: c.intervalo_dias,
                  veces_acertada: c.veces_acertada,
                  veces_fallada: c.veces_fallada,
                  tema_titulo: (c.temas as { titulo: string } | null)?.titulo,
                }))}
              />
            </div>
          </CardContent>
        </Card>
      ) : rows.length > 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-sm text-green-800">¡Al día con el repaso!</p>
              <p className="text-xs text-green-700">No tienes flashcards pendientes para hoy.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Sin flashcards todavía */}
      {rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-muted-foreground/30 p-8 text-center space-y-3">
          <Brain className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">No tienes flashcards aún</p>
          <p className="text-sm text-muted-foreground">
            Las flashcards se crean automáticamente cuando fallas preguntas en los tests.
            ¡Practica con un test y vuelve aquí!
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/tests">
              <BookOpen className="mr-2 h-4 w-4" />
              Ir a Tests
            </Link>
          </Button>
        </div>
      )}

      {/* Mazos por tema */}
      {grupos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Mazos por tema
          </h2>
          <div className="space-y-2">
            {grupos.map((grupo) => {
              const pendientesDeEsteMazo = grupo.cards
                .filter((c) => c.siguiente_repaso <= today)
                .map((c) => ({
                  id: c.id,
                  frente: c.frente,
                  reverso: c.reverso,
                  cita_legal: c.cita_legal as { ley: string; articulo: string; texto_ref: string } | null,
                  intervalo_dias: c.intervalo_dias,
                  veces_acertada: c.veces_acertada,
                  veces_fallada: c.veces_fallada,
                  tema_titulo: (c.temas as { titulo: string } | null)?.titulo,
                }))
              return (
                <Card key={grupo.tema_id ?? '__sin_tema__'} className="hover:border-primary/40 transition-colors">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Brain className="h-4 w-4 text-primary shrink-0" />
                        <p className="text-sm font-medium truncate">{grupo.tema_titulo}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {grupo.pendientes > 0 ? (
                          <>
                            <Badge variant="default" className="text-[10px] bg-primary">
                              {grupo.pendientes} hoy
                            </Badge>
                            <FlashcardSessionStarter
                              flashcards={pendientesDeEsteMazo}
                              label={`Repasar ${grupo.pendientes}`}
                              variant="outline"
                            />
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50 border-green-200">
                            ✓ Al día
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {grupo.total}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
