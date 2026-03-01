/**
 * lib/ai/embeddings.ts — OPTEK
 *
 * Generación de embeddings vectoriales con OpenAI text-embedding-3-small.
 *
 * Modelo elegido (ADR-0010 economics):
 *   text-embedding-3-small → 1536 dims, $0.020/1M tokens
 *   Rendimiento suficiente para búsqueda semántica de legislación española.
 *   Alternativa descartada: text-embedding-3-large (3072 dims, 5× más caro).
 *
 * Uso:
 *   import { generateEmbedding } from '@/lib/ai/embeddings'
 *   const vector = await generateEmbedding('Artículo 1. ...')
 */

import OpenAI from 'openai'

// ─── Constantes públicas ──────────────────────────────────────────────────────

export const EMBEDDING_MODEL = 'text-embedding-3-small' as const
export const EMBEDDING_DIMENSIONS = 1536 as const

// ─── Cliente singleton ────────────────────────────────────────────────────────

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      '[OPTEK] OPENAI_API_KEY no está configurada en las variables de entorno. ' +
        'Añade OPENAI_API_KEY=sk-... a tu .env.local antes de generar embeddings.'
    )
  }

  return new OpenAI({ apiKey })
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Genera un embedding vectorial de 1536 dimensiones para el texto dado.
 *
 * @param text - Texto a vectorizar (texto de un artículo legal, pregunta, etc.)
 * @returns    - Array de 1536 números float representando el embedding
 * @throws     - Error si OPENAI_API_KEY no está configurada o si la API falla
 *
 * @example
 * const vector = await generateEmbedding('Artículo 1. Objeto de la Ley...')
 * // vector.length === 1536
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient()

  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  })

  return response.data[0].embedding
}
