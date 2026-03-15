'use client'

/**
 * components/dashboard/FounderBetaBanner.tsx
 *
 * Banner para Founders: pide feedback de forma llamativa pero no invasiva.
 * Se puede cerrar y no vuelve a aparecer en la sesión.
 *
 * El botón de feedback abre el FeedbackButton modal (via custom event)
 * que envía el feedback por API → BD → email notification al admin.
 */

import { useState } from 'react'
import { MessageSquarePlus, X } from 'lucide-react'

const DISMISSED_KEY = 'oporuta_beta_banner_dismissed'

export function FounderBetaBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(DISMISSED_KEY) === '1'
  })

  if (dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem(DISMISSED_KEY, '1')
  }

  function handleOpenFeedback() {
    window.dispatchEvent(new CustomEvent('oporuta:open-feedback'))
  }

  return (
    <div className="relative rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 dark:border-amber-700 p-4 sm:p-5">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 rounded-full p-1 text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
        aria-label="Cerrar banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="w-10 h-10 rounded-lg bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center shrink-0">
          <MessageSquarePlus className="h-5 w-5 text-amber-700 dark:text-amber-300" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">
              Eres Fundador de OpoRuta
            </p>
            <span className="rounded-full bg-amber-200 dark:bg-amber-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              Fundador
            </span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            Tu opinión vale oro. Si encuentras un bug, algo que no funciona bien o tienes una idea
            para mejorar la plataforma, cuéntanoslo — estamos construyendo OpoRuta contigo.
          </p>
          <button
            onClick={handleOpenFeedback}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline mt-1 bg-amber-100 dark:bg-amber-800/40 rounded-md px-3 py-1.5 border border-amber-300 dark:border-amber-600 hover:bg-amber-200 dark:hover:bg-amber-800/60 transition-colors"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Enviar feedback
          </button>
        </div>
      </div>
    </div>
  )
}
