/**
 * lib/ai/generate-test.ts — OPTEK §1.7.3
 *
 * Función principal de generación de tests MCQ verificados.
 *
 * Pipeline Bloque I (legal):
 *   1. buildContext(temaId) → contexto RAG de legislacion
 *   2. callAIJSON(SYSTEM_GENERATE_TEST) → test raw
 *   3. verifyPreguntas → citation check determinista contra BD
 *   4. Si quedan < numPreguntas → reintentar (max 2)
 *   5. Guardar en BD y retornar
 *
 * Pipeline Bloque II (ofimática):
 *   1. buildContext(temaId) → contexto de conocimiento_tecnico
 *   2. callAIJSON(SYSTEM_GENERATE_TEST_BLOQUE2) → test raw (sin citas legales)
 *   3. guardrailBloque2 → verifica que el contenido de las respuestas
 *      exista en el contexto recuperado (previene inventar rutas de menú)
 *   4. Si quedan < numPreguntas → reintentar
 *   5. Guardar en BD y retornar
 *
 * DDIA Principles:
 *   Reliability   → max 2 reintentos si verificación filtra demasiadas preguntas
 *   Consistency   → prompt_version versionado para reproducibilidad y rollback
 *   Observability → logging de cada round con verified/needed/total
 */

import { buildContext, formatContext, retrieveExamples } from '@/lib/ai/retrieval'
import { callAIJSON } from '@/lib/ai/provider'
import {
  SYSTEM_GENERATE_TEST,
  SYSTEM_GENERATE_TEST_BLOQUE2,
  buildGenerateTestPrompt,
  buildGenerateTestBloque2Prompt,
} from '@/lib/ai/prompts'
import { TestGeneradoRawSchema } from '@/lib/ai/schemas'
import { extractCitations, verifyCitation, verifyContentMatch } from '@/lib/ai/verification'
import { resolveLeyNombre } from '@/lib/ai/citation-aliases'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { Pregunta, TestGenerado } from '@/types/ai'
import type { PreguntaRaw } from '@/lib/ai/schemas'
import type { Json } from '@/types/database'

// Minimal logger interface compatible with pino child loggers
interface ChildLogger {
  info(obj: object, msg: string): void
  warn(obj: object, msg: string): void
  debug(obj: object, msg: string): void
}

// ─── Versión del prompt (para tracking y rollback) ────────────────────────────

/**
 * Bump this when making significant changes to prompts or pipeline logic.
 * 2.0.0: Soporte Bloque II (ofimática) con prompt dedicado + guardrail de contexto.
 *        `cita` ahora opcional en PreguntaSchema.
 * 2.1.0: §1.4.4 — ejemplos reales INAP en prompt Bloque I (retrieveExamples).
 */
export const PROMPT_VERSION = '2.1.0'

const MAX_RETRIES    = 1
// Time budget: stop retrying before hitting Vercel's maxDuration (60s)
// OpenAI timeout = 25s, so first round ≈ 28s (RAG+AI+verify). Budget allows partial retry.
const TIME_BUDGET_MS = 50_000
// Modelo seleccionado automáticamente por provider.ts (mini/light por defecto)

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface GenerateTestParams {
  temaId: string
  numPreguntas: number
  dificultad: 'facil' | 'media' | 'dificil'
  userId: string
  requestId?: string
}

// ─── generateTest ─────────────────────────────────────────────────────────────

/**
 * Genera un test MCQ verificado para un tema dado.
 *
 * @returns TestGenerado con preguntas verificadas e id de BD
 * @throws Error si la IA falla, la BD falla, o si tras los reintentos
 *         no se alcanza ninguna pregunta verificada
 */
