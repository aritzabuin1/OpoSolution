import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { correctDesarrollo } from '@/lib/ai/correct-desarrollo'
import { logger } from '@/lib/logger'

/**
 * POST /api/ai/correct-desarrollo — §1.8.7
 *
 * Corrige un desarrollo escrito usando Claude Sonnet (ADR-0010).
 *
 * Flujo:
 *   1. Auth — usuario debe estar autenticado
 *   2. Validar input con Zod (texto, temaId)
 *   3. Anti-spam: rate limit 3 req/min (Upstash)
 *   4. Acceso (ADR-0010): descuenta corrections_balance (paid) → free_corrector_used
 *   5. Check concurrencia: rechazar si ya hay corrección en progreso (últimos 30s)
 *   6. Rate limit silencioso: 5 correcciones/día (safety net económico)
 *   7. correctDesarrollo() → evaluación verificada
 *   8. Retornar CorreccionDesarrolloResult
 */

// ─── Schema de validación de input ────────────────────────────────────────────

// UUID_REGEX: acepta cualquier UUID con formato correcto (incl. UUIDs de seed con versión 0)
// z.string().uuid() en Zod v4 aplica RFC 4122 estricto que rechaza los seed UUIDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CorrectDesarrolloInputSchema = z.object({
  texto: z
    .string()
    .min(50, 'El desarrollo debe tener al menos 50 caracteres')
    .max(5000, 'El desarrollo no puede superar 5000 caracteres'),
  temaId: z.string().regex(UUID_REGEX, 'temaId debe ser un UUID válido'),
})

// ─── Handler ──────────────────────────────────────────────────────────────────

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

  // ── 2. Validar input ──────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }

  const parsed = CorrectDesarrolloInputSchema.safeParse(body)
  if (!parsed.success) {
    const errores = parsed.error.issues.map((i) => i.message).join('; ')
    return NextResponse.json({ error: `Input inválido: ${errores}` }, { status: 400 })
  }

  const { texto, temaId } = parsed.data

  // ── 3. Anti-spam: 3 req/min independiente de cuota ────────────────────────
  const antiSpam = await checkRateLimit(user.id, 'ai-correct', 3, '1 m')
  if (!antiSpam.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Espera un momento.' },
      {
        status: 429,
        headers: { 'Retry-After': buildRetryAfterHeader(antiSpam.resetAt) },
      }
    )
  }

  // ── 4. Verificar créditos disponibles (SIN descontar aún — BUG-010) ────────
  //
  // DDIA Reliability: el descuento ocurre SOLO tras confirmación de éxito.
  // Si la IA falla, el usuario no pierde crédito.
  // Riesgo TOCTOU residual mínimo: mitigado por anti-spam (paso 3) + concurrencia (paso 5).
  const serviceSupabase = await createServiceClient()

  const { data: profileCredits } = await serviceSupabase
    .from('profiles')
    .select('corrections_balance, free_corrector_used')
    .eq('id', user.id)
    .single()

  const hasPaidCredit = (profileCredits?.corrections_balance ?? 0) > 0
  const hasFreeCredit = !hasPaidCredit && (profileCredits?.free_corrector_used ?? 0) < 2

  if (!hasPaidCredit && !hasFreeCredit) {
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

  // ── 5. Check concurrencia — evitar correcciones duplicadas en <30s ────────
  const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString()
  const { data: correccionEnProgreso } = await supabase
    .from('desarrollos')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', thirtySecondsAgo)
    .limit(1)
    .maybeSingle()

  if (correccionEnProgreso) {
    log.warn({ userId: user.id, desarrolloId: correccionEnProgreso.id }, 'Corrección ya en progreso')
    return NextResponse.json(
      { error: 'Ya tienes una corrección en proceso. Espera unos segundos.' },
      { status: 409 }
    )
  }

  // ── 6. Rate limit silencioso: 5 correcciones/día (safety net) ────────────
  const dailyLimit = await checkRateLimit(user.id, 'ai-correct-daily', 5, '24 h')
  if (!dailyLimit.success) {
    log.warn({ userId: user.id }, 'Daily correction limit reached')
    return NextResponse.json(
      { error: 'Has alcanzado el límite diario de correcciones. Vuelve mañana.' },
      {
        status: 429,
        headers: { 'Retry-After': buildRetryAfterHeader(dailyLimit.resetAt) },
      }
    )
  }

  // ── 7. Corregir desarrollo ────────────────────────────────────────────────
  log.info({ userId: user.id, temaId, textoLength: texto.length, hasPaidCredit }, 'Iniciando corrección')

  try {
    const resultado = await correctDesarrollo({
      texto,
      temaId,
      userId: user.id,
      requestId,
    })

    // ── 7b. Descontar crédito SOLO tras éxito (BUG-010 fix) ─────────────────
    if (hasPaidCredit) {
      void serviceSupabase.rpc('use_correction', { p_user_id: user.id })
    } else {
      void serviceSupabase.rpc('use_free_correction', { p_user_id: user.id })
    }

    log.info(
      { userId: user.id, desarrolloId: resultado.id, puntuacion: resultado.puntuacion },
      'Corrección completada'
    )

    return NextResponse.json(resultado, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err, userId: user.id, temaId }, 'Error al corregir desarrollo')

    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json(
        { error: 'El servicio de IA no está disponible temporalmente. Inténtalo en un minuto.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Error al corregir el desarrollo. Por favor inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
