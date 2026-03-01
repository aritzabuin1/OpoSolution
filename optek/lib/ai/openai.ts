import OpenAI from 'openai'
import { type ZodType } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { sanitizeForAI } from '@/lib/utils/sanitize'
import { logger } from '@/lib/logger'

/**
 * Cliente OpenAI GPT para OPTEK.
 * Espejo funcional de lib/ai/claude.ts — misma interfaz, diferente proveedor.
 *
 * DDIA Principles aplicados:
 *   Reliability    → maxRetries=2 con exponential backoff (built-in SDK), timeout 30s
 *                  → Circuit Breaker separado del de Claude (fallos independientes)
 *   Consistency    → sanitizeForAI() elimina PII antes de enviar (GDPR ADR-0009)
 *   Observability  → INSERT en api_usage_log tras cada llamada (coste en tiempo real)
 *
 * Arquitectura de modelos (ADR-0010 revisado — proveedor OpenAI):
 *   Tests MCQ    → gpt-5-mini (~0.003€/test) → usar callGPTMini()
 *   Correcciones → gpt-5     (~0.022€/corrección) → usar callGPT()
 *
 * Costes por modelo (precios Feb 2026):
 *   gpt-5-mini: Input $0.25/1M  | Output $2.00/1M   ← 3× más barato que Haiku
 *   gpt-5:      Input $1.25/1M  | Output $10.00/1M  ← 2× más barato que Sonnet
 *
 * Claude permanece disponible en lib/ai/claude.ts como fallback manual.
 */

// DDIA Reliability: singleton con maxRetries + timeout globales
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  timeout: 30_000,  // 30s máx — previene requests colgados
  maxRetries: 2,    // exponential backoff automático en 429/5xx
})

// Modelos canónicos
export const GPT_MODEL = 'gpt-5'       // para correcciones complejas
export const GPT_MINI_MODEL = 'gpt-5-mini'  // para generación MCQ (barato)

// gpt-5 — correcciones y análisis complejos
const GPT_COST_PER_1K_INPUT_CENTS = 0.50  // $5.00/1M tokens
const GPT_COST_PER_1K_OUTPUT_CENTS = 1.50   // $15.00/1M tokens

// gpt-5-mini — generación de tests MCQ (barato, suficiente)
const GPT_MINI_COST_PER_1K_INPUT_CENTS = 0.015  // $0.15/1M tokens
const GPT_MINI_COST_PER_1K_OUTPUT_CENTS = 0.060   // $0.60/1M tokens

// ─── Temperaturas recomendadas (mismos valores que claude.ts) ─────────────────

/**
 * Re-exportado para compatibilidad con módulos que importan TEMPERATURES.
 * Valores idénticos a claude.ts — la semántica no cambia al cambiar de modelo.
 */
export const TEMPERATURES = {
  GENERATE_TEST: 0.3,
  CORRECT_DESARROLLO: 0.4,
  GENERATE_FLASHCARD: 0.3,
} as const

// ─── Circuit Breaker ──────────────────────────────────────────────────────────

/**
 * Circuit Breaker independiente del de Claude.
 * Si OpenAI cae, Claude sigue disponible como fallback manual y viceversa.
 *
 * Estados:
 *   CLOSED   → normal, requests pasan
 *   OPEN     → rechazando — demasiados fallos recientes
 *   HALF_OPEN → probando — permite 1 request tras el período de reset
 *
 * Configuración:
 *   5 fallos consecutivos  → OPEN
 *   60s en OPEN            → HALF_OPEN (permite 1 request de prueba)
 */
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface CircuitBreaker {
  state: CircuitState
  failures: number
  lastFailureAt: number
}

// Exportado para tests únicamente
export const openaiCircuit: CircuitBreaker = {
  state: 'CLOSED',
  failures: 0,
  lastFailureAt: 0,
}

const CIRCUIT_FAILURE_THRESHOLD = 5
const CIRCUIT_RESET_MS = 60_000  // 60s

