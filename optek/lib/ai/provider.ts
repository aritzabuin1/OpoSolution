/**
 * lib/ai/provider.ts — Capa unificada de IA con fallback automático
 *
 * ARQUITECTURA:
 *   - Explícito: AI_PRIMARY_PROVIDER=anthropic|openai (env var)
 *   - Auto-detect: si no hay env var, usa el proveedor que tenga API key
 *     → ANTHROPIC_API_KEY → Claude primario, OpenAI fallback
 *     → OPENAI_API_KEY (sin Anthropic) → OpenAI primario, Claude fallback
 *
 * RESILIENCIA:
 *   Cada proveedor tiene su propio Circuit Breaker (en claude.ts y openai.ts).
 *   Si el primario tiene el circuito OPEN o falla, el provider automáticamente
 *   enruta al secundario. Zero downtime para el usuario.
 *
 * OBSERVABILIDAD:
 *   Ambos proveedores logean a api_usage_log con el modelo real utilizado.
 *   El campo `model` en api_usage_log indica qué modelo procesó la request.
 *
 * IMPORTANTE:
 *   Todos los módulos de la app deben importar desde aquí, NO directamente
 *   desde claude.ts o openai.ts. Esos archivos son la capa de implementación.
 */

import { logger } from '@/lib/logger'

// ─── Importar implementaciones ────────────────────────────────────────────────

import {
  callClaude,
  callClaudeHaiku,
  callClaudeJSON,
  callClaudeStream,
  circuit as claudeCircuit,
  type ClaudeCallOptions,
} from '@/lib/ai/claude'

import {
  callGPT,
  callGPTMini,
  callGPTJSON,
  callGPTStream,
  openaiCircuit,
  type GPTCallOptions,
} from '@/lib/ai/openai'

import type { ZodType } from 'zod'

// ─── Configuración ────────────────────────────────────────────────────────────

type AIProvider = 'anthropic' | 'openai'

/**
 * AI_PRIMARY_PROVIDER:
 *   'anthropic' → producción (Claude primario, OpenAI fallback)
 *   'openai'    → testing/pruebas (OpenAI primario, Claude fallback)
 *
 * Auto-detect: si la API key del primario está vacía, usar el otro proveedor
 * directamente para evitar perder tiempo en llamadas que van a fallar.
 */
function resolvePrimary(): AIProvider {
  const explicit = process.env.AI_PRIMARY_PROVIDER as AIProvider | undefined
  if (explicit === 'openai' || explicit === 'anthropic') return explicit

  // Sin env var explícita: elegir según qué API key existe
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  if (hasAnthropic) return 'anthropic'
  if (hasOpenAI) return 'openai'
  return 'anthropic' // fallback default (fallará, pero al menos logea)
}

const PRIMARY: AIProvider = resolvePrimary()
const SECONDARY: AIProvider = PRIMARY === 'anthropic' ? 'openai' : 'anthropic'

// ─── Opciones unificadas ──────────────────────────────────────────────────────

export interface AICallOptions {
  maxTokens?: number
  systemPrompt?: string
  requestId?: string
  endpoint?: string
  userId?: string
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function isCircuitOpenError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('temporalmente no disponible')
}

function isProviderCircuitOpen(provider: AIProvider): boolean {
  if (provider === 'anthropic') return claudeCircuit.state === 'OPEN'
  return openaiCircuit.state === 'OPEN'
}

/** Check if a provider has its API key configured */
function isProviderAvailable(provider: AIProvider): boolean {
  if (provider === 'anthropic') return !!process.env.ANTHROPIC_API_KEY
  return !!process.env.OPENAI_API_KEY
}

/** Mapea opciones unificadas a las opciones de cada proveedor. */
function toClaudeOpts(opts: AICallOptions): ClaudeCallOptions {
  return opts
}
function toGPTOpts(opts: AICallOptions): GPTCallOptions {
  return opts
}

// ─── callAI (modelo pesado: Sonnet / GPT-5) ──────────────────────────────────

/**
 * Llamada a modelo pesado (correcciones, análisis complejos).
 * Producción: Claude Sonnet → fallback GPT-5
 * Testing:    GPT-5 → fallback Claude Sonnet
 */
export async function callAI(
  userContent: string,
  options: AICallOptions = {}
): Promise<string> {
  const log = options.requestId ? logger.child({ requestId: options.requestId }) : logger

  // Si el primario no tiene API key o circuit breaker abierto → secundario
  if (!isProviderAvailable(PRIMARY) || isProviderCircuitOpen(PRIMARY)) {
    log.warn({ primary: PRIMARY, secondary: SECONDARY }, '[provider] primary unavailable → fallback')
    return callHeavy(SECONDARY, userContent, options)
  }

  try {
    return await callHeavy(PRIMARY, userContent, options)
  } catch (err) {
    if (isCircuitOpenError(err)) {
      log.warn({ primary: PRIMARY, secondary: SECONDARY }, '[provider] primary failed → fallback')
      return callHeavy(SECONDARY, userContent, options)
    }
    throw err
  }
}

function callHeavy(provider: AIProvider, content: string, opts: AICallOptions): Promise<string> {
  return provider === 'anthropic'
    ? callClaude(content, toClaudeOpts(opts))
    : callGPT(content, toGPTOpts(opts))
}

// ─── callAIMini (modelo ligero: Haiku / GPT-5-mini) ──────────────────────────

