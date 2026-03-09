'use client'

/**
 * components/dashboard/FounderBetaBanner.tsx
 *
 * Banner para Founders durante la fase BETA.
 * Pide feedback de forma llamativa pero no invasiva.
 * Se puede cerrar y no vuelve a aparecer en la sesión.
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
              Estás en la Beta de OpoRuta
            </p>
            <span className="rounded-full bg-amber-200 dark:bg-amber-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
              Fundador
            </span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            Como miembro fundador, tu opinión vale oro. Si encuentras un bug, algo que no funciona
            bien o tienes una idea para mejorar la plataforma, cuéntanoslo — estamos construyendo
            OpoRuta contigo. Usa el botón de feedback (abajo a la derecha) o escríbenos directamente.
          </p>
          <a
            href="mailto:aritzabuin1@gmail.com?subject=Feedback%20OpoRuta%20Beta"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline mt-1"
          >
            <MessageSquarePlus className="h-3 w-3" />
            Enviar feedback por email
          </a>
        </div>
      </div>
    </div>
  )
}
