'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'

/**
 * Sticky CTA bar fixed to the bottom of the viewport on mobile.
 * Shows after 400px of scroll, hides if user dismisses it.
 * Only visible on screens < 768px (md breakpoint).
 */
export function StickyCTA() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('oporuta_sticky_cta_dismissed') === '1') {
      setDismissed(true)
      return
    }

    const handleScroll = () => {
      setVisible(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (dismissed) return null

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-gradient-to-r from-[#1B4F72] to-[#2563EB] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              5 tests gratis — sin tarjeta
            </p>
            <p className="text-white/70 text-xs truncate">
              Preguntas verificadas contra el BOE
            </p>
          </div>
          <Link
            href="/register"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0f2b46] text-sm font-bold px-4 py-2.5 transition-colors shadow-lg shadow-amber-500/20"
          >
            Prueba gratis
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => {
              setDismissed(true)
              sessionStorage.setItem('oporuta_sticky_cta_dismissed', '1')
            }}
            className="shrink-0 text-white/50 hover:text-white/80 transition-colors p-1"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
