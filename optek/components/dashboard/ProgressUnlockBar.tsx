'use client'

import { CheckCircle2, Circle, Lock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ProgressUnlockBarProps {
  totalTests: number
}

const milestones = [
  { threshold: 0, label: 'Registro', short: 'Registro' },
  { threshold: 1, label: 'Primer test', short: '1 test' },
  { threshold: 3, label: '3 tests', short: '3 tests' },
  { threshold: 5, label: 'Dashboard completo', short: '5 tests' },
  { threshold: 10, label: 'IPR fiable', short: '10 tests' },
] as const

export function ProgressUnlockBar({ totalTests }: ProgressUnlockBarProps) {
  const currentIdx = milestones.findIndex((m) => totalTests < m.threshold)
  const activeIdx = currentIdx === -1 ? milestones.length : currentIdx

  const nextMilestone = milestones[activeIdx]
  const remaining = nextMilestone ? nextMilestone.threshold - totalTests : 0

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-sm font-semibold">
          {nextMilestone
            ? <>Siguiente desbloqueo: <span className="text-primary">{nextMilestone.label}</span> ({remaining} test{remaining !== 1 ? 's' : ''} más)</>
            : <span className="text-green-600">¡Todo desbloqueado!</span>
          }
        </p>
        {remaining > 0 && (
          <Button asChild size="sm" variant="outline" className="shrink-0 text-xs">
            <Link href="/tests">Hacer test →</Link>
          </Button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {milestones.map((m, i) => {
          const completed = i < activeIdx
          const isCurrent = i === activeIdx
          return (
            <div key={m.threshold} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                {completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isCurrent ? (
                  <Circle className="h-5 w-5 text-primary animate-pulse" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground/40" />
                )}
                <span className={`text-[10px] sm:text-xs text-center leading-tight ${
                  completed ? 'text-green-600 font-medium'
                  : isCurrent ? 'text-primary font-medium'
                  : 'text-muted-foreground/50'
                }`}>
                  {m.short}
                </span>
              </div>
              {i < milestones.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full ${
                  i < activeIdx ? 'bg-green-400' : 'bg-muted'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
