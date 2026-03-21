'use client'

/**
 * components/shared/StickyAnalysisCTA.tsx
 *
 * Sticky bottom bar on mobile that prompts users to analyze their errors with AI.
 * Only visible on small screens (md:hidden). Scrolls to #analisis-ia panel.
 */

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StickyAnalysisCTAProps {
  numErrores: number
}

export function StickyAnalysisCTA({ numErrores }: StickyAnalysisCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const panel = document.getElementById('analisis-ia')
    if (!panel) return

    // Show sticky bar only when the panel is NOT in viewport
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(panel)
    return () => observer.disconnect()
  }, [])

  if (!visible) return null

  function scrollToPanel() {
    document.getElementById('analisis-ia')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="fixed bottom-0 inset-x-0 p-3 bg-background/95 backdrop-blur border-t md:hidden z-40">
      <Button onClick={scrollToPanel} className="w-full gap-2" size="sm">
        <Sparkles className="h-4 w-4" />
        Analizar mis {numErrores} error{numErrores !== 1 ? 'es' : ''} con IA
      </Button>
    </div>
  )
}
