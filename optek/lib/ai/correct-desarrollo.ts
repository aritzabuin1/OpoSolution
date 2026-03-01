/**
 * lib/ai/correct-desarrollo.ts — OPTEK §1.8.3
 *
 * Función principal de corrección de desarrollos escritos.
 *
 * Pipeline:
 *   1. buildContext(temaId) → legislación relevante para el tema
 *   2. Sanitizar texto del usuario (PII + XSS vía sanitizeForAI — GDPR §0.1.0)
 *   3. callClaudeJSON(Sonnet, CorreccionDesarrolloRawSchema) → corrección raw
 *   4. verifyAllCitations(feedback) → badges de verificación en las citas
 *   5. Guardar en tabla desarrollos con prompt_version
 *   6. Retornar CorreccionDesarrolloResult enriquecido
 *
 * Modelo: Sonnet (no Haiku) — la corrección requiere análisis más profundo:
 *   comprensión jurídica, argumentación, detección de errores sutiles.
 *   Coste estimado: ~0.035€/corrección (ADR-0010).
 *
 * DDIA Principles:
 *   Reliability   → Circuit Breaker heredado de callClaude
 *   Consistency   → prompt_version versionado para reproducibilidad
 *   Observability → logging de cada paso con duración y tokens
 */

import { buildContext, formatContext } from '@/lib/ai/retrieval'
import { callGPTJSON } from '@/lib/ai/openai'
import { SYSTEM_CORRECT_DESARROLLO, buildCorrectDesarrolloPrompt } from '@/lib/ai/prompts'
import { CorreccionDesarrolloRawSchema } from '@/lib/ai/schemas'
import { verifyAllCitations } from '@/lib/ai/verification'
import { sanitizeForAI, sanitizeHtml } from '@/lib/utils/sanitize'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { VerificationResult } from '@/types/ai'
import type { Json } from '@/types/database'

// ─── Versión del prompt ───────────────────────────────────────────────────────

export const PROMPT_VERSION = '1.8.0'

const GPT_MODEL = 'gpt-5'

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface CorrectDesarrolloParams {
  texto: string
  temaId: string
  userId: string
  requestId?: string
}

/**
 * Resultado completo de la corrección:
 *   - Campos de evaluación de Claude (puntuación, feedback, dimensiones)
 *   - Citas verificadas determinísticamente (verificationScore)
 *   - Metadatos de trazabilidad (id, promptVersion, createdAt)
 */
export interface CorreccionDesarrolloResult {
  id: string
  puntuacion: number          // 0-10 (media de las 3 dimensiones)
  feedback: string
  mejoras: string[]
  dimension_juridica: number
  dimension_argumentacion: number
  dimension_estructura: number
  citasVerificadas: VerificationResult[]
  verificationScore: number   // 0-1, fracción de citas encontradas en BD
  promptVersion: string
  createdAt: string
}

// ─── correctDesarrollo ────────────────────────────────────────────────────────

/**
 * Corrige un desarrollo escrito de un opositor.
 *
 * @returns CorreccionDesarrolloResult con evaluación y citas verificadas
 * @throws  Error si Claude falla o la BD falla
 */
export async function correctDesarrollo(
  params: CorrectDesarrolloParams
): Promise<CorreccionDesarrolloResult> {
  const { texto, temaId, userId, requestId } = params
  const log = requestId ? logger.child({ requestId }) : logger
  const start = Date.now()

  // ── 1. Contexto RAG + título del tema ─────────────────────────────────────
  const [ctx, temaTitulo] = await Promise.all([
    buildContext(temaId, texto.slice(0, 200)),  // query semántica con primeras palabras
    fetchTemaTitulo(temaId),
  ])

  const contextoLegislativo = formatContext(ctx)

  log.info(
    { temaId, tokensEstimados: ctx.tokensEstimados, strategy: ctx.strategy, temaTitulo },
    '[correctDesarrollo] context built'
  )

  // ── 2. Sanitizar texto del usuario (GDPR ADR-0009) ────────────────────────
  // sanitizeForAI = sanitizeHtml + sanitizeUserText (elimina PII + XSS)
  const textoSanitizado = sanitizeForAI(texto)

  // ── 3. Llamar a GPT-5 para la corrección ─────────────────────────────────
  const userPrompt = buildCorrectDesarrolloPrompt({
    contextoLegislativo,
    textoUsuario: textoSanitizado,
    temaTitulo,
  })

  const rawCorrection = await callGPTJSON(
    SYSTEM_CORRECT_DESARROLLO,
    userPrompt,
    CorreccionDesarrolloRawSchema,
    {
      model: GPT_MODEL,
      maxTokens: 2000,
      endpoint: 'correct-desarrollo',
      userId,
      requestId,
    }
  )

  log.info(
    { puntuacion: rawCorrection.puntuacion, numMejoras: rawCorrection.mejoras.length },
    '[correctDesarrollo] raw correction received from GPT'
  )

  // ── 4. Verificar determinísticamente las citas del feedback ───────────────
  // Verificamos el feedback completo + las citas declaradas explícitamente
  const textToVerify = [
    rawCorrection.feedback,
    ...rawCorrection.mejoras,
    ...rawCorrection.citas_usadas.map((c) => `${c.ley} art. ${c.articulo}`),
  ].join(' ')

  const citasVerificadas = await verifyAllCitations(textToVerify, requestId)

  const verificationScore =
    citasVerificadas.length > 0
      ? citasVerificadas.filter((c) => c.verificada).length / citasVerificadas.length
      : 1 // Sin citas = no hay nada que verificar → score perfecto

  log.info(
    {
      citasTotal: citasVerificadas.length,
      citasVerificadas: citasVerificadas.filter((c) => c.verificada).length,
      verificationScore: Number(verificationScore.toFixed(3)),
    },
    '[correctDesarrollo] verification complete'
  )

  // ── 5. Guardar en BD ──────────────────────────────────────────────────────
  // Guardamos el texto sanitizado (sanitizeHtml) — NO el original
  const textoParaGuardar = sanitizeHtml(texto)
  const desarrolloId = await saveDesarrolloDB({
    userId,
    temaId,
    textoUsuario: textoParaGuardar,
    evaluacion: rawCorrection,
    citasVerificadas,
  })

  const durationMs = Date.now() - start
  log.info(
    { desarrolloId, puntuacion: rawCorrection.puntuacion, durationMs },
    '[correctDesarrollo] corrección guardada'
  )

  // ── 6. Retornar resultado enriquecido ──────────────────────────────────────
  return {
    id: desarrolloId,
    puntuacion: rawCorrection.puntuacion,
    feedback: rawCorrection.feedback,
    mejoras: rawCorrection.mejoras,
    dimension_juridica: rawCorrection.dimension_juridica,
    dimension_argumentacion: rawCorrection.dimension_argumentacion,
    dimension_estructura: rawCorrection.dimension_estructura,
    citasVerificadas,
    verificationScore,
    promptVersion: PROMPT_VERSION,
    createdAt: new Date().toISOString(),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function saveDesarrolloDB(params: {
  userId: string
  temaId: string
  textoUsuario: string
  evaluacion: Record<string, unknown>
  citasVerificadas: VerificationResult[]
}): Promise<string> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('desarrollos')
    .insert({
      user_id: params.userId,
      tema_id: params.temaId,
      texto_usuario: params.textoUsuario,
      evaluacion: params.evaluacion as unknown as Json,
      citas_verificadas: params.citasVerificadas as unknown as Json,
      prompt_version: PROMPT_VERSION,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`[correctDesarrollo] Error al guardar en BD: ${error.message}`)
  }

  return data.id
}