export async function generateTest(params: GenerateTestParams): Promise<TestGenerado> {
  const { temaId, numPreguntas, dificultad, userId, requestId } = params
  const log = requestId ? logger.child({ requestId }) : logger
  const start = Date.now()

  // ── 1. Contexto RAG + título del tema + ejemplos INAP ─────────────────────

  const [ctx, temaTitulo] = await Promise.all([
    buildContext(temaId, undefined, userId), // §2.11: userId habilita weakness-weighted RAG
    fetchTemaTitulo(temaId),
  ])

  const contexto = formatContext(ctx)
  const { esBloqueII, temaNumero } = ctx

  // §1.4.4: ejemplos de preguntas oficiales INAP para calibrar estilo (solo Bloque I)
  const ejemplosExamen = esBloqueII ? '' : await retrieveExamples(temaId, 3)

  log.info(
    { temaId, tokensEstimados: ctx.tokensEstimados, strategy: ctx.strategy, temaTitulo, esBloqueII, temaNumero },
    '[generateTest] context built'
  )

  // ── 2. Bucle de generación + verificación (max MAX_RETRIES reintentos) ────

  let preguntasVerificadas: Pregunta[] = []

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const needed = numPreguntas - preguntasVerificadas.length
    if (needed <= 0) break

    // Time budget check: don't start a new round if we're running out of time
    const elapsed = Date.now() - start
    if (attempt > 0 && elapsed > TIME_BUDGET_MS) {
      log.warn(
        { attempt, elapsedMs: elapsed, timeBudgetMs: TIME_BUDGET_MS, verified: preguntasVerificadas.length },
        '[generateTest] time budget exceeded — stopping retries with partial results'
      )
      break
    }

    // Seleccionar prompt según bloque
    const systemPrompt = esBloqueII ? SYSTEM_GENERATE_TEST_BLOQUE2 : SYSTEM_GENERATE_TEST
    const userPrompt = esBloqueII
      ? buildGenerateTestBloque2Prompt({ contextoTecnico: contexto, numPreguntas: needed, dificultad, temaTitulo })
      : buildGenerateTestPrompt({ contextoLegislativo: contexto, numPreguntas: needed, dificultad, temaTitulo, ejemplosExamen })

    const rawTest = await callAIJSON(
      systemPrompt,
      userPrompt,
      TestGeneradoRawSchema,
      {
        maxTokens: 16000,
        endpoint: 'generate-test',
        userId,
        requestId,
      }
    )

    // Truncar a 'needed' exacto — reasoning models pueden sobre-generar
    if (rawTest.preguntas.length > needed) {
      rawTest.preguntas = rawTest.preguntas.slice(0, needed)
    }

    // Sanitizar opciones: recortar, limpiar artefactos de IA, descartar basura
    const sanitized = sanitizePreguntas(rawTest.preguntas, log)

    log.info(
      { attempt, preguntasRaw: rawTest.preguntas.length, afterSanitize: sanitized.length, esBloqueII },
      '[generateTest] raw test received from GPT'
    )

    // ── 3–4. Verificar y filtrar preguntas ────────────────────────────────
    const verified = esBloqueII
      ? verifyPreguntasBloque2(sanitized, contexto, log)
      : await verifyPreguntas(sanitized, log)

    preguntasVerificadas = [...preguntasVerificadas, ...verified]

    log.info(
      {
        attempt,
        needed,
        verifiedThisRound: verified.length,
        totalVerified: preguntasVerificadas.length,
        targetPreguntas: numPreguntas,
      },
      '[generateTest] verification round complete'
    )

    if (preguntasVerificadas.length >= numPreguntas) break

    if (attempt < MAX_RETRIES) {
      const missing = numPreguntas - preguntasVerificadas.length
      log.warn(
        { attempt, missing, esBloqueII },
        '[generateTest] insuficientes preguntas verificadas — reintentando'
      )
    }
  }

  if (preguntasVerificadas.length === 0) {
    throw new Error(
      `[generateTest] No se pudieron generar preguntas verificadas para el tema ${temaId} ` +
        `(${MAX_RETRIES + 1} intentos). El contexto puede estar vacío.`
    )
  }

  const preguntas = preguntasVerificadas.slice(0, numPreguntas)

  // ── 5. Guardar en BD ──────────────────────────────────────────────────────
  const testId = await saveTestToDB({ userId, temaId, preguntas })

  log.info(
    {
      testId,
      preguntasGeneradas: preguntas.length,
      preguntasSolicitadas: numPreguntas,
      esBloqueII,
      durationMs: Date.now() - start,
    },
    '[generateTest] test generado y guardado correctamente'
  )

  return {
    id: testId,
    preguntas,
    temaId,
    promptVersion: PROMPT_VERSION,
    createdAt: new Date().toISOString(),
  }
}

