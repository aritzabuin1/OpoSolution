import Anthropic from '@anthropic-ai/sdk'
import { type ZodType } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { sanitizeForAI } from '@/lib/utils/sanitize'
import { logger } from '@/lib/logger'

/**
 * Cliente Claude API para OPTEK.
 *
 * DDIA Principles aplicados:
 *   Reliability    → maxRetries=2 con exponential backoff (built-in SDK), timeout 30s
 *                  → Circuit Breaker (§1.6.3): OPEN tras 5 fallos, reset a los 60s
 *   Consistency    → sanitizeForAI() elimina PII antes de enviar (GDPR ADR-0009)
 *   Observability  → INSERT en api_usage_log tras cada llamada (coste en tiempo real)
 *
 * Arquitectura de modelos (ADR-0010 — pricing economics):
 *   Tests MCQ    → claude-haiku-4-5  (~0.005€/test) → usar callClaudeHaiku()
 *   Correcciones → claude-sonnet-4-6 (~0.035€/corrección) → usar callClaude()
 *
 * Costes por modelo:
 *   Haiku  4.5: Input $0.80/1M  | Output $4.00/1M
 *   Sonnet 4.6: Input $3.00/1M  | Output $15.00/1M
 */

// DDIA Reliability: singleton con maxRetries + timeout globales
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 30_000,  // 30s máx — previene requests colgados
  maxRetries: 2,    // exponential backoff automático en 429/529
})

// Sonnet 4.6 — para correcciones y tareas complejas
const SONNET_COST_PER_1K_INPUT_CENTS  = 0.30  // $3.00/1M tokens
const SONNET_COST_PER_1K_OUTPUT_CENTS = 1.50  // $15.00/1M tokens

// Haiku 4.5 — para generación de tests (barato, suficiente para MCQ)
const HAIKU_COST_PER_1K_INPUT_CENTS  = 0.008  // $0.80/1M tokens
const HAIKU_COST_PER_1K_OUTPUT_CENTS = 0.040  // $4.00/1M tokens

// Alias legible para compatibilidad con código existente
const COST_PER_1K_INPUT_CENTS  = SONNET_COST_PER_1K_INPUT_CENTS
const COST_PER_1K_OUTPUT_CENTS = SONNET_COST_PER_1K_OUTPUT_CENTS

// ─── Temperaturas recomendadas (§1.6.5) ───────────────────────────────────────

/**
 * Temperaturas canónicas por tipo de tarea.
 * Valores bajos → mayor reproducibilidad (tests, flashcards).
 * Valores medios → balance entre consistencia y variedad (correcciones).
 */
export const TEMPERATURES = {
  GENERATE_TEST:        0.3,  // reproducible — preguntas determinadas por texto legal
  CORRECT_DESARROLLO:   0.4,  // algo de variedad en feedback sin inventar datos
  GENERATE_FLASHCARD:   0.3,  // reproducible — extracto fiel del artículo
} as const

// ─── Circuit Breaker (§1.6.3) ─────────────────────────────────────────────────

/**
 * Circuit Breaker para proteger la API de Claude.
 *
 * Estados:
 *   CLOSED   → normal, requests pasan
 *   OPEN     → rechazando — demasiados fallos recientes
 *   HALF_OPEN → probando — permite 1 request tras el período de reset
 *
 * Configuración:
 *   5 fallos consecutivos  → OPEN
 *   60s en OPEN            → HALF_OPEN (permite 1 request de prueba)
 *   1 éxito en HALF_OPEN   → CLOSED
 *   1 fallo en HALF_OPEN   → OPEN (reinicia el timer)
 */
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreaker {
  state: CircuitState
  failures: number
  lastFailureAt: number
}

// Exportado para tests únicamente — no modificar en producción
export const circuit: CircuitBreaker = {
  state: 'CLOSED',
  failures: 0,
  lastFailureAt: 0,
}

const CIRCUIT_FAILURE_THRESHOLD = 5
const CIRCUIT_RESET_MS          = 60_000  // 60s

/** Lanza si el circuito está OPEN y no ha pasado el tiempo de reset. */
function checkCircuit(): void {
  if (circuit.state === 'OPEN') {
    const elapsed = Date.now() - circuit.lastFailureAt
    if (elapsed > CIRCUIT_RESET_MS) {
      circuit.state = 'HALF_OPEN'
    } else {
      throw new Error('IA temporalmente no disponible. Inténtalo en unos segundos.')
    }
  }
}

/** Llamar tras cada request exitosa. Cierra el circuito y limpia contadores. */
function onSuccess(): void {
  circuit.state    = 'CLOSED'
  circuit.failures = 0
}

