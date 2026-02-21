import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/server'
import { sanitizeForAI } from '@/lib/utils/sanitize'
import { logger } from '@/lib/logger'

/**
 * Cliente Claude API para OPTEK.
 *
 * DDIA Principles aplicados:
 *   Reliability    → maxRetries=2 con exponential backoff (built-in SDK), timeout 30s
 *   Consistency    → sanitizeForAI() elimina PII antes de enviar (GDPR ADR-0009)
 *   Observability  → INSERT en api_usage_log tras cada llamada (coste en tiempo real)
 *
 * Coste Claude Sonnet 4.6:
 *   Input:  $3.00 / 1M tokens = 0.3 céntimos / 1K tokens
 *   Output: $15.00 / 1M tokens = 1.5 céntimos / 1K tokens
 */

// DDIA Reliability: singleton con maxRetries + timeout globales
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 30_000,  // 30s máx — previene requests colgados
  maxRetries: 2,    // exponential backoff automático en 429/529
})

const COST_PER_1K_INPUT_CENTS = 0.3
const COST_PER_1K_OUTPUT_CENTS = 1.5

export interface ClaudeCallOptions {
  model?: string
  maxTokens?: number
  systemPrompt?: string
  requestId?: string
  endpoint?: string
  userId?: string
}

/**
 * Llama a Claude con sanitización de PII, logging de tokens y manejo de errores.
 *
 * @param userContent - Contenido del usuario (se sanitiza antes de enviar)
 * @param options     - Configuración de la llamada
 * @returns           - Texto de la respuesta de Claude
 * @throws            - Error si la llamada falla (después de retries)
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
    throw err
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

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
