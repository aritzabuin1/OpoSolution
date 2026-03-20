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
import { extractCitations, batchVerifyCitations, verifyContentMatch } from '@/lib/ai/verification'
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
 * 2.2.0: Explicaciones pedagógicas (cita textual + por qué cada distractor es incorrecto).
 */
export const PROMPT_VERSION = '2.2.0'

// Single-pass: no retries. Generate once → verify → return what passes.
// Retries were the #1 cause of timeouts (each retry = 15-20s extra OpenAI call).
// Modelo seleccionado automáticamente por provider.ts (mini/light por defecto)

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface GenerateTestParams {
  temaId: string
  numPreguntas: number
  dificultad: 'facil' | 'media' | 'dificil'
  userId: string
  requestId?: string
  oposicionId?: string
  deviceType?: string
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
  const { temaId, numPreguntas, dificultad, userId, requestId, oposicionId, deviceType } = params
  const log = requestId ? logger.child({ requestId }) : logger
  const start = Date.now()

  // ── 1. Contexto RAG + título del tema + ejemplos INAP (todo en paralelo) ──

  const [ctx, temaTitulo, ejemplosExamenRaw] = await Promise.all([
    buildContext(temaId, undefined, userId), // §2.11: userId habilita weakness-weighted RAG
    fetchTemaTitulo(temaId),
    retrieveExamples(temaId, 3),             // §1.4.4: preguntas oficiales INAP
  ])

  const contexto = formatContext(ctx)
  const { esBloqueII, temaNumero } = ctx

  // Solo usar ejemplos en Bloque I (legal), Bloque II no tiene preguntas INAP
  const ejemplosExamen = esBloqueII ? '' : ejemplosExamenRaw

  log.info(
    { temaId, tokensEstimados: ctx.tokensEstimados, strategy: ctx.strategy, temaTitulo, esBloqueII, temaNumero },
    '[generateTest] context built'
  )

  // ── 1b. Guard: si no hay contexto, no generar (evita meta-preguntas) ────
  if (ctx.articulos.length === 0) {
    throw new Error(
      esBloqueII
        ? `No hay contenido técnico disponible para "${temaTitulo}". ` +
          'La base de conocimiento de ofimática aún no cubre este tema.'
        : `No hay legislación indexada para "${temaTitulo}". ` +
          'Prueba con otro tema mientras completamos la base de datos.'
    )
  }

  // ── 2. Generación + verificación ─────────────────────────────────────────
  //
  // Optimización: split en chunks paralelos de máx CHUNK_SIZE preguntas.
  // Claude Haiku / gpt-4o-mini tarda ~22-28s para 10 preguntas difíciles → chunks de 10 en paralelo.
  // 30q difícil = 3 chunks × 12 preguntas ≈ 22-28s cada uno (todos en paralelo).
  // Vercel Hobby maxDuration=60s, SDK timeout=55s → margen seguro.

  const CHUNK_SIZE = 10
  const systemPrompt = esBloqueII ? SYSTEM_GENERATE_TEST_BLOQUE2 : SYSTEM_GENERATE_TEST

  /** Compute maxTokens based on chunk size and difficulty */
  function computeMaxTokens(n: number): number {
    // Base: ~400 tokens per easy question, ~550 per hard (explanation + cita + JSON overhead)
    const perQuestion = dificultad === 'dificil' ? 600 : dificultad === 'media' ? 500 : 450
    // Minimum 4000, generous ceiling to avoid truncation
    return Math.max(4000, Math.min(n * perQuestion + 1000, 16000))
  }

  /** Generate a chunk of questions via AI */
  async function generateChunk(needed: number): Promise<PreguntaRaw[]> {
    const userPrompt = esBloqueII
      ? buildGenerateTestBloque2Prompt({ contextoTecnico: contexto, numPreguntas: needed, dificultad, temaTitulo })
      : buildGenerateTestPrompt({ contextoLegislativo: contexto, numPreguntas: needed, dificultad, temaTitulo, ejemplosExamen })

    const rawTest = await callAIJSON(
      systemPrompt,
      userPrompt,
      TestGeneradoRawSchema,
      {
        maxTokens: computeMaxTokens(needed),
        endpoint: 'generate-test',
        userId,
        requestId,
        oposicionId,
        temperature: 0.5,
        deviceType,
      }
    )
    // Keep all questions — overgeneration is intentional
    return sanitizePreguntas(rawTest.preguntas, log)
  }

  // ── Single-pass: exact count, no overgeneration ─────────────────────────
  //
  // Strategy: generate exactly what's requested. After verification, if we
  // have fewer than numPreguntas, fill with real INAP questions from BD.
  // This eliminates wasted API calls from overgeneration.
  //
  // 10q = 1 call (chunk 10), 20q = 2 calls [10,10], 30q = 3 calls [10,10,10]

  // Ask AI for ~20% more than needed per chunk to absorb verification losses.
  // This is NOT overgeneration of total count — each chunk asks for slightly more
  // because the AI sometimes returns fewer than requested + verification filters some.
  const BUFFER_FACTOR = 1.2

  let sanitized: PreguntaRaw[]

  if (numPreguntas <= CHUNK_SIZE) {
    const toAsk = Math.ceil(numPreguntas * BUFFER_FACTOR)
    sanitized = await generateChunk(toAsk)
    log.info(
      { preguntasRaw: sanitized.length, requested: numPreguntas, asked: toAsk, esBloqueII },
      '[generateTest] single chunk complete'
    )
  } else {
    // Split into parallel chunks, each with buffer
    const chunks: number[] = []
    let remaining = numPreguntas
    while (remaining > 0) {
      const base = Math.min(CHUNK_SIZE, remaining)
      const withBuffer = Math.ceil(base * BUFFER_FACTOR)
      chunks.push(withBuffer)
      remaining -= base
    }
    const results = await Promise.all(
      chunks.map(async (size, i) => {
        try {
          return await generateChunk(size)
        } catch (err) {
          log.warn(
            { chunk: i, size, err: err instanceof Error ? err.message : String(err) },
            '[generateTest] chunk failed — continuing with remaining'
          )
          return [] as PreguntaRaw[]
        }
      })
    )
    sanitized = results.flat()
    log.info(
      { chunks: chunks.length, sizes: chunks, total: sanitized.length, esBloqueII },
      '[generateTest] parallel generation complete'
    )
  }

  // Verify
  const preguntasVerificadas = esBloqueII
    ? verifyPreguntasBloque2(sanitized, contexto, log)
    : await verifyPreguntas(sanitized, log)

  log.info(
    {
      generated: sanitized.length,
      verified: preguntasVerificadas.length,
      requested: numPreguntas,
    },
    '[generateTest] verification complete'
  )

  if (preguntasVerificadas.length === 0) {
    throw new Error(
      `[generateTest] Ninguna pregunta verificada para "${temaTitulo}". ` +
        'Inténtalo de nuevo o prueba con otro tema.'
    )
  }

  let preguntas = preguntasVerificadas.slice(0, numPreguntas)

  // ── Fill with official INAP questions if we have fewer than requested ──
  // Only for Bloque I (Bloque II has no official questions)
  if (!esBloqueII && preguntas.length < numPreguntas) {
    const needed = numPreguntas - preguntas.length
    const existingEnunciados = new Set(preguntas.map((p) => p.enunciado))
    const fillQuestions = await fillWithOfficialQuestions(temaId, needed, existingEnunciados, temaNumero)

    if (fillQuestions.length > 0) {
      // Fisher-Yates shuffle to mix official questions with AI-generated ones
      preguntas = [...preguntas, ...fillQuestions]
      for (let i = preguntas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [preguntas[i], preguntas[j]] = [preguntas[j], preguntas[i]]
      }

      log.info(
        { filled: fillQuestions.length, total: preguntas.length, requested: numPreguntas },
        '[generateTest] filled with official INAP questions'
      )
    }
  }

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
 * Verifica preguntas de Bloque I usando batch verification (1 DB query para todas).
 *
 * Strategy:
 *   1. Extract all citations from all questions
 *   2. ONE batch DB query to fetch all referenced articles
 *   3. Verify each question in-memory against fetched articles
 *   4. Timeout safety net — if batch query is slow, accept all unverified
 */
async function verifyPreguntas(preguntas: PreguntaRaw[], log: ChildLogger): Promise<Pregunta[]> {
  const VERIFY_TIMEOUT_MS = 5_000 // 5s — batch query should be <1s

  const verifyBatch = async (): Promise<Pregunta[]> => {
    // 1. Extract all citations from all questions
    const allCitations = preguntas.flatMap((p) => {
      const text = `${p.enunciado} ${p.explicacion}`
      return extractCitations(text)
    })

    // 2. Batch-fetch all referenced articles in ONE query
    let batchResults: Map<string, { verificada: boolean; textoEnBD?: string }>
    try {
      batchResults = allCitations.length > 0
        ? await batchVerifyCitations(allCitations)
        : new Map()
    } catch (err) {
      log.warn({ err, citations: allCitations.length }, '[verification] batch query failed — accepting all')
      batchResults = new Map()
    }

    // 3. Verify each question in-memory
    const verified: Pregunta[] = []
    const rejectionReasons: Record<string, number> = {}
    function reject(reason: string) {
      rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1
    }

    for (const pregunta of preguntas) {
      const textForCitations = `${pregunta.enunciado} ${pregunta.explicacion}`
      const citasExtraidas = extractCitations(textForCitations)

      let passes = true

      if (citasExtraidas.length === 0) {
        // No citations — check field-level cita if present
        if (pregunta.cita) {
          const leyResuelta = resolveLeyNombre(pregunta.cita.ley)
          if (!leyResuelta) {
            reject(`ley_no_reconocida:${pregunta.cita.ley}`)
            passes = false
          }
        }
        // No cita field either — accept (question without legal reference)
      } else {
        // Check first citation against batch results
        const citaPrincipal = citasExtraidas[0]
        const result = batchResults.get(citaPrincipal.textoOriginal)

        if (result && !result.verificada) {
          // Ley no reconocida and not in BD — reject
          const leyResuelta = resolveLeyNombre(citaPrincipal.ley)
          if (!leyResuelta) {
            reject(`cita_no_verificada:${citaPrincipal.textoOriginal}`)
            passes = false
          }
        }

        // Content match check (deterministic, no DB needed)
        if (passes && result?.textoEnBD) {
          // Only verify enunciado — explicacion contains intentionally wrong plazos for pedagogy
          const contentMatch = verifyContentMatch(citaPrincipal, pregunta.enunciado, result.textoEnBD)
          if (!contentMatch.match && contentMatch.confidence !== 'low') {
            reject(`contenido_inconsistente:${contentMatch.details}`)
            passes = false
          }
        }
      }

      if (passes) {
        verified.push({
          enunciado: pregunta.enunciado,
          opciones: pregunta.opciones,
          correcta: pregunta.correcta,
          explicacion: pregunta.explicacion,
          cita: pregunta.cita,
          dificultad: pregunta.dificultad,
        })
      }
    }

    if (Object.keys(rejectionReasons).length > 0) {
      log.info({ rejectionReasons, total: preguntas.length, passed: verified.length }, '[verification] rejection breakdown')
    }

    return verified
  }

  // Timeout safety net
  const TIMEOUT_SENTINEL = Symbol('timeout')
  const timeoutPromise = new Promise<typeof TIMEOUT_SENTINEL>((resolve) =>
    setTimeout(() => {
      log.warn({ timeoutMs: VERIFY_TIMEOUT_MS, preguntas: preguntas.length },
        '[verification] batch timeout — accepting all unverified')
      resolve(TIMEOUT_SENTINEL)
    }, VERIFY_TIMEOUT_MS)
  )

  const raceResult = await Promise.race([verifyBatch(), timeoutPromise])

  if (raceResult === TIMEOUT_SENTINEL) {
    return preguntas.map((p) => ({
      enunciado: p.enunciado,
      opciones: p.opciones,
      correcta: p.correcta,
      explicacion: p.explicacion,
      cita: p.cita,
      dificultad: p.dificultad,
    }))
  }

  return raceResult
}

// verificarPreguntaBloque1 eliminated — replaced by batch verification in verifyPreguntas

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
/** Fix repeated consecutive words: "Se se responde" → "Se responde" */
function fixRepeatedWords(text: string): string {
  return text.replace(/\b(\w+)\s+\1\b/gi, '$1')
}

function sanitizePreguntas(preguntas: PreguntaRaw[], log: ChildLogger): PreguntaRaw[] {
  return preguntas.filter((p) => {
    // Trim all text fields
    p.enunciado = p.enunciado.trim()
    p.explicacion = p.explicacion.trim()
    p.opciones = p.opciones.map((o) => o.trim()) as [string, string, string, string]

    // Fix repeated consecutive words in all text fields
    const origEnunciado = p.enunciado
    p.enunciado = fixRepeatedWords(p.enunciado)
    p.explicacion = fixRepeatedWords(p.explicacion)
    p.opciones = p.opciones.map((o) => fixRepeatedWords(o)) as [string, string, string, string]
    if (p.enunciado !== origEnunciado) {
      log.info(
        { before: origEnunciado.slice(0, 60), after: p.enunciado.slice(0, 60) },
        '[sanitize] fixed repeated words in enunciado'
      )
    }

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

// ─── Fill with official INAP questions ───────────────────────────────────────

/**
 * Fetches real INAP exam questions from `preguntas_oficiales` for a given tema.
 * Used as fallback when AI-generated questions don't pass verification.
 *
 * @param temaId UUID of the tema
 * @param needed Number of questions to fill
 * @param excludeEnunciados Set of enunciados already in the test (to avoid duplicates)
 * @param temaNumero Numeric tema number for fallback matching
 * @returns Array of Pregunta objects from official exams
 */
async function fillWithOfficialQuestions(
  _temaId: string,
  needed: number,
  excludeEnunciados: Set<string>,
  _temaNumero: number | null,
): Promise<Pregunta[]> {
  try {
    const supabase = await createServiceClient()

    // preguntas_oficiales.tema_id is usually NULL (not mapped yet).
    // Fetch a generous pool from any exam and shuffle to get variety.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('preguntas_oficiales')
      .select('enunciado, opciones, correcta')
      .limit(needed + 30)

    if (error || !data || data.length === 0) return []

    return mapOfficialQuestions(data, needed, excludeEnunciados)
  } catch {
    // Non-blocking — if official questions fail, just return fewer AI questions
    return []
  }
}

/** Maps raw preguntas_oficiales rows to Pregunta objects, deduplicating and shuffling */
function mapOfficialQuestions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[],
  needed: number,
  excludeEnunciados: Set<string>,
): Pregunta[] {
  // Fisher-Yates shuffle so we don't always get the same questions
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]]
  }

  const result: Pregunta[] = []
  for (const row of rows) {
    if (result.length >= needed) break
    if (excludeEnunciados.has(row.enunciado)) continue

    const opciones = Array.isArray(row.opciones) ? row.opciones : []
    if (opciones.length !== 4) continue

    result.push({
      enunciado: row.enunciado,
      opciones: opciones as [string, string, string, string],
      correcta: typeof row.correcta === 'number' ? row.correcta : 0,
      explicacion: 'Pregunta de examen oficial INAP.',
      dificultad: 'media',
    })
  }

  return result
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
export async function generateTopFrecuentesTest(userId: string, oposicionId?: string): Promise<string> {
  const supabase = await createServiceClient()

  // 1. Cargar top 20 artículos del radar con su texto completo, filtrado por oposición
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let radarQuery = (supabase as any)
    .from('radar_tribunal_view')
    .select('legislacion_id, articulo_numero, ley_nombre, ley_codigo, titulo_capitulo, resumen, num_apariciones')
  if (oposicionId) radarQuery = radarQuery.eq('oposicion_id', oposicionId)
  const { data: radarRows, error: radarErr } = await radarQuery.limit(20)

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
      maxTokens: 5000,
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
