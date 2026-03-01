/**
 * lib/ai/flashcards.ts — §2.1.5 + §2.1.6
 *
 * Genera flashcards automáticamente desde preguntas falladas en tests.
 * Usa Claude Haiku para generar frente/reverso coherentes con la cita legal.
 *
 * Coste estimado: ~0.001€/flashcard (Haiku, prompt corto)
 */

import { z } from 'zod'
import { callClaudeHaiku } from '@/lib/ai/claude'
import { logger } from '@/lib/logger'
import type { Pregunta } from '@/types/ai'

// ─── Schema de salida ────────────────────────────────────────────────────────

const FlashcardRawSchema = z.object({
  frente: z.string().min(10).max(300),
  reverso: z.string().min(10).max(800),
  cita_legal: z.object({
    ley: z.string(),
    articulo: z.string(),
    texto_ref: z.string().max(200),
  }).nullable().optional(),
})

type FlashcardRaw = z.infer<typeof FlashcardRawSchema>

export interface FlashcardData {
  frente: string
  reverso: string
  cita_legal: { ley: string; articulo: string; texto_ref: string } | null
  tema_id: string | null
  origen: 'error_test'
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_FLASHCARD = `Eres un experto en oposiciones a la Administración General del Estado.
Tu tarea es crear una flashcard de repaso espaciado a partir de una pregunta de examen fallada.

REGLAS:
1. Frente (pregunta de la tarjeta): reformula el concepto clave como pregunta directa.
   - Ejemplo: "¿Cuántos días tiene el ciudadano para interponer recurso de alzada?"
2. Reverso (respuesta): respuesta concisa (1-3 frases). Incluye el fundamento legal si existe.
3. Si la pregunta tiene cita legal, inclúyela en cita_legal. Si no, pon null.
4. Responde SOLO con JSON válido.

FORMATO:
{
  "frente": "...",
  "reverso": "...",
  "cita_legal": { "ley": "Ley 39/2015", "articulo": "112", "texto_ref": "plazo 1 mes..." } | null
}` as const

// ─── Función principal ────────────────────────────────────────────────────────

/**
 * Genera una flashcard a partir de una pregunta fallada.
 *
 * @param pregunta       - Pregunta del test (con enunciado, opciones, correcta, explicacion)
 * @param temaId         - ID del tema para asociar la flashcard
 * @returns FlashcardData lista para insertar en BD, o null si falla
 */
export async function generateFlashcardFromError(
  pregunta: Pregunta,
  temaId: string | null
): Promise<FlashcardData | null> {
  const userPrompt = `Pregunta fallada:
${pregunta.enunciado}

Respuesta correcta: ${pregunta.opciones[pregunta.correcta]}
Explicación: ${pregunta.explicacion}
${pregunta.cita ? `Cita legal: Art. ${pregunta.cita.articulo} de ${pregunta.cita.ley}` : ''}

Crea una flashcard de repaso para esta pregunta.`

  let rawResponse: string
  try {
    rawResponse = await callClaudeHaiku(userPrompt, {
      systemPrompt: SYSTEM_FLASHCARD,
      maxTokens: 400,
      endpoint: 'generate-flashcard',
      userId: 'system',
      requestId: globalThis.crypto.randomUUID(),
    })
  } catch (err) {
    logger.warn({ err }, '[flashcards] Claude Haiku failed, skipping flashcard generation')
    return null
  }

  // Parse JSON
  let parsed: FlashcardRaw
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found')
    const raw = JSON.parse(jsonMatch[0]) as unknown
    const result = FlashcardRawSchema.safeParse(raw)
    if (!result.success) throw new Error('Schema validation failed')
    parsed = result.data
  } catch {
    // Fallback: crear flashcard simple sin IA
    return {
      frente: pregunta.enunciado.slice(0, 200),
      reverso: `Respuesta correcta: ${pregunta.opciones[pregunta.correcta]}. ${pregunta.explicacion?.slice(0, 200) ?? ''}`,
      cita_legal: pregunta.cita
        ? { ley: pregunta.cita.ley, articulo: pregunta.cita.articulo, texto_ref: '' }
        : null,
      tema_id: temaId,
      origen: 'error_test' as const,
    }
  }

  return {
    frente: parsed.frente,
    reverso: parsed.reverso,
    cita_legal: parsed.cita_legal ?? null,
    tema_id: temaId,
    origen: 'error_test' as const,
  }
}
