'use client'

import { useEffect } from 'react'

/**
 * GeoTracker — Detecta tráfico desde buscadores IA (Perplexity, ChatGPT, Gemini, Claude)
 * y envía un evento a dataLayer para tracking en GTM/GA4.
 *
 * Evento: { event: 'geo_referral', geo_source: 'perplexity' | 'chatgpt' | 'gemini' | 'claude' | ... }
 *
 * En GA4: crear un evento personalizado "geo_referral" con parámetro "geo_source"
 * para medir cuánto tráfico viene de LLMs.
 */

const GEO_SOURCES: Record<string, string> = {
  'perplexity.ai': 'perplexity',
  'chat.openai.com': 'chatgpt',
  'chatgpt.com': 'chatgpt',
  'gemini.google.com': 'gemini',
  'claude.ai': 'claude',
  'copilot.microsoft.com': 'copilot',
  'you.com': 'you',
  'phind.com': 'phind',
}

export function GeoTracker() {
  useEffect(() => {
    try {
      const ref = document.referrer
      if (!ref) return

      const hostname = new URL(ref).hostname
      for (const [domain, source] of Object.entries(GEO_SOURCES)) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          // Send event via gtag (GA4 direct) + dataLayer (GTM fallback)
          const w = window as typeof window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
          w.dataLayer = w.dataLayer || []
          // gtag direct → GA4 recibe el evento sin necesidad de GTM
          if (w.gtag) {
            w.gtag('event', 'geo_referral', { geo_source: source, geo_referrer: ref })
          } else {
            // Fallback: push to dataLayer (funciona si GTM está configurado)
            function gtag(...args: unknown[]) { w.dataLayer!.push(args) }
            gtag('event', 'geo_referral', { geo_source: source, geo_referrer: ref })
          }

          // Also store in sessionStorage for SPA navigation
          sessionStorage.setItem('geo_source', source)
          return
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [])

  return null
}