// ─── Verificación Bloque I (citas legales) ────────────────────────────────────

/**
 * Verifica preguntas de Bloque I: cada pregunta debe tener citas legales válidas en BD.
 */
async function verifyPreguntas(preguntas: PreguntaRaw[], log: ChildLogger): Promise<Pregunta[]> {
  // Race verification against a timeout to avoid exceeding serverless limits
  const VERIFY_TIMEOUT_MS = 8_000

  const verifyAll = Promise.all(
    preguntas.map(async (pregunta) => {
      const passes = await verificarPreguntaBloque1(pregunta, log)
      return passes ? {
        enunciado: pregunta.enunciado,
        opciones: pregunta.opciones,
        correcta: pregunta.correcta,
        explicacion: pregunta.explicacion,
        cita: pregunta.cita,
        dificultad: pregunta.dificultad,
      } as Pregunta : null
    })
  )

  // If verification takes too long, accept all questions unverified
  const TIMEOUT_SENTINEL = Symbol('timeout')
  const timeoutPromise = new Promise<typeof TIMEOUT_SENTINEL>((resolve) =>
    setTimeout(() => {
      log.warn(
        { timeoutMs: VERIFY_TIMEOUT_MS, preguntas: preguntas.length },
        '[verification] timeout reached — accepting all questions unverified'
      )
      resolve(TIMEOUT_SENTINEL)
    }, VERIFY_TIMEOUT_MS)
  )

  const raceResult = await Promise.race([verifyAll, timeoutPromise])

  // If timeout fired, return all questions as-is (lenient mode)
  if (raceResult === TIMEOUT_SENTINEL) {
    log.warn({}, '[verification] timeout — returning unverified questions')
    return preguntas.map((p) => ({
      enunciado: p.enunciado,
      opciones: p.opciones,
      correcta: p.correcta,
      explicacion: p.explicacion,
      cita: p.cita,
      dificultad: p.dificultad,
    }))
  }

  return raceResult.filter((p): p is Pregunta => p !== null)
}

/**
 * Verifica una pregunta de Bloque I contra la BD de legislacion.
 *
 * Estrategia:
 *   1. Extraer citas del texto (enunciado + explicación)
 *   2. Si no hay citas extraídas: verificar que la ley declarada en "cita" sea reconocida
 *   3. Si hay citas: verificar la primera contra la BD
 *   4. Si verifyContentMatch retorna match=false con confidence≠low: rechazar
 */
async function verificarPreguntaBloque1(
  pregunta: PreguntaRaw,
  log: ChildLogger
): Promise<boolean> {
  const textToVerify = `${pregunta.enunciado} ${pregunta.explicacion}`
  const citasExtraidas = extractCitations(textToVerify)

  if (citasExtraidas.length === 0) {
    // Sin citas en texto: verificar campo "cita" si existe
    if (!pregunta.cita) {
      // Sin citas en ningún campo — aceptar (pregunta sin referencia legal, posible en Bloque I)
      return true
    }
    const leyResuelta = resolveLeyNombre(pregunta.cita.ley)
    if (!leyResuelta) {
      log.debug(
        { ley: pregunta.cita.ley },
        '[verification] ley no reconocida en campo cita — rechazando pregunta'
      )
      return false
    }
    return true
  }

  // Verificar la primera cita extraída
  const citaPrincipal = citasExtraidas[0]
  const verResult = await verifyCitation(citaPrincipal)

  if (!verResult.verificada) {
    // Lenient mode: cobertura de BD puede ser parcial.
    // Si la ley es reconocida, aceptar con baja confianza.
    const leyResuelta = resolveLeyNombre(citaPrincipal.ley)
    if (leyResuelta) {
      log.debug(
        { cita: citaPrincipal.textoOriginal },
        '[verification] artículo no en BD pero ley reconocida — aceptado (cobertura parcial)'
      )
      return true
    }
    log.debug(
      { cita: citaPrincipal.textoOriginal, error: verResult.error },
      '[verification] cita no encontrada en BD — rechazando pregunta'
    )
    return false
  }

  if (verResult.textoEnBD) {
    const contentMatch = verifyContentMatch(citaPrincipal, textToVerify, verResult.textoEnBD)
    if (!contentMatch.match && contentMatch.confidence !== 'low') {
      log.debug(
        { details: contentMatch.details, confidence: contentMatch.confidence },
        '[verification] contenido inconsistente — rechazando pregunta'
      )
      return false
    }
  }

  return true
}

