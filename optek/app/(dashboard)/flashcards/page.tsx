/**
 * app/(dashboard)/flashcards/page.tsx — §2.2.2
 *
 * Página de flashcards: mazos por tema con contador de pendientes hoy.
 * Server Component: carga flashcards desde Supabase.
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, BookOpen, Clock, Trophy } from 'lucide-react'
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
            {grupos.map((grupo) => (
              <Card key={grupo.tema_id ?? '__sin_tema__'} className="hover:border-primary/40 transition-colors">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Brain className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm font-medium truncate">{grupo.tema_titulo}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {grupo.pendientes > 0 && (
                        <Badge variant="default" className="text-[10px] bg-primary">
                          {grupo.pendientes} hoy
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        {grupo.total} total
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
