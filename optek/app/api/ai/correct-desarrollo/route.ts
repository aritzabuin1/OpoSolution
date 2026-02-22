import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { logger } from '@/lib/logger'

/**
 * POST /api/ai/correct-desarrollo
 *
 * Corrige un desarrollo escrito usando Claude Sonnet (ADR-0010).
 * Implementación real en §1.14.
 *
 * Lógica de acceso:
 *   Free:  máx 2 correcciones totales (RPC use_free_correction — atómico)
 *   Paid:  descuenta corrections_balance (RPC use_correction — atómico)
 *
 * 402 con `upsell` → el frontend muestra el modal de recarga.
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'correct-desarrollo' })

  // ── 1. Auth ──────────────────────────────────────────────────────────────
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

  // ── 2. Anti-spam (independiente de cuota) ────────────────────────────────
  const rateLimit = await checkRateLimit(user.id, 'ai-correct', 3, '1 m')
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      {
        status: 429,
        headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) },
      }
    )
  }

  // ── 3. Descontar corrección (atómico — previene race conditions) ─────────
  const serviceSupabase = await createServiceClient()

  // Primero intenta saldo de pago (corrections_balance)
  const { data: usedPaid } = await serviceSupabase.rpc('use_correction', {
    p_user_id: user.id,
  })

  if (!usedPaid) {
    // Sin saldo de pago — intenta cuota gratuita (free_corrector_used)
    const { data: usedFree } = await serviceSupabase.rpc('use_free_correction', {
      p_user_id: user.id,
    })

    if (!usedFree) {
      log.info({ userId: user.id }, 'Corrections exhausted — paywall')
      return NextResponse.json(
        {
          error: 'Has agotado tus correcciones disponibles.',
          code: 'PAYWALL_CORRECTIONS',
          upsell: [
            {
              id: 'recarga',
              name: 'Recarga de correcciones',
              price: '8,99€',
              description: '+15 correcciones IA',
            },
            {
              id: 'pack',
              name: 'Pack Oposición',
              price: '34,99€',
              description: 'Tests ilimitados + 20 correcciones + simulacros',
              badge: 'Más valor',
            },
          ],
        },
        { status: 402 }
      )
    }
  }

  // ── 4. Corrección (§1.14 — pendiente de pipeline RAG) ───────────────────
  log.info({ userId: user.id, usedPaid }, 'correct-desarrollo — RAG pendiente §1.14')
  return NextResponse.json({ error: 'Corrector en construcción.' }, { status: 501 })
}
