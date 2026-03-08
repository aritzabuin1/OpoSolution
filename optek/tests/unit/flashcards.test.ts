/**
 * tests/unit/flashcards.test.ts
 *
 * Tests unitarios para generateFlashcardFromError() en lib/ai/flashcards.ts.
 *
 * Cobertura:
 *   - Happy path: respuesta JSON válida de Claude Haiku
 *   - Fallback: JSON inválido → flashcard simple
 *   - Fallback: no JSON en respuesta → flashcard simple
 *   - Error de Claude → null
 *   - Con/sin cita legal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Pregunta } from '@/types/ai'

// Mock callAIMini (provider)
const mockCallAIMini = vi.fn()
vi.mock('@/lib/ai/provider', () => ({
  callAIMini: (...args: unknown[]) => mockCallAIMini(...args),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
    warn: vi.fn(),
  },
}))

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid' })

const basePregunta: Pregunta = {
  enunciado: 'El plazo para interponer recurso de alzada es de:',
  opciones: ['1 mes', '2 meses', '3 meses', '15 días'],
  correcta: 0,
  explicacion: 'Según el artículo 122 de la LPAC, el plazo es de 1 mes si el acto es expreso.',
  cita: { ley: 'LPAC', articulo: '122', textoExacto: 'Un mes si el acto es expreso' },
}

describe('generateFlashcardFromError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('genera flashcard correcta con respuesta JSON válida de Claude', async () => {
    mockCallAIMini.mockResolvedValueOnce(JSON.stringify({
      frente: '¿Cuál es el plazo para recurso de alzada contra acto expreso?',
      reverso: '1 mes desde la notificación del acto. Art. 122 LPAC.',
      cita_legal: { ley: 'LPAC', articulo: '122', texto_ref: 'Un mes si acto expreso' },
    }))

    const { generateFlashcardFromError } = await import('@/lib/ai/flashcards')
    const result = await generateFlashcardFromError(basePregunta, 'tema-uuid')

    expect(result).not.toBeNull()
    expect(result!.frente).toContain('plazo')
    expect(result!.reverso).toContain('1 mes')
    expect(result!.cita_legal).not.toBeNull()
    expect(result!.tema_id).toBe('tema-uuid')
    expect(result!.origen).toBe('error_test')
  })

  it('genera flashcard sin cita_legal cuando Claude devuelve null', async () => {
    mockCallAIMini.mockResolvedValueOnce(JSON.stringify({
      frente: 'Pregunta de repaso sobre ofimática Excel',
      reverso: 'La función BUSCARV busca en la primera columna.',
      cita_legal: null,
    }))

    const { generateFlashcardFromError } = await import('@/lib/ai/flashcards')
    const preguntaSinCita = { ...basePregunta, cita: undefined }
    const result = await generateFlashcardFromError(preguntaSinCita, 'tema-2')

    expect(result!.cita_legal).toBeNull()
  })

  it('fallback a flashcard simple cuando JSON inválido', async () => {
    mockCallAIMini.mockResolvedValueOnce('No es JSON, solo texto libre de Claude.')

    const { generateFlashcardFromError } = await import('@/lib/ai/flashcards')
    const result = await generateFlashcardFromError(basePregunta, 'tema-3')

    expect(result).not.toBeNull()
    expect(result!.frente).toBe(basePregunta.enunciado.slice(0, 200))
    expect(result!.reverso).toContain('1 mes')
    expect(result!.origen).toBe('error_test')
  })

  it('fallback cuando schema validation falla (frente demasiado corto)', async () => {
    mockCallAIMini.mockResolvedValueOnce(JSON.stringify({
      frente: 'Corto', // min 10 chars
      reverso: 'OK respuesta válida y larga.',
      cita_legal: null,
    }))

    const { generateFlashcardFromError } = await import('@/lib/ai/flashcards')
    const result = await generateFlashcardFromError(basePregunta, 'tema-4')

    // Should fallback to simple flashcard
    expect(result).not.toBeNull()
    expect(result!.frente).toBe(basePregunta.enunciado.slice(0, 200))
  })

  it('retorna null cuando Claude lanza excepción', async () => {
    mockCallAIMini.mockRejectedValueOnce(new Error('API rate limit'))

    const { generateFlashcardFromError } = await import('@/lib/ai/flashcards')
    const result = await generateFlashcardFromError(basePregunta, 'tema-5')

    expect(result).toBeNull()
  })

  it('tema_id null se propaga correctamente', async () => {
    mockCallAIMini.mockResolvedValueOnce(JSON.stringify({
      frente: 'Pregunta de flashcard sobre legislación',
      reverso: 'Respuesta detallada con fundamento legal.',
      cita_legal: null,
    }))

    const { generateFlashcardFromError } = await import('@/lib/ai/flashcards')
    const result = await generateFlashcardFromError(basePregunta, null)

    expect(result!.tema_id).toBeNull()
  })

  it('llama a callClaudeHaiku con endpoint correcto', async () => {
    mockCallAIMini.mockResolvedValueOnce(JSON.stringify({
      frente: 'Pregunta de flashcard sobre legislación',
      reverso: 'Respuesta detallada con fundamento legal.',
      cita_legal: null,
    }))

    const { generateFlashcardFromError } = await import('@/lib/ai/flashcards')
    await generateFlashcardFromError(basePregunta, 'tema-6')

    expect(mockCallAIMini).toHaveBeenCalledTimes(1)
    const callArgs = mockCallAIMini.mock.calls[0]
    expect(callArgs[1].endpoint).toBe('generate-flashcard')
    expect(callArgs[1].userId).toBe('system')
    expect(callArgs[1].maxTokens).toBe(500)
  })
})