function checkCircuit(): void {
  if (openaiCircuit.state === 'OPEN') {
    const elapsed = Date.now() - openaiCircuit.lastFailureAt
    if (elapsed > CIRCUIT_RESET_MS) {
      openaiCircuit.state = 'HALF_OPEN'
    } else {
      throw new Error('IA temporalmente no disponible. Inténtalo en unos segundos.')
    }
  }
}

function onSuccess(): void {
  openaiCircuit.state = 'CLOSED'
  openaiCircuit.failures = 0
}

function onFailure(): void {
  openaiCircuit.failures++
  openaiCircuit.lastFailureAt = Date.now()
  if (openaiCircuit.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    openaiCircuit.state = 'OPEN'
    logger.warn({ failures: openaiCircuit.failures }, '[openai-circuit] OPEN — rechazando requests')
  }
}

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export interface GPTCallOptions {
  model?: string
  maxTokens?: number
  systemPrompt?: string
  requestId?: string
  endpoint?: string
  userId?: string
}

// ─── callGPT (GPT-4o — correcciones) ──────────────────────────────────────────

/**
 * Llama a GPT-5 con sanitización de PII, logging de tokens y manejo de errores.
 *
 * @param userContent - Contenido del usuario (se sanitiza antes de enviar)
 * @param options     - Configuración de la llamada
 * @returns           - Texto de la respuesta
 * @throws            - Error si la llamada falla (después de retries) o circuito OPEN
 */
export async function callGPT(
  userContent: string,
  options: GPTCallOptions = {}
): Promise<string> {
  const {
    model = GPT_MODEL,
    maxTokens = 1000,
    systemPrompt,
    requestId,
    endpoint = 'unknown',
    userId,
  } = options

  checkCircuit()

  const start = Date.now()
  const log = requestId ? logger.child({ requestId }) : logger

  // GDPR: sanitizar ANTES de enviar (ADR-0009)
  const sanitizedContent = sanitizeForAI(userContent)

  const messages: OpenAI.ChatCompletionMessageParam[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: sanitizedContent })

  try {
    const response = await openai.chat.completions.create({
      model,
      max_completion_tokens: maxTokens,
      messages,
    })

    const latencyMs = Date.now() - start
    const tokensIn = response.usage?.prompt_tokens ?? 0
    const tokensOut = response.usage?.completion_tokens ?? 0
    const costCents = Math.ceil(
      (tokensIn * GPT_COST_PER_1K_INPUT_CENTS + tokensOut * GPT_COST_PER_1K_OUTPUT_CENTS) / 1000
    )

    log.info({ endpoint, tokensIn, tokensOut, latencyMs, costCents }, 'GPT call OK')
    onSuccess()
    void logApiUsage({ userId, endpoint, model, tokensIn, tokensOut, costCents })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('GPT returned empty content')
    return text
  } catch (err) {
    const latencyMs = Date.now() - start
    log.error({ err, endpoint, latencyMs }, 'GPT call failed')
    onFailure()
    throw err
  }
}

// ─── callGPTMini (GPT-4o-mini — MCQ barato) ───────────────────────────────────

/**
 * Llama a GPT-5-mini para generación de tests MCQ.
 *
 * GPT-5-mini es suficiente para preguntas tipo test bien estructuradas.
 * Coste ~0.003€/test vs ~0.005€ con Haiku → 40% más barato.
 */
export async function callGPTMini(
  userContent: string,
  options: Omit<GPTCallOptions, 'model'> = {}
): Promise<string> {
  const { maxTokens = 1500, systemPrompt, requestId, endpoint = 'unknown', userId } = options
  const model = GPT_MINI_MODEL

  checkCircuit()

  const start = Date.now()
  const log = requestId ? logger.child({ requestId }) : logger
  const sanitizedContent = sanitizeForAI(userContent)

  const messages: OpenAI.ChatCompletionMessageParam[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: sanitizedContent })

  try {
    const response = await openai.chat.completions.create({
      model,
      max_completion_tokens: maxTokens,
      messages,
    })

    const latencyMs = Date.now() - start
    const tokensIn = response.usage?.prompt_tokens ?? 0
    const tokensOut = response.usage?.completion_tokens ?? 0
    const costCents = Math.ceil(
      (tokensIn * GPT_MINI_COST_PER_1K_INPUT_CENTS + tokensOut * GPT_MINI_COST_PER_1K_OUTPUT_CENTS) / 1000
    )

    log.info({ endpoint, tokensIn, tokensOut, latencyMs, costCents, model }, 'GPT-mini call OK')
    onSuccess()
    void logApiUsage({ userId, endpoint, model, tokensIn, tokensOut, costCents })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('GPT-mini returned empty content')
    return text
  } catch (err) {
    const latencyMs = Date.now() - start
    log.error({ err, endpoint, latencyMs, model }, 'GPT-mini call failed')
    onFailure()
    throw err
  }
}

