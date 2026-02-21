import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { logger } from '@/lib/logger'

/**
 * POST /api/ai/generate-test
 *
 * Genera un test de tipo test (preguntas tipo test) usando Claude.
 * Implementación completa en PLAN.md §1.10.
 *
 * Rate limit: 10 req / 1 m por usuario (directives/OPTEK_security.md §5)
 * Autenticación: requerida (Supabase auth)
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-test' })

  // ── 1. Autenticación ─────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado. Inicia sesión para continuar.' },
      { status: 401 }
    )
  }

  // ── 2. Rate limiting (0.10.12) ───────────────────────────────────────────
  const rateLimit = await checkRateLimit(user.id, 'ai-generate', 10, '1 m')
  if (!rateLimit.success) {
    log.warn({ userId: user.id, remaining: rateLimit.remaining }, 'Rate limit exceeded')
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos segundos.' },
      {
        status: 429,
        headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) },
      }
    )
  }

  // ── 3. Lógica pendiente de implementación (§1.10) ────────────────────────
  log.info({ userId: user.id }, 'generate-test called — not yet implemented')
  return NextResponse.json({ error: 'No implementado aún.' }, { status: 501 })
}