/**
 * Llamada a modelo ligero (generación MCQ, flashcards).
 * Producción: Claude Haiku → fallback GPT-5-mini
 * Testing:    GPT-5-mini → fallback Claude Haiku
 */
export async function callAIMini(
  userContent: string,
  options: AICallOptions = {}
): Promise<string> {
  const log = options.requestId ? logger.child({ requestId: options.requestId }) : logger

  if (!isProviderAvailable(PRIMARY) || isProviderCircuitOpen(PRIMARY)) {
    log.warn({ primary: PRIMARY, secondary: SECONDARY }, '[provider] primary unavailable → fallback (mini)')
    return callLight(SECONDARY, userContent, options)
  }

  try {
    return await callLight(PRIMARY, userContent, options)
  } catch (err) {
    if (isCircuitOpenError(err)) {
      log.warn({ primary: PRIMARY, secondary: SECONDARY }, '[provider] primary failed → fallback (mini)')
      return callLight(SECONDARY, userContent, options)
    }
    throw err
  }
}

function callLight(provider: AIProvider, content: string, opts: AICallOptions): Promise<string> {
  return provider === 'anthropic'
    ? callClaudeHaiku(content, toClaudeOpts(opts))
    : callGPTMini(content, toGPTOpts(opts))
}

// ─── callAIJSON (modelo ligero + validación Zod) ─────────────────────────────

/**
 * Llamada JSON con validación Zod.
 * Usa modelo ligero por defecto. Pasar model para forzar pesado.
 * Producción: callClaudeJSON → fallback callGPTJSON
 * Testing:    callGPTJSON → fallback callClaudeJSON
 */
export async function callAIJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodType<T>,
  options: AICallOptions & { useHeavyModel?: boolean } = {}
): Promise<T> {
  const { useHeavyModel, ...aiOpts } = options
  const log = aiOpts.requestId ? logger.child({ requestId: aiOpts.requestId }) : logger

  if (!isProviderAvailable(PRIMARY) || isProviderCircuitOpen(PRIMARY)) {
    log.warn({ primary: PRIMARY, secondary: SECONDARY }, '[provider] primary unavailable → fallback (JSON)')
    return callJSON(SECONDARY, systemPrompt, userPrompt, schema, aiOpts, useHeavyModel)
  }

  try {
    return await callJSON(PRIMARY, systemPrompt, userPrompt, schema, aiOpts, useHeavyModel)
  } catch (err) {
    if (isCircuitOpenError(err)) {
      log.warn({ primary: PRIMARY, secondary: SECONDARY }, '[provider] primary failed → fallback (JSON)')
      return callJSON(SECONDARY, systemPrompt, userPrompt, schema, aiOpts, useHeavyModel)
    }
    throw err
  }
}

function callJSON<T>(
  provider: AIProvider,
  system: string,
  user: string,
  schema: ZodType<T>,
  opts: AICallOptions,
  useHeavy?: boolean
): Promise<T> {
  if (provider === 'anthropic') {
    return callClaudeJSON(system, user, schema, {
      ...toClaudeOpts(opts),
      model: useHeavy ? 'claude-sonnet-4-6' : undefined,
    })
  }
  return callGPTJSON(system, user, schema, {
    ...toGPTOpts(opts),
    model: useHeavy ? 'gpt-5' : undefined,
  })
}

// ─── callAIStream (streaming — modelo configurable) ──────────────────────────

/**
 * Llamada streaming para respuestas progresivas (SSE).
 * Producción: callClaudeStream → fallback callGPTStream
 * Testing:    callGPTStream → fallback callClaudeStream
 */
export async function callAIStream(
  systemPrompt: string,
  userPrompt: string,
  options: AICallOptions & { model?: string } = {}
): Promise<ReadableStream<string>> {
  const { model: _model, ...aiOpts } = options
  const log = aiOpts.requestId ? logger.child({ requestId: aiOpts.requestId }) : logger

  if (!isProviderAvailable(PRIMARY) || isProviderCircuitOpen(PRIMARY)) {
    log.warn({ primary: PRIMARY, secondary: SECONDARY }, '[provider] primary unavailable → fallback (stream)')
    return callStreamProvider(SECONDARY, systemPrompt, userPrompt, options)
  }

  try {
    return await callStreamProvider(PRIMARY, systemPrompt, userPrompt, options)
  } catch (err) {
    if (isCircuitOpenError(err)) {
      log.warn({ primary: PRIMARY, secondary: SECONDARY }, '[provider] primary failed → fallback (stream)')
      return callStreamProvider(SECONDARY, systemPrompt, userPrompt, options)
    }
    throw err
  }
}

function callStreamProvider(
  provider: AIProvider,
  system: string,
  user: string,
  opts: AICallOptions & { model?: string }
): Promise<ReadableStream<string>> {
  if (provider === 'anthropic') {
    return callClaudeStream(system, user, {
      ...toClaudeOpts(opts),
      model: opts.model ?? 'claude-haiku-4-5-20251001',
    })
  }
  return callGPTStream(system, user, {
    ...toGPTOpts(opts),
    model: opts.model ?? 'gpt-5-mini',
  })
}

// ─── Re-exports para conveniencia ─────────────────────────────────────────────

export { TEMPERATURES } from '@/lib/ai/claude'
export { PRIMARY as AI_PRIMARY_PROVIDER, SECONDARY as AI_FALLBACK_PROVIDER }
