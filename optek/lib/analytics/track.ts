/**
 * lib/analytics/track.ts
 *
 * Client-side helper for internal product analytics.
 * Tracks UI events (views, clicks) via POST /api/analytics/track.
 * Non-blocking, never throws — analytics should never break the app.
 */

type TrackEvent =
  | 'view:analysis-cta'
  | 'click:analysis-cta'
  | 'view:informe-simulacro-cta'
  | 'click:informe-simulacro-cta'
  | 'view:cazatrampas-analysis-cta'
  | 'click:cazatrampas-analysis-cta'
  | 'view:flashcard-analysis-cta'
  | 'click:flashcard-analysis-cta'

/** Fire-and-forget event tracking. Safe to call from any client component. */
export function trackEvent(event: TrackEvent): void {
  if (typeof window === 'undefined') return
  try {
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
      keepalive: true, // survives page navigations
    })
  } catch {
    // Never throw — analytics is best-effort
  }
}