// ─── callGPTJSON ──────────────────────────────────────────────────────────────

/**
 * Llama a GPT esperando una respuesta JSON validada con Zod.
 * Espejo funcional de callClaudeJSON — misma lógica de retry.
 *
 * Flujo:
 *   1. Añade instrucción JSON al system prompt
 *   2. Llama a GPT-4o-mini (por defecto) o GPT-4o según options.model
 *   3. JSON.parse() → schema.safeParse()
 *   4. Si falla: retry 1 vez con prompt de corrección
 *   5. Si sigue fallando: throw con mensaje descriptivo
 */
export async function callGPTJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodType<T>,
  options: GPTCallOptions = {}
): Promise<T> {
  const jsonSystemPrompt =
    systemPrompt + '\nResponde ÚNICAMENTE con JSON válido, sin markdown, sin texto adicional.'

  // Por defecto usa GPT-4o-mini — suficiente para JSON estructurado
  const useMini = options.model !== GPT_MODEL

  const callFn = useMini
    ? (prompt: string, sys: string) =>
      callGPTMini(prompt, { ...options, systemPrompt: sys })
    : (prompt: string, sys: string) =>
      callGPT(prompt, { ...options, systemPrompt: sys })

  // ── Intento 1 ─────────────────────────────────────────────────────────────
  const rawResponse = await callFn(userPrompt, jsonSystemPrompt)

  const parsed1 = tryParseAndValidate(rawResponse, schema)
  if (parsed1.success) return parsed1.data

  // ── Retry con prompt de corrección ────────────────────────────────────────
  logger.warn(
    { parseError: parsed1.error, attempt: 2 },
    'callGPTJSON: respuesta inválida — reintentando'
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
    `callGPTJSON: la respuesta de GPT no es JSON válido tras 2 intentos. ` +
    `Error: ${parsed2.error}. ` +
    `Respuesta recibida: ${rawRetry.slice(0, 200)}`
  )
}

// ─── callGPTStream ────────────────────────────────────────────────────────────

/**
 * Llama a GPT en modo streaming y retorna un ReadableStream de chunks de texto.
 * Pensado para SSE en endpoints Next.js (feedback en tiempo real al usuario).
 */
export async function callGPTStream(
  systemPrompt: string,
  userPrompt: string,
  options: GPTCallOptions = {}
): Promise<ReadableStream<string>> {
  const {
    model = GPT_MODEL,
    maxTokens = 2000,
    requestId,
    endpoint = 'unknown',
  } = options

  checkCircuit()

  const log = requestId ? logger.child({ requestId }) : logger
  const sanitizedContent = sanitizeForAI(userPrompt)

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: sanitizedContent },
  ]

  log.info({ endpoint, model }, 'GPT stream started')

  const abortController = new AbortController()

  return new ReadableStream<string>({
    async start(controller) {
      try {
        const stream = await openai.chat.completions.create(
          { model, max_completion_tokens: maxTokens, messages, stream: true },
          { signal: abortController.signal }
        )

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) controller.enqueue(delta)
        }

        onSuccess()
        controller.close()
      } catch (err) {
        log.error({ err, endpoint }, 'GPT stream error')
        onFailure()
        controller.error(err)
      }
    },
    cancel() {
      abortController.abort()
    },
  })
}

// ─── Private helpers ──────────────────────────────────────────────────────────

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
    logger.warn({ err }, 'api_usage_log INSERT failed — non-blocking')
  }
}
