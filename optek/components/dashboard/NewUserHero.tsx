'use client'

import Link from 'next/link'
import { Compass, CheckCircle2, TrendingUp, Brain, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NewUserHeroProps {
  diasParaExamen: number | null
}

export function NewUserHero({ diasParaExamen }: NewUserHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-[#0f2b46] via-[#1a4a7a] to-[#2563eb] p-6 sm:p-8 text-white">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Compass className="h-8 w-8 text-amber-400 shrink-0" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Tu camino empieza aquí
          </h2>
        </div>

        <p className="text-sm sm:text-base text-white/80 max-w-xl">
          Genera tu primer test para desbloquear el dashboard completo.
          {diasParaExamen !== null && diasParaExamen > 0 && (
            <> Quedan <strong className="text-amber-300">{diasParaExamen} días</strong> para el examen.</>
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
            Tu Índice de Preparación personalizado
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400 shrink-0" />
            Mapa de temas fuertes y débiles
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-amber-400 shrink-0" />
            Flashcards automáticas de tus errores
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-400 shrink-0" />
            Plan de estudio generado con IA
          </div>
        </div>

        <div>
          <Button
            asChild
            size="lg"
            className="bg-amber-500 hover:bg-amber-400 text-[#0f2b46] font-bold shadow-lg shadow-amber-500/20"
          >
            <Link href="/tests">Generar mi primer test →</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