/** Llamar tras cada fallo. Abre el circuito si se supera el threshold. */
function onFailure(): void {
  circuit.failures++
  circuit.lastFailureAt = Date.now()
  if (circuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuit.state = 'OPEN'
    logger.warn({ failures: circuit.failures }, '[circuit] OPEN — rechazando requests')
  }
}

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export interface ClaudeCallOptions {
  model?: string
  maxTokens?: number
  systemPrompt?: string
  requestId?: string
  endpoint?: string
  userId?: string
}

// ─── callClaude (Sonnet — correcciones) ───────────────────────────────────────

/**
 * Llama a Claude con sanitización de PII, logging de tokens y manejo de errores.
 *
 * @param userContent - Contenido del usuario (se sanitiza antes de enviar)
 * @param options     - Configuración de la llamada
 * @returns           - Texto de la respuesta de Claude
 * @throws            - Error si la llamada falla (después de retries) o circuito OPEN
 */
export async function callClaude(
  userContent: string,
  options: ClaudeCallOptions = {}
): Promise<string> {
  const {
    model = 'claude-sonnet-4-6',
    maxTokens = 1000,
    systemPrompt,
    requestId,
    endpoint = 'unknown',
    userId,
  } = options

  // Circuit Breaker: lanza si OPEN sin período de reset cumplido
  checkCircuit()

  const start = Date.now()
  const log = requestId ? logger.child({ requestId }) : logger

  // DDIA Consistency + GDPR: sanitizar ANTES de enviar a Claude (ADR-0009)
  const sanitizedContent = sanitizeForAI(userContent)

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: sanitizedContent }],
    })

    const latencyMs = Date.now() - start
    const tokensIn = response.usage.input_tokens
    const tokensOut = response.usage.output_tokens
    const costCents = Math.ceil(
      (tokensIn * COST_PER_1K_INPUT_CENTS + tokensOut * COST_PER_1K_OUTPUT_CENTS) / 1000
    )

    log.info({ endpoint, tokensIn, tokensOut, latencyMs, costCents }, 'Claude call OK')
    onSuccess()

    // DDIA Observability: INSERT no-bloqueante — fallo en log no rompe la request
    void logApiUsage({ userId, endpoint, model, tokensIn, tokensOut, costCents })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error(`Claude returned unexpected content type: ${content.type}`)
    }
    return content.text
  } catch (err) {
    const latencyMs = Date.now() - start
    log.error({ err, endpoint, latencyMs }, 'Claude call failed')
    onFailure()
    throw err
  }
}

// ─── callClaudeHaiku (MCQ — barato) ───────────────────────────────────────────

/**
 * Llama a Claude Haiku para generación de tests MCQ.
 *
 * Haiku es suficiente para preguntas tipo test bien estructuradas.
 * Coste ~0.005€/test vs ~0.018€ con Sonnet → 72% más barato.
 * Esto hace económicamente viable los tests ilimitados (ADR-0010).
 */
export async function callClaudeHaiku(
  userContent: string,
  options: Omit<ClaudeCallOptions, 'model'> = {}
): Promise<string> {
  const { maxTokens = 1500, systemPrompt, requestId, endpoint = 'unknown', userId } = options
  const model = 'claude-haiku-4-5-20251001'

  // Circuit Breaker: lanza si OPEN sin período de reset cumplido
  checkCircuit()

  const start = Date.now()
  const log = requestId ? logger.child({ requestId }) : logger

  const sanitizedContent = sanitizeForAI(userContent)

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: sanitizedContent }],
    })

    const latencyMs = Date.now() - start
    const tokensIn = response.usage.input_tokens
    const tokensOut = response.usage.output_tokens
    const costCents = Math.ceil(
      (tokensIn * HAIKU_COST_PER_1K_INPUT_CENTS + tokensOut * HAIKU_COST_PER_1K_OUTPUT_CENTS) /
        1000
    )

    log.info({ endpoint, tokensIn, tokensOut, latencyMs, costCents, model }, 'Haiku call OK')
    onSuccess()
    void logApiUsage({ userId, endpoint, model, tokensIn, tokensOut, costCents })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error(`Claude Haiku returned unexpected content type: ${content.type}`)
    }
    return content.text
  } catch (err) {
    const latencyMs = Date.now() - start
    log.error({ err, endpoint, latencyMs, model }, 'Haiku call failed')
    onFailure()
    throw err
  }
}

// ─── callClaudeJSON (§1.6.4) ──────────────────────────────────────────────────

/**
 * Llama a Claude esperando una respuesta JSON validada con Zod.
 *
 * Flujo:
 *   1. Añade instrucción JSON al system prompt
 *   2. Llama a Haiku (por defecto) o Sonnet según options.model
 *   3. JSON.parse() → schema.safeParse()
 *   4. Si falla: retry 1 vez con prompt de corrección
 *   5. Si sigue fallando: throw con mensaje descriptivo
 *
 * @param systemPrompt - System prompt base (se le añade instrucción JSON)
 * @param userPrompt   - Prompt del usuario
 * @param schema       - Schema Zod para validar la respuesta
 * @param options      - Opciones de la llamada (model, maxTokens, etc.)
 * @returns            - Objeto validado y tipado
 * @throws             - Error descriptivo si el JSON sigue siendo inválido tras retry
 */
