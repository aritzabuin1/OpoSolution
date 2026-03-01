import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { generateTest } from '@/lib/ai/generate-test'
import { generatePsicotecnicos } from '@/lib/psicotecnicos/index'
import { logger } from '@/lib/logger'
import type { Json } from '@/types/database'
import type { Pregunta } from '@/types/ai'

/**
 * POST /api/ai/generate-test — §1.7.6
 *
 * Genera un test MCQ verificado para un tema dado.
 *
 * Flujo:
 *   1. Auth — usuario debe estar autenticado
 *   2. Validar input con Zod (temaId, numPreguntas, dificultad)
 *   3. Acceso (ADR-0010 Fuel Tank): free ≤5 tests | pagado ilimitado
 *   4. Check concurrencia: rechazar si ya hay un test generándose (últimos 30s)
 *   5. Rate limit Upstash (pagados 20/día | free 5/min anti-spam)
 *   6. generateTest() → test verificado
 *   7. Retornar TestGenerado
 */

// ─── Schema de validación de input ────────────────────────────────────────────

// UUID_REGEX: acepta cualquier UUID con formato correcto (incl. UUIDs de seed con versión 0)
// z.string().uuid() en Zod v4 aplica RFC 4122 estricto (versión 1-5, variante 8/9/a/b)
// que rechaza los UUIDs de seed generados con patrón b0000000-0000-0000-...
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const GenerateTestInputSchema = z.object({
  tipo: z.enum(['tema', 'psicotecnico']).optional().default('tema'),
  temaId: z.string().regex(UUID_REGEX, 'temaId debe ser un UUID válido').optional(),
  numPreguntas: z
    .number()
    .int()
    .min(1, 'Mínimo 1 pregunta')
    .max(30, 'Máximo 30 preguntas'),
  dificultad: z.enum(['facil', 'media', 'dificil'], {
    error: 'dificultad debe ser facil, media o dificil',
  }),
}).refine(
  (data) => data.tipo === 'psicotecnico' || !!data.temaId,
  { message: 'temaId es requerido para tests de tipo tema', path: ['temaId'] }
)

// ─── Handler ──────────────────────────────────────────────────────────────────

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

  // ── 2. Validar input ──────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido.' }, { status: 400 })
  }

  const parsed = GenerateTestInputSchema.safeParse(body)
  if (!parsed.success) {
    const errores = parsed.error.issues.map((i) => i.message).join('; ')
    return NextResponse.json(
      { error: `Input inválido: ${errores}` },
      { status: 400 }
    )
  }

  const { tipo, temaId, numPreguntas, dificultad } = parsed.data

  // ── 3. ¿Tiene acceso de pago? ─────────────────────────────────────────────
  const serviceSupabase = await createServiceClient()

  const { count: purchaseCount } = await supabase
    .from('compras')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const hasPaidAccess = (purchaseCount ?? 0) > 0

  // ── 4. Verificar créditos disponibles (SIN consumir aún — BUG-010) ────────
  //
  // DDIA Reliability: el descuento ocurre SOLO tras confirmación de éxito.
  // Si la IA falla, el usuario no pierde su test gratuito.
  // Riesgo TOCTOU residual mínimo: mitigado por anti-spam (paso 3) + concurrencia (paso 4).
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
    // Usuarios free: verificar cuota read-only (NO consumir crédito aún)
    const { data: profileFree } = await serviceSupabase
      .from('profiles')
      .select('free_tests_used')
      .eq('id', user.id)
      .single()

    const freeTestsUsed = profileFree?.free_tests_used ?? 0

    if (freeTestsUsed >= 5) {
      log.info({ userId: user.id, freeTestsUsed }, 'Free test quota exhausted — paywall')
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

    // Anti-spam usuarios free: 5 requests/minuto
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

  // ── 4. Check concurrencia — evitar tests duplicados en <30s ──────────────
  const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString()
  const { data: testEnProgreso } = await supabase
    .from('tests_generados')
    .select('id')
    .eq('user_id', user.id)
    .eq('completado', false)
    .gte('created_at', thirtySecondsAgo)
    .limit(1)
    .maybeSingle()

  if (testEnProgreso) {
    log.warn({ userId: user.id, testId: testEnProgreso.id }, 'Test ya en progreso')
    return NextResponse.json(
      { error: 'Ya tienes un test generándose. Espera unos segundos.' },
      { status: 409 }
    )
  }

  // ── 5. Generar test ────────────────────────────────────────────────────────
  log.info({ userId: user.id, tipo, temaId, numPreguntas, dificultad, hasPaidAccess }, 'Iniciando generación de test')

  // ── 5A. Motor determinista de psicotécnicos (coste API = 0€) ──────────────
  if (tipo === 'psicotecnico') {
    try {
      const dificultadNum = dificultad === 'facil' ? 1 : dificultad === 'media' ? 2 : 3

      const psicoPreguntasRaw = generatePsicotecnicos(numPreguntas, dificultadNum)

      // Mapear PsicotecnicoQuestion → Pregunta (sin cita)
      const preguntas: Pregunta[] = psicoPreguntasRaw.map((q) => ({
        enunciado: q.enunciado,
        opciones: q.opciones,
        correcta: q.correcta,
        explicacion: q.explicacion,
        dificultad,
      }))

      // Guardar en BD
      const { data: testRow, error: insertError } = await serviceSupabase
        .from('tests_generados')
        .insert({
          user_id: user.id,
          tema_id: null,
          tipo: 'psicotecnico',
          preguntas: preguntas as unknown as Json,
          completado: false,
          prompt_version: 'psico-1.0',
        })
        .select('id, created_at')
        .single()

      if (insertError || !testRow) {
        log.error({ err: insertError, userId: user.id }, 'Error al guardar test psicotécnico')
        return NextResponse.json(
          { error: 'Error al guardar el test. Por favor inténtalo de nuevo.' },
          { status: 500 }
        )
      }

      // Consumir crédito (mismo comportamiento que tests IA)
      if (!hasPaidAccess) {
        void serviceSupabase.rpc('use_free_test', { p_user_id: user.id })
      }

      log.info({ userId: user.id, testId: testRow.id, preguntas: preguntas.length }, 'Test psicotécnico generado')

      return NextResponse.json({
        id: testRow.id,
        preguntas,
        temaId: null,
        promptVersion: 'psico-1.0',
        createdAt: testRow.created_at,
      }, { status: 200 })
    } catch (err) {
      log.error({ err, userId: user.id }, 'Error al generar test psicotécnico')
      return NextResponse.json(
        { error: 'Error al generar el test psicotécnico. Por favor inténtalo de nuevo.' },
        { status: 500 }
      )
    }
  }

  // ── 5B. Motor IA (RAG + Claude/OpenAI) ────────────────────────────────────
  try {
    const test = await generateTest({
      temaId: temaId!,
      numPreguntas,
      dificultad,
      userId: user.id,
      requestId,
    })

    // Consumir crédito SOLO tras éxito (BUG-010 fix)
    if (!hasPaidAccess) {
      void serviceSupabase.rpc('use_free_test', { p_user_id: user.id })
    }

    log.info({ userId: user.id, testId: test.id, preguntas: test.preguntas.length }, 'Test generado correctamente')

    return NextResponse.json(test, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err, userId: user.id, temaId }, 'Error al generar test')

    // Error del circuit breaker
    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json(
        { error: 'El servicio de IA no está disponible temporalmente. Inténtalo en un minuto.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Error al generar el test. Por favor inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
