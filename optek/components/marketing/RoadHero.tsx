'use client'

/**
 * RoadHero — Timeline animada del camino del opositor.
 *
 * 4 hitos con iconos, labels grandes y línea de progreso animada.
 * Reemplaza la ilustración SVG anterior por un diseño limpio y profesional.
 *
 * Branding: navy #1B4F72, dorado #F39C12
 */

import { useEffect, useRef, useState } from 'react'
import { Compass, Target, TrendingUp, Trophy } from 'lucide-react'

const STEPS = [
  { Icon: Compass, label: 'Descubre', desc: 'Qué pregunta el tribunal' },
  { Icon: Target, label: 'Practica', desc: 'Tests con citas verificadas' },
  { Icon: TrendingUp, label: 'Mejora', desc: 'Tu progreso, medido' },
  { Icon: Trophy, label: 'Aprueba', desc: 'Tu plaza te espera' },
]

export function RoadHero() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) setVisible(true) },
      { threshold: 0.2 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full max-w-3xl mx-auto mt-14 px-2 sm:px-4" aria-hidden="true">
      <div className="relative pt-2 pb-2">
        {/* ── Track (background line) ── */}
        <div className="absolute top-[30px] sm:top-[38px] left-[12.5%] right-[12.5%] h-[3px] rounded-full bg-border/50" />

        {/* ── Animated progress line ── */}
        <div className="absolute top-[30px] sm:top-[38px] left-[12.5%] right-[12.5%] h-[3px] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full road-line"
            style={{
              width: visible ? '100%' : '0%',
              transition: 'width 2.5s cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          />
        </div>

        {/* ── Steps ── */}
        <div className="relative flex justify-between">
          {STEPS.map((step, i) => {
            const isFinal = i === STEPS.length - 1
            const delay = 0.5 + i * 0.5

            return (
              <div
                key={step.label}
                className="flex flex-col items-center w-1/4"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
                  transitionDelay: `${delay}s`,
                }}
              >
                {/* Node circle */}
                <div className="relative">
                  {/* Glow ring (final step only) */}
                  {isFinal && (
                    <div
                      className="absolute -inset-2 rounded-full bg-amber-400/20"
                      style={{
                        opacity: visible ? 1 : 0,
                        transition: 'opacity 0.5s ease',
                        transitionDelay: '2.8s',
                        animation: visible ? 'road-pulse 2.5s ease-in-out infinite 3s' : 'none',
                      }}
                    />
                  )}

                  <div
                    className={`relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-700
                      ${isFinal
                        ? 'w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 to-amber-500 border-amber-300 text-white shadow-lg shadow-amber-400/30'
                        : 'w-11 h-11 sm:w-14 sm:h-14 bg-background border-muted-foreground/25 text-muted-foreground'
                      }`}
                    style={{ transitionDelay: `${delay}s` }}
                  >
                    <step.Icon className={isFinal ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-4 h-4 sm:w-6 sm:h-6'} />
                  </div>
                </div>

                {/* Label */}
                <span
                  className={`mt-2.5 sm:mt-3 text-xs sm:text-base font-bold tracking-tight
                    ${isFinal ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}
                >
                  {step.label}
                </span>

                {/* Description (hidden on very small screens) */}
                <span className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground text-center leading-tight hidden sm:block">
                  {step.desc}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .road-line {
          background: linear-gradient(90deg, #94A3B8 0%, #1B4F72 45%, #F59E0B 100%);
        }
        @keyframes road-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