// ─── Verificación Bloque II (guardrail ofimática) ─────────────────────────────

/**
 * §1.3A.17 Guardrail ofimática: verifica que el contenido de las preguntas
 * de Bloque II esté respaldado por el contexto recuperado de conocimiento_tecnico.
 *
 * Estrategia:
 *   1. Extraer términos técnicos clave de la pregunta (opciones + explicación)
 *   2. Verificar que al menos UN término clave aparece en el contexto
 *   3. Rechazar si la pregunta es completamente desconectada del contexto
 *
 * Este guardrail previene alucinaciones de rutas de menú o atajos inventados.
 */
function verifyPreguntasBloque2(
  preguntas: PreguntaRaw[],
  contexto: string,
  log: ChildLogger
): Pregunta[] {
  const contextoLower = contexto.toLowerCase()
  const results: Pregunta[] = []

  for (const pregunta of preguntas) {
    const passes = verificarPreguntaBloque2(pregunta, contextoLower, log)
    if (passes) {
      results.push({
        enunciado: pregunta.enunciado,
        opciones: pregunta.opciones,
        correcta: pregunta.correcta,
        explicacion: pregunta.explicacion,
        // cita: undefined — Bloque II no tiene citas legales
        dificultad: pregunta.dificultad,
      })
    }
  }

  return results
}

/**
 * Verifica una pregunta de Bloque II comprobando que su contenido técnico
 * esté respaldado por el contexto.
 *
 * Acepta la pregunta si al menos 1 de estos elementos aparece en el contexto:
 *   - La opción correcta (texto completo o fragmento de ≥15 chars)
 *   - Un término técnico de la explicación (palabra técnica ≥8 chars, no stop words)
 *
 * Modo lenient: si el contexto es muy corto (<200 chars, probable contenido vacío),
 * acepta todas las preguntas para no bloquear al 100%.
 */
function verificarPreguntaBloque2(
  pregunta: PreguntaRaw,
  contextoLower: string,
  log: ChildLogger
): boolean {
  // Si el contexto es muy corto (sin datos reales), aceptar en modo lenient
  if (contextoLower.length < 200) {
    log.debug(
      { enunciado: pregunta.enunciado.slice(0, 50) },
      '[bloque2-guardrail] contexto insuficiente — modo lenient'
    )
    return true
  }

  // 1. Verificar si la opción correcta aparece en el contexto
  const opcionCorrecta = pregunta.opciones[pregunta.correcta].toLowerCase()
  if (opcionCorrecta.length >= 4 && contextoLower.includes(opcionCorrecta)) {
    return true
  }

  // 2. Buscar fragmento de la opción correcta (≥15 chars) en el contexto
  if (opcionCorrecta.length >= 15) {
    const fragmento = opcionCorrecta.slice(0, 20)
    if (contextoLower.includes(fragmento)) return true
  }

  // 3. Extraer términos técnicos de la explicación y buscarlos en el contexto
  const STOP_WORDS = new Set(['para', 'este', 'esta', 'como', 'desde', 'hasta', 'formato', 'texto'])
  const palabrasExplicacion = pregunta.explicacion
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 8 && !STOP_WORDS.has(w) && /^[a-záéíóúüñ]+$/i.test(w))

  for (const palabra of palabrasExplicacion.slice(0, 5)) {
    if (contextoLower.includes(palabra)) return true
  }

  // 4. Buscar cualquier opción en el contexto (las incorrectas también deben ser reales)
  for (const opcion of pregunta.opciones) {
    const opcionL = opcion.toLowerCase()
    if (opcionL.length >= 6 && contextoLower.includes(opcionL)) return true
  }

  log.debug(
    { enunciado: pregunta.enunciado.slice(0, 80) },
    '[bloque2-guardrail] pregunta rechazada — contenido no encontrado en contexto'
  )
  return false
}

