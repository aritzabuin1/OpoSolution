'use client'

/**
 * components/dashboard/AnalysisStatsCard.tsx
 *
 * Stats card for AI analysis balance.
 * Shows "sin estrenar" with amber highlight if user has never used analysis.
 */

import { useState, useEffect } from 'react'
import { Sparkles, Zap } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'

const LS_KEY = 'oporuta_first_analysis_seen'

interface Props {
  balance: number
}

export function AnalysisStatsCard({ balance }: Props) {
  const [hasUsed, setHasUsed] = useState(true) // default to true to avoid flash

  useEffect(() => {
    try {
      setHasUsed(!!localStorage.getItem(LS_KEY))
    } catch { /* noop */ }
  }, [])

  const isUnused = !hasUsed && balance > 0

  return (
    <StatsCard
      icon={isUnused
        ? <Sparkles className="w-5 h-5 text-amber-500" />
        : <Zap className="w-5 h-5 text-purple-500" />
      }
      value={balance}
      label="Análisis"
      sub={isUnused ? 'sin estrenar' : 'disponibles'}
      valueClassName={isUnused ? 'text-amber-600' : undefined}
      className={isUnused ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' : undefined}
    />
  )
}
