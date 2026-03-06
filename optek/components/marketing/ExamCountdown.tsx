'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  examDate: string // YYYY-MM-DD
}

function calcDays(target: string): number {
  const now = new Date()
  const exam = new Date(target + 'T00:00:00')
  const diff = exam.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function ExamCountdown({ examDate }: Props) {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    setDays(calcDays(examDate))
    const interval = setInterval(() => setDays(calcDays(examDate)), 60_000)
    return () => clearInterval(interval)
  }, [examDate])

  if (days === null || days <= 0) return null

  const urgency = days <= 30 ? 'text-red-600 dark:text-red-400' : days <= 90 ? 'text-amber-600 dark:text-amber-400' : 'text-primary'

  return (
    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-dashed border-muted-foreground/40 bg-background/80 backdrop-blur px-4 py-2 text-sm font-medium">
      <Clock className={`h-4 w-4 ${urgency}`} />
      <span>
        Examen en <span className={`font-bold tabular-nums ${urgency}`}>{days}</span> {days === 1 ? 'día' : 'días'}
      </span>
    </div>
  )
}