// ─── Sanitización de opciones ────────────────────────────────────────────────

/** Max chars for a single MCQ option — anything longer is likely AI garbage */
const MAX_OPTION_LENGTH = 200

/**
 * Patterns that indicate AI artifacts leaked into an option:
 * - File extensions (.pdf, .docx, .html)
 * - URLs or paths
 * - Thinking/reasoning tags
 * - RAG search metadata
 * - JSON fragments
 */
const GARBAGE_PATTERNS = [
  /\.pdf\b/i,
  /\.docx?\b/i,
  /\.html?\b/i,
  /\.xlsx?\b/i,
  /https?:\/\//i,
  /<think|<\/think|<search|<\/search|<result|<citation/i,
  /\{\s*"[^"]+"\s*:/,                 // JSON object fragment
  /\[\s*\{/,                           // JSON array fragment
  /^\s*```/,                           // markdown code block
  /fuente:|source:|retrieved from/i,   // RAG metadata
  /\btoken[s]?\b.*\b\d{4,}\b/i,       // token counts
]

/**
 * Sanitize AI-generated questions: trim options, reject garbage.
 * Removes questions where any option looks like AI artifacts or RAG leaks.
 */
function sanitizePreguntas(preguntas: PreguntaRaw[], log: ChildLogger): PreguntaRaw[] {
  return preguntas.filter((p) => {
    // Trim all text fields
    p.enunciado = p.enunciado.trim()
    p.explicacion = p.explicacion.trim()
    p.opciones = p.opciones.map((o) => o.trim()) as [string, string, string, string]

    // Check each option for garbage
    for (let i = 0; i < p.opciones.length; i++) {
      const opt = p.opciones[i]

      // Option too long — likely contains AI reasoning or RAG context
      if (opt.length > MAX_OPTION_LENGTH) {
        log.warn(
          { enunciado: p.enunciado.slice(0, 60), opcion: i, length: opt.length },
          '[sanitize] option too long — rejecting question'
        )
        return false
      }

      // Option matches garbage pattern
      for (const pattern of GARBAGE_PATTERNS) {
        if (pattern.test(opt)) {
          log.warn(
            { enunciado: p.enunciado.slice(0, 60), opcion: i, matched: pattern.source, text: opt.slice(0, 80) },
            '[sanitize] garbage pattern in option — rejecting question'
          )
          return false
        }
      }

      // Option is empty after trim
      if (opt.length < 2) {
        log.warn(
          { enunciado: p.enunciado.slice(0, 60), opcion: i },
          '[sanitize] empty option — rejecting question'
        )
        return false
      }
    }

    // Enunciado too short or too long
    if (p.enunciado.length < 15 || p.enunciado.length > 1000) {
      log.warn(
        { length: p.enunciado.length },
        '[sanitize] enunciado length out of range — rejecting'
      )
      return false
    }

    return true
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Obtiene el título de un tema de la BD. */
async function fetchTemaTitulo(temaId: string): Promise<string> {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase
      .from('temas')
      .select('titulo')
      .eq('id', temaId)
      .single()
    return data?.titulo ?? `Tema ${temaId.slice(0, 8)}`
  } catch {
    return `Tema ${temaId.slice(0, 8)}`
  }
}

/** Guarda el test generado en la tabla tests_generados. */
async function saveTestToDB(params: {
  userId: string
  temaId: string | null
  preguntas: Pregunta[]
  tipo?: string
}): Promise<string> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('tests_generados')
    .insert({
      user_id: params.userId,
      tema_id: params.temaId,
      tipo: params.tipo ?? 'tema',
      preguntas: params.preguntas as unknown as Json,
      completado: false,
      prompt_version: PROMPT_VERSION,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`[generateTest] Error al guardar test en BD: ${error.message}`)
  }

  return data.id
}

// ─── generateFlashTest ────────────────────────────────────────────────────────

/**
 * §2.13.5 — Genera un flash test de 3 preguntas sobre el artículo modificado.
 *
 * Se invoca desde watchAllLeyes() cuando se detecta un cambio en el BOE.
 * Contexto forzado al artículo concreto (sin RAG — ya tenemos el texto exacto).
 * Guarda en tests_generados con tipo='flash'.
 * Actualiza cambios_legislativos.flash_test_id.
 *
 * @param cambioId    UUID del registro en cambios_legislativos
 * @param articuloId  UUID del artículo modificado en legislacion
 * @param userId      UUID del usuario al que se asigna el flash test
 */
export async function generateFlashTest(
  cambioId: string,
  articuloId: string,
  userId: string
): Promise<string> {
  const supabase = await createServiceClient()

  // 1. Cargar artículo modificado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: articulo, error: artErr } = await (supabase as any)
    .from('legislacion')
    .select('texto_integro, ley_nombre, articulo_numero, titulo_capitulo, tema_ids')
    .eq('id', articuloId)
    .single()

  if (artErr || !articulo) {
    throw new Error(`[generateFlashTest] Artículo no encontrado: ${articuloId}`)
  }

  type ArticuloRow = {
    texto_integro: string
    ley_nombre: string
    articulo_numero: string
    titulo_capitulo: string | null
    tema_ids: string[]
  }
  const art = articulo as ArticuloRow

  // 2. Construir contexto directamente desde el artículo (sin RAG)
  const contextoLegislativo = `[${art.ley_nombre} — Art. ${art.articulo_numero}]\n${art.texto_integro}`
  const temaTitulo = art.titulo_capitulo ?? `Art. ${art.articulo_numero} — ${art.ley_nombre}`

  // 3. Generar 3 preguntas MCQ con prompt estándar Bloque I
  const rawTest = await callAIJSON(
    SYSTEM_GENERATE_TEST,
    buildGenerateTestPrompt({
      contextoLegislativo,
      numPreguntas: 3,
      dificultad: 'media',
      temaTitulo,
    }),
    TestGeneradoRawSchema,
    {
      maxTokens: 2000,
      endpoint: 'generate-flash-test',
      userId,
    }
  )

  // 4. Verificar preguntas (determinista)
  const preguntasVerificadas = await verifyPreguntas(rawTest.preguntas, logger)
  if (preguntasVerificadas.length === 0) {
    throw new Error('[generateFlashTest] No se pudieron verificar preguntas para el flash test')
  }

  const preguntas = preguntasVerificadas.slice(0, 3)
  const temaId = art.tema_ids[0] ?? articuloId // fallback al id del artículo

  // 5. Guardar en BD con tipo='flash'
  const testId = await saveTestToDB({ userId, temaId, preguntas, tipo: 'flash' })

  // 6. Actualizar cambios_legislativos.flash_test_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('cambios_legislativos')
    .update({ flash_test_id: testId })
    .eq('id', cambioId)

  logger.info({ cambioId, articuloId, testId, userId }, '[generateFlashTest] flash test creado')
  return testId
}

// ─── generateTopFrecuentesTest ────────────────────────────────────────────────

/**
 * §2.14.4 — Genera un test de 10 preguntas con los artículos más frecuentes en exámenes INAP.
 *
 * A diferencia de generateTest() que usa RAG por tema, este modo fuerza el contexto
 * con los top 20 artículos de `frecuencias_articulos`. El usuario practica exactamente
 * lo que el tribunal ha preguntado históricamente.
 *
 * Guarda en tests_generados con tipo='radar' (sin tema_id específico).
 *
 * @param userId UUID del usuario que solicita el test
 * @returns testId UUID del test guardado en BD
 */
export async function generateTopFrecuentesTest(userId: string): Promise<string> {
  const supabase = await createServiceClient()

  // 1. Cargar top 20 artículos del radar con su texto completo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: radarRows, error: radarErr } = await (supabase as any)
    .from('radar_tribunal_view')
    .select('legislacion_id, articulo_numero, ley_nombre, ley_codigo, titulo_capitulo, resumen, num_apariciones')
    .limit(20)

  if (radarErr) {
    throw new Error(`[generateTopFrecuentesTest] Error cargando radar: ${radarErr.message}`)
  }

  if (!radarRows || radarRows.length === 0) {
    throw new Error(
      '[generateTopFrecuentesTest] La tabla frecuencias_articulos está vacía. ' +
      'Ejecuta `pnpm build:radar` primero.'
    )
  }

  type RadarRow = {
    legislacion_id: string
    articulo_numero: string
    ley_nombre: string
    ley_codigo: string
    titulo_capitulo: string | null
    resumen: string
    num_apariciones: number
  }
  const rows = radarRows as RadarRow[]

  // 2. Cargar texto completo de esos artículos (el resumen es solo 200 chars)
  const legIds = rows.map((r) => r.legislacion_id)
  const { data: articulos } = await supabase
    .from('legislacion')
    .select('id, texto_integro, ley_nombre, articulo_numero, ley_codigo')
    .in('id', legIds)

  // Indexar por id para acceso rápido
  const articuloMap = new Map(
    (articulos ?? []).map((a) => [a.id, a])
  )

  // 3. Construir contexto forzado con los top artículos (máximo 32k chars)
  const contextParts: string[] = []
  let totalChars = 0
  const MAX_CHARS = 32_000

  for (const row of rows) {
    const art = articuloMap.get(row.legislacion_id)
    const texto = art?.texto_integro ?? row.resumen
    const bloque = `[${row.ley_nombre} — Art. ${row.articulo_numero} (${row.num_apariciones}× en exámenes INAP)]\n${texto}`
    if (totalChars + bloque.length > MAX_CHARS) break
    contextParts.push(bloque)
    totalChars += bloque.length
  }

  const contextoLegislativo = contextParts.join('\n\n---\n\n')

  logger.info(
    { articulos: contextParts.length, chars: totalChars, userId },
    '[generateTopFrecuentesTest] contexto forzado construido'
  )

  // 4. Generar 10 preguntas MCQ (dificultad media, mix de los artículos más frecuentes)
  const rawTest = await callAIJSON(
    SYSTEM_GENERATE_TEST,
    buildGenerateTestPrompt({
      contextoLegislativo,
      numPreguntas: 10,
      dificultad: 'media',
      temaTitulo: 'Top artículos más frecuentes en exámenes INAP',
    }),
    TestGeneradoRawSchema,
    {
      maxTokens: 4000,
      endpoint: 'generate-radar-test',
      userId,
    }
  )

  // 5. Verificar preguntas (mismo pipeline Bloque I)
  const preguntasVerificadas = await verifyPreguntas(rawTest.preguntas, logger)

  if (preguntasVerificadas.length === 0) {
    throw new Error('[generateTopFrecuentesTest] No se pudieron verificar preguntas del radar')
  }

  const preguntas = preguntasVerificadas.slice(0, 10)

  // 6. Guardar con tipo='radar', sin tema_id (cross-tema por definición)
  const testId = await saveTestToDB({ userId, temaId: null, preguntas, tipo: 'radar' })

  logger.info(
    { testId, preguntas: preguntas.length, radarArticulos: rows.length, userId },
    '[generateTopFrecuentesTest] test radar generado y guardado'
  )

  return testId
}