export async function callClaudeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodType<T>,
  options: ClaudeCallOptions = {}
): Promise<T> {
  const jsonSystemPrompt =
    systemPrompt + '\nResponde ÚNICAMENTE con JSON válido, sin markdown, sin texto adicional.'

  // Por defecto usa Haiku — suficiente para generación de JSON estructurado
  const useHaiku = options.model !== 'claude-sonnet-4-6'

  const callFn = useHaiku
    ? (prompt: string, sys: string) =>
        callClaudeHaiku(prompt, { ...options, systemPrompt: sys })
    : (prompt: string, sys: string) =>
        callClaude(prompt, { ...options, systemPrompt: sys })

  // ── Intento 1 ─────────────────────────────────────────────────────────────
  const rawResponse = await callFn(userPrompt, jsonSystemPrompt)

  const parsed1 = tryParseAndValidate(rawResponse, schema)
  if (parsed1.success) return parsed1.data

  // ── Retry con prompt de corrección ────────────────────────────────────────
  logger.warn(
    { parseError: parsed1.error, attempt: 2 },
    'callClaudeJSON: respuesta inválida — reintentando'
  )

  const retryPrompt =
    'Tu respuesta anterior no era JSON válido. Responde SOLO con JSON.\n\n' +
    `Error de validación: ${parsed1.error}\n\n` +
    'Prompt original:\n' + userPrompt

  const rawRetry = await callFn(retryPrompt, jsonSystemPrompt)

  const parsed2 = tryParseAndValidate(rawRetry, schema)
  if (parsed2.success) return parsed2.data

  // ── Fallo definitivo ──────────────────────────────────────────────────────
  throw new Error(
    `callClaudeJSON: la respuesta de Claude no es JSON válido tras 2 intentos. ` +
      `Error: ${parsed2.error}. ` +
      `Respuesta recibida: ${rawRetry.slice(0, 200)}`
  )
}

// ─── callClaudeStream (§1.6.5) ────────────────────────────────────────────────

/**
 * Llama a Claude en modo streaming y retorna un ReadableStream de chunks de texto.
 *
 * Pensado para SSE en endpoints Next.js que retornan respuestas progresivas
 * al frontend (feedback en tiempo real).
 *
 * @param systemPrompt - System prompt
 * @param userPrompt   - Prompt del usuario
 * @param options      - Opciones de la llamada
 * @returns            - ReadableStream<string> que emite chunks de texto
 */
export async function callClaudeStream(
  systemPrompt: string,
  userPrompt: string,
  options: ClaudeCallOptions = {}
): Promise<ReadableStream<string>> {
  const {
    model = 'claude-sonnet-4-6',
    maxTokens = 2000,
    requestId,
    endpoint = 'unknown',
  } = options

  // Circuit Breaker: lanza si OPEN
  checkCircuit()

  const log = requestId ? logger.child({ requestId }) : logger

  const sanitizedContent = sanitizeForAI(userPrompt)

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: sanitizedContent }],
  })

  log.info({ endpoint, model }, 'Claude stream started')

  return new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(event.delta.text)
          }
        }
        onSuccess()
        controller.close()
      } catch (err) {
        log.error({ err, endpoint }, 'Claude stream error')
        onFailure()
        controller.error(err)
      }
    },
    cancel() {
      stream.controller.abort()
    },
  })
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Intenta parsear JSON y validar con Zod.
 * Retorna discriminated union para manejo de errores.
 */
function tryParseAndValidate<T>(
  raw: string,
  schema: ZodType<T>
): { success: true; data: T } | { success: false; error: string } {
  let parsed: unknown
  try {
    // Limpiar posibles bloques markdown (```json ... ```)
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
    parsed = JSON.parse(cleaned)
  } catch {
    return { success: false, error: `JSON.parse falló: ${raw.slice(0, 100)}` }
  }

  const result = schema.safeParse(parsed)
  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    error: JSON.stringify(result.error.issues?.slice(0, 3) ?? result.error),
  }
}

async function logApiUsage(params: {
  userId?: string
  endpoint: string
  model: string
  tokensIn: number
  tokensOut: number
  costCents: number
}) {
  try {
    const supabase = await createServiceClient()
    await supabase.from('api_usage_log').insert({
      user_id: params.userId ?? null,
      endpoint: params.endpoint,
      model: params.model,
      tokens_in: params.tokensIn,
      tokens_out: params.tokensOut,
      cost_estimated_cents: params.costCents,
    })
  } catch (err) {
    // Non-blocking: advertir pero no propagar el error
    logger.warn({ err }, 'api_usage_log INSERT failed — non-blocking')
  }
}
