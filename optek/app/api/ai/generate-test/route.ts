import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { logger } from '@/lib/logger'

/**
 * POST /api/ai/generate-test
 *
 * Genera un test MCQ usando Claude Haiku (tests ilimitados, ADR-0010).
 * Implementación real del RAG en §1.10.
 *
 * Lógica de acceso:
 *   Free:  máx 5 tests en total (RPC use_free_test — atómico)
 *   Paid:  ilimitados + límite silencioso 20/día vía Upstash
 *
 * 402 con `upsell` → el frontend muestra el modal de compra.
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? globalThis.crypto.randomUUID()
  const log = logger.child({ requestId, endpoint: 'generate-test' })

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

  // ── 2. ¿Tiene acceso de pago? (cualquier compra previa) ──────────────────
  const { count: purchaseCount } = await supabase
    .from('compras')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const hasPaidAccess = (purchaseCount ?? 0) > 0

  // ── 3. Control de acceso ─────────────────────────────────────────────────
  if (hasPaidAccess) {
    // Usuarios de pago: límite silencioso 20 tests/día
    const rateLimit = await checkRateLimit(user.id, 'ai-generate-daily', 20, '24 h')
    if (!rateLimit.success) {
      log.warn({ userId: user.id }, 'Daily test limit reached (paid user)')
      return NextResponse.json(
        { error: 'Has alcanzado el límite diario de 20 tests. Vuelve mañana.' },
        {
          status: 429,
          headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) },
        }
      )
    }
  } else {
    // Usuarios free: máx 5 tests en total (atómico en BD)
    const serviceSupabase = await createServiceClient()
    const { data: allowed } = await serviceSupabase.rpc('use_free_test', {
      p_user_id: user.id,
    })

    if (!allowed) {
      log.info({ userId: user.id }, 'Free test quota exhausted — paywall')
      return NextResponse.json(
        {
          error: 'Has agotado tus 5 tests gratuitos.',
          code: 'PAYWALL_TESTS',
          upsell: [
            {
              id: 'tema',
              name: 'Por tema',
              price: '4,99€',
              description: 'Tests ilimitados de un tema + 5 correcciones',
            },
            {
              id: 'pack',
              name: 'Pack Oposición',
              price: '34,99€',
              description: 'Tests ilimitados de todo el temario + 20 correcciones',
              badge: 'Más popular',
            },
          ],
        },
        { status: 402 }
      )
    }

    // Anti-spam usuarios free
    const rateLimit = await checkRateLimit(user.id, 'ai-generate', 5, '1 m')
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento.' },
        {
          status: 429,
          headers: { 'Retry-After': buildRetryAfterHeader(rateLimit.resetAt) },
        }
      )
    }
  }

  // ── 4. Generación (§1.10 — pendiente de pipeline RAG) ────────────────────
  log.info({ userId: user.id, hasPaidAccess }, 'generate-test — RAG pendiente §1.10')
  return NextResponse.json({ error: 'Motor de generación en construcción.' }, { status: 501 })
}
