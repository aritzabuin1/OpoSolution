import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { generateTest, generateTopFrecuentesTest } from '@/lib/ai/generate-test'
import { generatePsicotecnicos } from '@/lib/psicotecnicos/index'
import { withTimeout, TimeoutError } from '@/lib/utils/timeout'
import { logger } from '@/lib/logger'
import { FREE_LIMITS, checkPaidAccess, checkIsAdmin, getOposicionFromTema, getOposicionFromProfile, getFreeTemas } from '@/lib/freemium'
import { detectDeviceType } from '@/lib/utils/device-detection'
import type { Json } from '@/types/database'
import type { Pregunta } from '@/types/ai'

// Vercel Hobby max: 60s. Sin esto, el default es 10s y la IA no llega a responder.
export const maxDuration = 60

const GENERATE_TIMEOUT_MS = 55_000 // 55s safety net (< maxDuration para respuesta limpia)

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
  tipo: z.enum(['tema', 'psicotecnico', 'radar']).optional().default('tema'),
  temaId: z.string().regex(UUID_REGEX, 'temaId debe ser un UUID válido').optional(),
  numPreguntas: z
    .number()
    .int()
    .min(1, 'Mínimo 1 pregunta')
    .max(30, 'Máximo 30 preguntas'),
  dificultad: z.enum(['facil', 'media', 'dificil', 'progresivo'], {
    error: 'dificultad debe ser facil, media, dificil o progresivo',
  }),
}).refine(
  (data) => data.tipo === 'psicotecnico' || data.tipo === 'radar' || !!data.temaId,
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

  // ── 3. ¿Tiene acceso de pago? (compra OR is_founder) — scoped por oposición
  const serviceSupabase = await createServiceClient()

  // Derivar oposicionId del temaId (Pattern A) o del profile (Pattern B)
  const oposicionId = (tipo === 'tema' && temaId)
    ? await getOposicionFromTema(serviceSupabase, temaId)
    : await getOposicionFromProfile(serviceSupabase, user.id)

  const [hasPaidAccess, isAdmin] = await Promise.all([
    checkPaidAccess(serviceSupabase, user.id, oposicionId),
    checkIsAdmin(serviceSupabase, user.id),
  ])

  // ── 3b. Free users: verificar que el tema está permitido ─────────────────
  if (!hasPaidAccess && tipo === 'tema' && temaId) {
    const { data: temaRow } = await serviceSupabase
      .from('temas')
      .select('numero')
      .eq('id', temaId)
      .single()

    // Derivar slug de la oposición para obtener los temas free correctos
    const { data: oposicionRow } = await serviceSupabase
      .from('oposiciones')
      .select('slug')
      .eq('id', oposicionId)
      .single()
    const freeTemas = getFreeTemas((oposicionRow as { slug?: string } | null)?.slug ?? 'aux-admin-estado')

    const temaNumero = temaRow?.numero ?? 0
    if (!freeTemas.includes(temaNumero)) {
      log.info({ userId: user.id, temaId, temaNumero, oposicionId }, 'Free user tried locked tema — paywall')
      return NextResponse.json(
        {
          error: 'Este tema requiere acceso Premium.',
          code: 'PAYWALL_TESTS',
        },
        { status: 402 }
      )
    }
  }

  // ── 3c. Free users: dificultad 'dificil' y 'progresivo' requieren Premium ──
  if (!hasPaidAccess && (dificultad === 'dificil' || dificultad === 'progresivo')) {
    log.info({ userId: user.id, tipo, dificultad }, 'Free user tried premium difficulty — paywall')
    return NextResponse.json(
      {
        error: 'Los niveles Difícil y Progresivo requieren acceso Premium.',
        code: 'PAYWALL_TESTS',
      },
      { status: 402 }
    )
  }

  // ── 4. Verificar créditos disponibles (SIN consumir aún — BUG-010) ────────
  //
  // DDIA Reliability: el descuento ocurre SOLO tras confirmación de éxito.
  // Si la IA falla, el usuario no pierde su test gratuito.
  // Riesgo TOCTOU residual mínimo: mitigado por anti-spam (paso 3) + concurrencia (paso 4).
  // Admin skip rate limits (testing sin restricciones)
  if (hasPaidAccess && !isAdmin) {
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
  } else if (!hasPaidAccess) {
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
              id: 'recarga',
              name: 'Recarga',
              price: '8,99€',
              description: '+10 correcciones adicionales',
            },
            {
              id: 'pack',
              name: 'Pack Oposición',
              price: '49,99€',
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

  // ── 5A. Motor determinista de psicotécnicos (coste API €0) ────────────────
  if (tipo === 'psicotecnico') {
    // Free users: límite de psicotécnicos
    if (!hasPaidAccess) {
      const { data: profilePsico } = await serviceSupabase
        .from('profiles')
        .select('free_psico_used')
        .eq('id', user.id)
        .single()

      const freePsicoUsed = (profilePsico as { free_psico_used?: number } | null)?.free_psico_used ?? 0

      if (freePsicoUsed >= FREE_LIMITS.psicotecnicos) {
        log.info({ userId: user.id, freePsicoUsed }, 'Free psico quota exhausted — paywall')
        return NextResponse.json(
          {
            error: `Has agotado tus ${FREE_LIMITS.psicotecnicos} tests psicotécnicos gratuitos.`,
            code: 'PAYWALL_TESTS',
          },
          { status: 402 }
        )
      }
    }

    try {
      // For progresivo: generate mixed difficulties (30% easy, 50% medium, 20% hard)
      let preguntas: Pregunta[]
      if (dificultad === 'progresivo') {
        const nFacil = Math.round(numPreguntas * 0.3)
        const nDificil = Math.round(numPreguntas * 0.2)
        const nMedia = numPreguntas - nFacil - nDificil
        const mixed = [
          ...generatePsicotecnicos(nFacil, 1).map(q => ({ ...q, dif: 'facil' as const })),
          ...generatePsicotecnicos(nMedia, 2).map(q => ({ ...q, dif: 'media' as const })),
          ...generatePsicotecnicos(nDificil, 3).map(q => ({ ...q, dif: 'dificil' as const })),
        ]
        // Fisher-Yates shuffle
        for (let i = mixed.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [mixed[i], mixed[j]] = [mixed[j], mixed[i]]
        }
        preguntas = mixed.map((q) => ({
          enunciado: q.enunciado,
          opciones: q.opciones,
          correcta: q.correcta,
          explicacion: q.explicacion,
          dificultad: q.dif,
        }))
      } else {
        const dificultadNum = dificultad === 'facil' ? 1 : dificultad === 'media' ? 2 : 3
        const psicoPreguntasRaw = generatePsicotecnicos(numPreguntas, dificultadNum)
        preguntas = psicoPreguntasRaw.map((q) => ({
          enunciado: q.enunciado,
          opciones: q.opciones,
          correcta: q.correcta,
          explicacion: q.explicacion,
          dificultad,
        }))
      }

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
          oposicion_id: oposicionId,
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

      // Consumir crédito psicotécnico (separado de tests IA)
      if (!hasPaidAccess) {
        try {
          await (serviceSupabase as any).rpc('use_free_psico', { p_user_id: user.id })
        } catch (creditErr) {
          log.error({ err: creditErr, userId: user.id }, 'Failed to deduct psico credit')
        }
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

  // ── 5B. Radar del Tribunal (top artículos frecuentes — §2.14.4) ─────────────
  if (tipo === 'radar') {
    // Radar es una feature Premium: solo usuarios de pago
    if (!hasPaidAccess) {
      return NextResponse.json(
        { error: 'El Radar del Tribunal es una función Premium.', code: 'PAYWALL_RADAR' },
        { status: 402 }
      )
    }
    try {
      const testId = await generateTopFrecuentesTest(user.id, oposicionId)

      // Cargar el test recién creado para devolverlo completo al cliente
      const { data: testRow } = await serviceSupabase
        .from('tests_generados')
        .select('id, preguntas, created_at, prompt_version')
        .eq('id', testId)
        .single()

      log.info({ userId: user.id, testId }, 'Test radar generado correctamente')

      return NextResponse.json({
        id: testId,
        preguntas: testRow?.preguntas ?? [],
        temaId: null,
        promptVersion: testRow?.prompt_version ?? '2.0.0',
        createdAt: testRow?.created_at ?? new Date().toISOString(),
      }, { status: 200 })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      log.error({ err, userId: user.id }, 'Error al generar test radar')

      if (message.includes('frecuencias_articulos está vacía')) {
        return NextResponse.json(
          { error: 'El Radar aún no tiene datos. Estamos procesando la información, inténtalo más tarde.' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: 'Error al generar el test de radar. Por favor inténtalo de nuevo.' },
        { status: 500 }
      )
    }
  }

  // ── 5C. Motor IA (RAG + Claude/OpenAI) ────────────────────────────────────
  try {
    const test = await withTimeout(
      generateTest({
        temaId: temaId!,
        numPreguntas,
        dificultad,
        userId: user.id,
        requestId,
        oposicionId,
        deviceType: detectDeviceType(request.headers.get('user-agent')),
      }),
      GENERATE_TIMEOUT_MS
    )

    // Consumir crédito SOLO tras éxito (BUG-010 fix)
    if (!hasPaidAccess) {
      try {
        await serviceSupabase.rpc('use_free_test', { p_user_id: user.id })
      } catch (creditErr) {
        log.error({ err: creditErr, userId: user.id }, 'Failed to deduct free test credit')
      }
    }

    log.info({ userId: user.id, testId: test.id, preguntas: test.preguntas.length }, 'Test generado correctamente')

    return NextResponse.json(test, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    log.error({ err, userId: user.id, temaId }, 'Error al generar test')

    // Error de timeout
    if (err instanceof TimeoutError) {
      return NextResponse.json(
        { error: 'La generación ha tardado demasiado. Esto ocurre cuando el servicio de IA está saturado. Inténtalo de nuevo en unos segundos.' },
        { status: 504 }
      )
    }

    // Error del circuit breaker
    if (message.includes('temporalmente no disponible')) {
      return NextResponse.json(
        { error: 'El servicio de IA no esta disponible temporalmente. Intentalo en un minuto.' },
        { status: 503 }
      )
    }

    // Error de contexto vacío (tema sin legislación/conocimiento indexado)
    if (message.includes('No hay contenido técnico') || message.includes('No hay legislación indexada')) {
      return NextResponse.json(
        { error: message },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Error al generar el test. Por favor inténtalo de nuevo.' },
      { status: 500 }
    )
  }
}
