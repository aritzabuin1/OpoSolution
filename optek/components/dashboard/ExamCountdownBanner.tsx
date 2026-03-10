'use client'

/**
 * ExamCountdownBanner — Banner de urgencia con countdown al examen.
 *
 * Cambia de tono segun la distancia al examen:
 * - >180 dias: tranquilo (azul), mensaje motivacional
 * - 90-180: proactivo (navy), "buen momento para coger ritmo"
 * - 30-90: urgente (ambar), "la recta final"
 * - 7-30: alta urgencia (naranja), countdown grande
 * - <7: maximo (rojo), "ya casi estas"
 *
 * Incluye una micro-carretera SVG animada que recorre el banner.
 */

import Link from 'next/link'
import { ArrowRight, Calendar, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExamCountdownBannerProps {
  diasRestantes: number
  /** Nombre del usuario (para personalizar) */
  nombre?: string
}

function getConfig(dias: number) {
  if (dias <= 0) {
    return {
      bg: 'bg-gradient-to-r from-green-600 to-emerald-600',
      text: 'text-white',
      subtext: 'text-green-100',
      badge: 'bg-white/20 text-white',
      headline: 'El dia ha llegado',
      message: 'Todo lo que has trabajado te ha traido hasta aqui. Confia en tu preparacion.',
      cta: null,
      ctaClass: '',
    }
  }
  if (dias <= 7) {
    return {
      bg: 'bg-gradient-to-r from-red-600 to-rose-600',
      text: 'text-white',
      subtext: 'text-red-100',
      badge: 'bg-white/20 text-white',
      headline: 'Ya casi estas',
      message: 'Confia en todo lo que has trabajado. Estos ultimos dias, repasa lo clave.',
      cta: 'Repasar errores',
      ctaClass: 'bg-white text-red-700 hover:bg-red-50',
    }
  }
  if (dias <= 30) {
    return {
      bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
      text: 'text-white',
      subtext: 'text-orange-100',
      badge: 'bg-white/20 text-white',
      headline: 'La recta final',
      message: 'Cada test que hagas ahora vale por tres. Prioriza tus puntos debiles.',
      cta: 'Practicar ahora',
      ctaClass: 'bg-white text-orange-700 hover:bg-orange-50',
    }
  }
  if (dias <= 90) {
    return {
      bg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      text: 'text-amber-950',
      subtext: 'text-amber-800',
      badge: 'bg-amber-950/10 text-amber-900',
      headline: 'Todavia estas a tiempo de conseguirlo',
      message: 'Los que aprueban son los que entrenan cada dia. Tu puedes ser uno de ellos.',
      cta: 'Generar test',
      ctaClass: 'bg-amber-900 text-white hover:bg-amber-950',
    }
  }
  if (dias <= 180) {
    return {
      bg: 'bg-gradient-to-r from-[#1B4F72] to-[#2471A3]',
      text: 'text-white',
      subtext: 'text-blue-200',
      badge: 'bg-white/15 text-white',
      headline: 'Buen momento para coger ritmo',
      message: 'Tienes tiempo suficiente para prepararte bien. La constancia marca la diferencia.',
      cta: 'Empezar hoy',
      ctaClass: 'bg-white text-[#1B4F72] hover:bg-blue-50',
    }
  }
  return {
    bg: 'bg-gradient-to-r from-[#1B4F72] to-[#154360]',
    text: 'text-white',
    subtext: 'text-blue-200',
    badge: 'bg-white/10 text-white',
    headline: 'Tu camino empieza hoy',
    message: 'Tienes tiempo de sobra. Empieza con calma, construye el habito, y llegaras preparado.',
    cta: 'Empezar',
    ctaClass: 'bg-white text-[#1B4F72] hover:bg-blue-50',
  }
}

export function ExamCountdownBanner({ diasRestantes, nombre }: ExamCountdownBannerProps) {
  const config = getConfig(diasRestantes)
  const ctaHref = '/tests'

  return (
    <div className={`relative overflow-hidden rounded-xl ${config.bg} p-4 sm:p-5`}>
      {/* Mini carretera SVG decorativa en background */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none"
        viewBox="0 0 800 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 0 70 C 100 70, 150 30, 250 40 C 350 50, 400 80, 500 60 C 600 40, 650 20, 800 30"
          stroke="white"
          strokeWidth="3"
          fill="none"
          strokeDasharray="8 12"
        />
      </svg>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Countdown number */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex flex-col items-center justify-center">
            <span className={`text-3xl sm:text-4xl font-black tabular-nums leading-none ${config.text} ${diasRestantes <= 30 ? 'animate-pulse' : ''}`}>
              {diasRestantes}
            </span>
            <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider mt-0.5 ${config.subtext}`}>
              {diasRestantes === 1 ? 'dia' : 'dias'}
            </span>
          </div>

          {/* Separador visual */}
          <div className={`hidden sm:block w-px h-12 ${diasRestantes <= 30 ? 'bg-white/30' : 'bg-white/20'}`} />
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm sm:text-base font-bold leading-tight ${config.text}`}>
              {nombre ? `${nombre}, ` : ''}{config.headline}
            </p>
            {diasRestantes <= 30 && diasRestantes > 0 && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${config.badge}`}>
                <Calendar className="h-3 w-3" />
                Cuenta atras
              </span>
            )}
          </div>
          <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${config.subtext}`}>
            {config.message}
          </p>
        </div>

        {/* CTA */}
        {config.cta && (
          <Link href={ctaHref} className="shrink-0">
            <Button
              size="sm"
              variant="secondary"
              className={`gap-1.5 font-semibold shadow-md ${config.ctaClass}`}
            >
              {config.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}

        {/* Flag icon (destino) */}
        <Flag className={`absolute top-3 right-3 h-4 w-4 ${config.subtext} opacity-40 hidden sm:block`} />
      </div>

      {/* Progress bar sutil: cuanto del camino queda (asumiendo 365 dias max) */}
      {diasRestantes > 0 && diasRestantes <= 365 && (
        <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/30 transition-all duration-1000"
            style={{ width: `${Math.max(5, 100 - (diasRestantes / 365) * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
