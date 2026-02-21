/**
 * Service Worker OPTEK — Serwist (App Router entry point)
 *
 * Precacha todos los assets de Next.js en build de producción.
 * Compilado por @serwist/next → public/sw.js.
 * Desactivado en desarrollo (next.config.ts: applyPWA es no-op en development).
 *
 * Estrategia: precaching de assets estáticos, NetworkOnly para API routes.
 */
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // API routes: NUNCA cachear — datos en tiempo real
      matcher: /^https?:\/\/[^/]+\/api\/.*/i,
      handler: new NetworkOnly(),
    },
  ],
})

serwist.addEventListeners()
