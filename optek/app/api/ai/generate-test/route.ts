import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'
import { generateTest, generateTopFrecuentesTest } from '@/lib/ai/generate-test'
import { generatePsicotecnicos, getDistribucionPsicotecnicos } from '@/lib/psicotecnicos/index'
import { withTimeout, TimeoutError } from '@/lib/utils/timeout'
import { logger } from '@/lib/logger'
import { FREE_LIMITS, checkPaidAccess, checkIsAdmin, getOposicionFromTema, getOposicionFromProfile, canTakeFreeTemaTest, findIncompleteTest, FREE_QUESTIONS_PER_TEST } from '@/lib/freemium'
import { detectDeviceType } from '@/lib/utils/device-detection'
import { computeHash, buildLegalKey, isDuplicate, buildDedupIndex, type BankQuestion } from '@/lib/utils/question-dedup'
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
 *   3. Acceso: free = 1 test/tema (banco fijo) | pagado = banco progresivo + IA
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

  // ── 3. ¿Tiene acceso de pago? (compra OR is_admin) — scoped por oposición
  const serviceSupabase = await createServiceClient()

  // Derivar oposicionId del temaId (Pattern A) o del profile (Pattern B)
  const oposicionId = (tipo === 'tema' && temaId)
    ? await getOposicionFromTema(serviceSupabase, temaId)
    : await getOposicionFromProfile(serviceSupabase, user.id)

  const [hasPaidAccess, isAdmin] = await Promise.all([
    checkPaidAccess(serviceSupabase, user.id, oposicionId),
    checkIsAdmin(serviceSupabase, user.id),
  ])

  // ── 3b. Free users: 1 test per tema (from fixed bank, no AI) ────────────
  if (!hasPaidAccess && tipo === 'tema' && temaId) {
    // Check if tema already completed → 402 with conversion trigger data
    const canTake = await canTakeFreeTemaTest(serviceSupabase, user.id, temaId)
    if (!canTake) {
      log.info({ userId: user.id, temaId, oposicionId }, 'Free user tried completed tema — paywall')

      // Fetch Radar data for conversion trigger (graceful if no data)
      let radarFrequency: number | null = null
      try {
        const { data: radarData } = await (serviceSupabase as any)
          .from('frecuencias_articulos')
          .select('frecuencia')
          .eq('oposicion_id', oposicionId)
          .limit(1)
        radarFrequency = (radarData as Array<{ frecuencia: number }> | null)?.[0]?.frecuencia ?? null
      } catch { /* no radar data available */ }

      return NextResponse.json(
        {
          error: 'Ya has completado el test gratuito de este tema.',
          code: 'PAYWALL_TESTS',
          temaCompleted: true,
          radarFrequency,
        },
        { status: 402 }
      )
    }

    // Idempotency: if incomplete test exists, return it (with its preguntas)
    const existingTestId = await findIncompleteTest(serviceSupabase, user.id, temaId)
    if (existingTestId) {
      const { data: existingTest } = await serviceSupabase
        .from('tests_generados')
        .select('id, preguntas, created_at, prompt_version')
        .eq('id', existingTestId)
        .single()

      if (existingTest?.preguntas && Array.isArray(existingTest.preguntas) && existingTest.preguntas.length > 0) {
        log.info({ userId: user.id, temaId, testId: existingTestId }, 'Returning existing incomplete free test')
        return NextResponse.json({
          id: existingTest.id,
          preguntas: existingTest.preguntas,
          temaId,
          promptVersion: existingTest.prompt_version ?? 'free-bank-1.0',
          createdAt: existingTest.created_at,
        }, { status: 200 })
      }

      // Zombie test (no preguntas) — delete and continue with fresh generation
      log.warn({ userId: user.id, temaId, testId: existingTestId }, 'Deleting zombie test (no preguntas)')
      await serviceSupabase.from('tests_generados').delete().eq('id', existingTestId)
    }

    // Serve from free_question_bank (€0, no AI)
    let bankRow: { preguntas: Json } | null = null
    try {
      const { data, error: bankError } = await (serviceSupabase as any)
        .from('free_question_bank')
        .select('preguntas')
        .eq('oposicion_id', oposicionId)
        .eq('tema_id', temaId)
        .maybeSingle()
      if (bankError) {
        log.warn({ err: bankError, temaId, oposicionId }, 'free_question_bank query error — falling back to AI')
      }
      bankRow = data
    } catch (bankErr) {
      log.warn({ err: bankErr, temaId }, 'free_question_bank query threw — falling back to AI')
    }

    if (bankRow?.preguntas) {
      // Create tests_generados entry with fixed questions
      // CRITICAL: tipo must be 'tema' — CHECK constraint on tests_generados
      // only allows: 'tema', 'simulacro', 'repaso_errores', 'psicotecnico'
      const { data: testRow, error: insertError } = await serviceSupabase
        .from('tests_generados')
        .insert({
          user_id: user.id,
          tema_id: temaId,
          tipo: 'tema',
          preguntas: bankRow.preguntas as Json,
          completado: false,
          prompt_version: 'free-bank-1.0',
          oposicion_id: oposicionId,
        })
        .select('id, created_at')
        .single()

      if (insertError || !testRow) {
        log.error({ err: insertError, userId: user.id, temaId, oposicionId }, 'Error saving free bank test')
        return NextResponse.json({ error: 'Error al guardar el test.' }, { status: 500 })
      }

      // Increment free_tests_used for analytics (non-blocking)
      try {
        await serviceSupabase.rpc('use_free_test', { p_user_id: user.id })
      } catch { /* analytics only */ }

      log.info({ userId: user.id, testId: testRow.id, source: 'free_bank' }, 'Free bank test served')
      return NextResponse.json({
        id: testRow.id,
        preguntas: bankRow.preguntas,
        temaId,
        promptVersion: 'free-bank-1.0',
        createdAt: testRow.created_at,
      }, { status: 200 })
    }

    // Fallback: bank not populated yet for this tema → generate with AI
    log.warn({ temaId, oposicionId }, 'Free bank missing for tema, falling back to AI generation')
    // Continue to §5C (AI generation) with forced params
  }

  // ── 3c. Free users: enforce fixed difficulty + question count ──────────────
  // Free users who reach this point are in the AI fallback path (bank not ready)
  // Force media difficulty and 10 questions
  const effectiveNumPreguntas = !hasPaidAccess ? FREE_QUESTIONS_PER_TEST : numPreguntas
  const effectiveDificultad = !hasPaidAccess ? 'media' as const : dificultad

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
    // Free users: per-tema gating already handled in §3b.
    // If we reach here, it's the AI fallback path (bank not ready).
    // Anti-spam: 5 requests/minute
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
  log.info({ userId: user.id, tipo, temaId, numPreguntas: effectiveNumPreguntas, dificultad: effectiveDificultad, hasPaidAccess }, 'Iniciando generación de test')

  // ── 5A. Motor determinista de psicotécnicos (coste API €0) ────────────────
  if (tipo === 'psicotecnico') {
    // Fetch oposición slug to determine psicotécnico type (AGE vs Correos)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: opoSlugData } = oposicionId ? await (serviceSupabase as any)
      .from('oposiciones').select('slug').eq('id', oposicionId).single() : { data: null }
    const opoSlug = (opoSlugData as { slug?: string } | null)?.slug
    const distribucion = getDistribucionPsicotecnicos(opoSlug)
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
          ...generatePsicotecnicos(nFacil, 1, distribucion).map(q => ({ ...q, dif: 'facil' as const })),
          ...generatePsicotecnicos(nMedia, 2, distribucion).map(q => ({ ...q, dif: 'media' as const })),
          ...generatePsicotecnicos(nDificil, 3, distribucion).map(q => ({ ...q, dif: 'dificil' as const })),
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
        const psicoPreguntasRaw = generatePsicotecnicos(numPreguntas, dificultadNum, distribucion)
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

  // ── 5C. Premium bank + IA generation ──────────────────────────────────────
  try {
    // For premium users with a temaId: try serving from question_bank first
    // §2.8.4 — Banco progresivo: serve unseen questions until user has seen ≥90% of bank,
    // then generate with AI (which also feeds the bank for other users).
    let bankServed = false
    if (hasPaidAccess && temaId) {
      try {
        // Count total + fetch unseen questions from bank for this (tema, dificultad)
        // Get seen question IDs first, then filter
        const { data: seenQRows } = await (serviceSupabase as any)
          .from('user_questions_seen')
          .select('question_id')
          .eq('user_id', user.id)
        const seenQIds = (seenQRows ?? []).map((r: { question_id: string }) => r.question_id)

        let unseenBankQuery = (serviceSupabase as any)
          .from('question_bank')
          .select('id, enunciado, opciones, correcta, explicacion, cita_ley, cita_articulo, dificultad')
          .eq('tema_id', temaId)
          .eq('dificultad', effectiveDificultad)
        if (seenQIds.length > 0) {
          unseenBankQuery = unseenBankQuery.not('id', 'in', `(${seenQIds.join(',')})`)
        }

        const [{ count: totalInBank }, { data: unseenRows }] = await Promise.all([
          (serviceSupabase as any)
            .from('question_bank')
            .select('id', { count: 'exact', head: true })
            .eq('tema_id', temaId)
            .eq('dificultad', effectiveDificultad),
          unseenBankQuery.limit(effectiveNumPreguntas),
        ])

        const unseen = (unseenRows ?? []) as Array<{
          id: string; enunciado: string; opciones: Record<string, string>;
          correcta: string; explicacion: string | null;
          cita_ley: string | null; cita_articulo: string | null; dificultad: string;
        }>

        const total = totalInBank ?? 0
        const unseenRatio = total > 0 ? unseen.length / total : 0
        // Serve from bank if: enough unseen questions AND user hasn't seen ≥90% of bank
        // When user has seen ≥90%, generate with AI to add fresh questions to the bank
        if (unseen.length >= effectiveNumPreguntas && unseenRatio > 0.10) {
          // Serve fully from bank (€0)
          const charToIdx = (c: string): 0 | 1 | 2 | 3 => Math.max(0, Math.min(3, c.charCodeAt(0) - 97)) as 0 | 1 | 2 | 3
          const preguntas: Pregunta[] = unseen.slice(0, effectiveNumPreguntas).map(q => {
            const opts = Object.values(q.opciones) as [string, string, string, string]
            return {
              enunciado: q.enunciado,
              opciones: opts,
              correcta: charToIdx(q.correcta),
              explicacion: q.explicacion ?? '',
              dificultad: q.dificultad as 'facil' | 'media' | 'dificil',
              ...(q.cita_ley && q.cita_articulo ? { cita: { ley: q.cita_ley, articulo: q.cita_articulo, textoExacto: '' } } : {}),
            }
          })

          // Save to tests_generados
          const { data: testRow, error: insertError } = await serviceSupabase
            .from('tests_generados')
            .insert({
              user_id: user.id,
              tema_id: temaId,
              tipo: 'tema',
              preguntas: preguntas as unknown as Json,
              completado: false,
              prompt_version: 'bank-1.0',
              oposicion_id: oposicionId,
            })
            .select('id, created_at')
            .single()

          if (!insertError && testRow) {
            // Track seen questions (non-blocking)
            const seenInserts = unseen.slice(0, effectiveNumPreguntas).map(q => ({
              user_id: user.id,
              question_id: q.id,
              answered_correctly: null,
            }))
            await (serviceSupabase as any).from('user_questions_seen').insert(seenInserts).catch(() => {})

            // Update times_served in batch (non-blocking)
            const servedIds = unseen.slice(0, effectiveNumPreguntas).map(q => q.id)
            if (servedIds.length > 0) {
              await (serviceSupabase as any)
                .rpc('increment_times_served', { question_ids: servedIds })
                .catch(async () => {
                  // Fallback if RPC doesn't exist: single update setting times_served = 1
                  await (serviceSupabase as any)
                    .from('question_bank')
                    .update({ times_served: 1 })
                    .in('id', servedIds)
                    .catch(() => {})
                })
            }

            log.info({ userId: user.id, testId: testRow.id, source: 'question_bank', count: preguntas.length }, 'Bank test served')
            bankServed = true
            return NextResponse.json({
              id: testRow.id,
              preguntas,
              temaId,
              promptVersion: 'bank-1.0',
              createdAt: testRow.created_at,
            }, { status: 200 })
          }
        }
        // Not enough unseen questions OR user has seen ≥90% → fall through to AI generation
        if (!bankServed) {
          log.info({ userId: user.id, temaId, unseen: unseen.length, total, unseenRatio: unseenRatio.toFixed(2), needed: effectiveNumPreguntas }, 'Bank insufficient or ≥90% seen — generating with AI (feeds bank for others)')
        }
      } catch (bankErr) {
        // Bank query failed — fall through to AI generation silently
        log.warn({ err: bankErr, userId: user.id }, 'question_bank query failed, falling back to AI')
      }
    }

    const test = await withTimeout(
      generateTest({
        temaId: temaId!,
        numPreguntas: effectiveNumPreguntas,
        dificultad: effectiveDificultad,
        userId: user.id,
        requestId,
        oposicionId,
        deviceType: detectDeviceType(request.headers.get('user-agent')),
      }),
      GENERATE_TIMEOUT_MS
    )

    // Save AI-generated questions to question_bank (dedup + non-blocking)
    log.info({ hasPaidAccess, temaId: !!temaId, preguntasCount: test.preguntas.length, bankServed }, 'Bank save gate check')
    if (hasPaidAccess && temaId && test.preguntas.length > 0) {
      try {
        const { data: existingBank } = await (serviceSupabase as any)
          .from('question_bank')
          .select('id, enunciado_hash, legal_key, enunciado')
          .eq('tema_id', temaId)
          .eq('dificultad', effectiveDificultad)

        const bankQuestions = (existingBank ?? []) as BankQuestion[]
        const { hashSet, legalKeyMap } = buildDedupIndex(bankQuestions)

        const bankInsertBatch: Array<{
          oposicion_id: string | null; tema_id: string; dificultad: string;
          enunciado: string; opciones: Record<string, string> | string[];
          correcta: number | string; explicacion: string | null;
          cita_ley: string | null; cita_articulo: string | null;
          enunciado_hash: string; legal_key: string | null;
        }> = []

        for (const p of test.preguntas) {
          const correctIdx = typeof p.correcta === 'number' ? p.correcta : 0
          const correctText = Array.isArray(p.opciones) && correctIdx >= 0 && correctIdx < p.opciones.length
            ? String(p.opciones[correctIdx])
            : ''

          const dedupResult = isDuplicate(
            {
              enunciado: p.enunciado,
              cita: p.cita,
              correctAnswerText: correctText,
              temaId,
            },
            bankQuestions,
            hashSet,
            legalKeyMap,
          )

          if (!dedupResult.duplicate) {
            const hash = computeHash(p.enunciado)
            const legalKey = buildLegalKey(temaId, p.cita, correctText)
            const opciones = Array.isArray(p.opciones)
              ? { a: p.opciones[0], b: p.opciones[1], c: p.opciones[2], d: p.opciones[3] }
              : p.opciones

            // Convert numeric correcta (0-3) to char ('a'-'d') for question_bank schema
            const correctaChar = ['a', 'b', 'c', 'd'][typeof p.correcta === 'number' ? p.correcta : 0] ?? 'a'

            bankInsertBatch.push({
              oposicion_id: oposicionId,
              tema_id: temaId,
              dificultad: effectiveDificultad,
              enunciado: p.enunciado,
              opciones,
              correcta: correctaChar,
              explicacion: p.explicacion ?? null,
              cita_ley: p.cita?.ley ?? null,
              cita_articulo: p.cita?.articulo ?? null,
              enunciado_hash: hash,
              legal_key: legalKey,
            })

            // Update index for subsequent iterations
            hashSet.add(hash)
            if (legalKey) legalKeyMap.set(legalKey, 'new')
          }
        }

        // Single batch upsert — ignoreDuplicates skips rows with existing enunciado_hash
        if (bankInsertBatch.length > 0) {
          const { error: upsertErr, count: upsertCount } = await (serviceSupabase as any)
            .from('question_bank')
            .upsert(bankInsertBatch, { onConflict: 'enunciado_hash', ignoreDuplicates: true })
            .select('id', { count: 'exact', head: true })
          if (upsertErr) {
            log.error({ err: upsertErr, batchSize: bankInsertBatch.length, sample: bankInsertBatch[0] }, 'question_bank upsert FAILED')
          } else {
            log.info({ userId: user.id, temaId, bankBefore: bankQuestions.length, inserted: upsertCount, batchSize: bankInsertBatch.length }, 'Bank populated from AI test')
          }
        } else {
          log.info({ userId: user.id, temaId, bankBefore: bankQuestions.length, msg: 'all duplicates — nothing to insert' }, 'Bank: no new questions')
        }
      } catch (bankSaveErr) {
        log.warn({ err: bankSaveErr }, 'Failed to save to question_bank (non-critical)')
      }
    }

    // Auto-fill free bank: only when a FREE user triggers AI fallback (bank was empty for their tema).
    // This populates the free bank so future free users get instant results.
    // Premium users' questions go to question_bank (banco progresivo) above, NOT here.
    if (!hasPaidAccess && temaId && oposicionId && test.preguntas.length > 0) {
      try {
        const { data: temaRow } = await serviceSupabase
          .from('temas')
          .select('numero')
          .eq('id', temaId)
          .single()

        if (temaRow?.numero) {
          await (serviceSupabase as any)
            .from('free_question_bank')
            .upsert({
              oposicion_id: oposicionId,
              tema_id: temaId,
              tema_numero: temaRow.numero,
              preguntas: test.preguntas as unknown as Json,
              validated: false,
            }, { onConflict: 'oposicion_id,tema_id' })

          log.info({ temaId, oposicionId, temaNumero: temaRow.numero }, 'Auto-filled free_question_bank from AI fallback')
        }
      } catch (autoFillErr) {
        log.warn({ err: autoFillErr, temaId }, 'Failed to auto-fill free_question_bank (non-critical)')
      }
    }

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
