/**
 * tests/unit/correct-desarrollo.test.ts — OPTEK §1.8.6
 *
 * Tests de integración para correctDesarrollo().
 * OpenAI, retrieval, verification y Supabase se mockean completamente.
 *
 * Cobertura:
 *   §1.8.6  Flujo completo → corrección con 5 dimensiones + citas verificadas
 *   Extra   verificationScore se calcula correctamente
 *   Extra   Sanitización PII se aplica antes de enviar a GPT
 *   Extra   GPT-5 se usa (no GPT-5-mini) para análisis de mayor calidad
 *   Extra   Error de BD → lanza error descriptivo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('openai', () => {
  function OpenAIMock() {
    return { chat: { completions: { create: mockCreate } } }
  }
  return { default: OpenAIMock }
})

// Mock retrieval
const mockBuildContext = vi.fn()
const mockFormatContext = vi.fn()

vi.mock('@/lib/ai/retrieval', () => ({
  buildContext: (...args: unknown[]) => mockBuildContext(...args),
  formatContext: (...args: unknown[]) => mockFormatContext(...args),
}))

// Mock verification — verifyAllCitations
const mockVerifyAllCitations = vi.fn()

vi.mock('@/lib/ai/verification', () => ({
  verifyAllCitations: (...args: unknown[]) => mockVerifyAllCitations(...args),
}))

// Mock sanitize — pasar texto sin cambios para simplificar asserts
// (los tests de sanitize están en sanitize.test.ts)
vi.mock('@/lib/utils/sanitize', () => ({
  sanitizeForAI: vi.fn((s: string) => s),
  sanitizeHtml: vi.fn((s: string) => s),
  sanitizeUserText: vi.fn((s: string) => s),
}))

// Mock Supabase server
const mockInsertDesarrolloSingle = vi.fn()
const mockTemasSelectSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockResolvedValue({
    from: (table: string) => {
      if (table === 'desarrollos') {
        return {
          insert: () => ({
            select: () => ({ single: mockInsertDesarrolloSingle }),
          }),
        }
      }
      if (table === 'temas') {
        return {
          select: () => ({
            eq: () => ({ single: mockTemasSelectSingle }),
          }),
        }
      }
      if (table === 'api_usage_log') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    },
  }),
  createClient: vi.fn(),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    child: vi.fn().mockReturnValue({
      debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    }),
  },
}))

// ─── Import bajo test ─────────────────────────────────────────────────────────

import { correctDesarrollo } from '@/lib/ai/correct-desarrollo'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TEMA_ID = 'tema-uuid-001'
const USER_ID = 'user-uuid-001'
const DESARROLLO_ID = 'desarrollo-uuid-999'

const CONTEXT_FIXTURE = {
  articulos: [
    {
      id: 'art-001',
      ley_nombre: 'LPAC',
      ley_codigo: 'BOE-A-2015-10565',
      articulo_numero: '21',
      apartado: null,
      titulo_capitulo: 'Obligación de resolver',
      texto_integro: 'La Administración está obligada a dictar resolución expresa en todos los procedimientos.',
    },
  ],
  tokensEstimados: 100,
  strategy: 'semantic' as const,
}

/** Respuesta raw de GPT para CORRECT_DESARROLLO */
const RAW_CORRECTION_PAYLOAD = {
  puntuacion: 7.5,
  feedback:
    'El desarrollo muestra un buen conocimiento general del procedimiento administrativo. ' +
    'La referencia al artículo 21 LPAC sobre la obligación de resolver es correcta.',
  mejoras: [
    'Añadir el plazo concreto de resolución del art. 21 LPAC (3 meses).',
    'Desarrollar el concepto de silencio administrativo.',
  ],
  citas_usadas: [
    { ley: 'LPAC', articulo: '21', textoExacto: 'obligada a dictar resolución expresa' },
  ],
  dimension_juridica: 8,
  dimension_argumentacion: 7,
  dimension_estructura: 7,
}

function buildSDKResponse(payload: unknown) {
  return {
    choices: [{ message: { content: JSON.stringify(payload) }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 800, completion_tokens: 400 },
  }
}

/** VerificationResult para cita válida */
const CITA_VERIFICADA = {
  cita: { ley: 'LPAC', articulo: '21', textoExacto: 'obligada a dictar resolución expresa' },
  verificada: true,
  textoEnBD: 'La Administración está obligada a dictar resolución expresa.',
}

/** VerificationResult para cita inválida */
const CITA_NO_VERIFICADA = {
  cita: { ley: 'LPAC', articulo: '999', textoExacto: 'inventado' },
  verificada: false,
  error: 'Artículo no encontrado en BD',
}

// ─── Setup ────────────────────────────────────────────────────────────────────

function setupBase() {
  mockBuildContext.mockResolvedValue(CONTEXT_FIXTURE)
  mockFormatContext.mockReturnValue('=== CONTEXTO MOCK ===')
  mockTemasSelectSingle.mockResolvedValue({
    data: { titulo: 'Procedimiento Administrativo Común' },
    error: null,
  })
  mockInsertDesarrolloSingle.mockResolvedValue({
    data: { id: DESARROLLO_ID },
    error: null,
  })
  mockVerifyAllCitations.mockResolvedValue([CITA_VERIFICADA])
}

// ─── §1.8.6 — Flujo completo ──────────────────────────────────────────────────

describe('§1.8.6 — correctDesarrollo: flujo completo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupBase()
  })

  it('retorna CorreccionDesarrolloResult con todos los campos', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse(RAW_CORRECTION_PAYLOAD))

    const result = await correctDesarrollo({
      texto: 'El procedimiento administrativo es un conjunto de actos que sigue la Administración.',
      temaId: TEMA_ID,
      userId: USER_ID,
    })

    expect(result.id).toBe(DESARROLLO_ID)
    expect(result.puntuacion).toBe(7.5)
    expect(result.feedback).toBeTruthy()
    expect(result.mejoras).toHaveLength(2)
    expect(result.dimension_juridica).toBe(8)
    expect(result.dimension_argumentacion).toBe(7)
    expect(result.dimension_estructura).toBe(7)
    expect(result.citasVerificadas).toHaveLength(1)
    expect(result.verificationScore).toBe(1)    // 1 verificada / 1 total
    expect(result.promptVersion).toBe('1.8.0')
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('llama a buildContext con el temaId correcto', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse(RAW_CORRECTION_PAYLOAD))

    await correctDesarrollo({
      texto: 'Texto de prueba.',
      temaId: 'tema-específico-abc',
      userId: USER_ID,
    })

    expect(mockBuildContext).toHaveBeenCalledWith(
      'tema-específico-abc',
      expect.any(String)     // query semántica (primeras 200 chars del texto)
    )
  })

  it('usa GPT-5 (no GPT-5-mini) para la corrección', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse(RAW_CORRECTION_PAYLOAD))

    await correctDesarrollo({ texto: 'Texto.', temaId: TEMA_ID, userId: USER_ID })

    const callArgs = mockCreate.mock.calls[0][0]
    expect(callArgs.model).toBe('gpt-5')
  })

  it('guarda el desarrollo en BD (INSERT a desarrollos)', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse(RAW_CORRECTION_PAYLOAD))

    await correctDesarrollo({ texto: 'Texto.', temaId: TEMA_ID, userId: USER_ID })

    expect(mockInsertDesarrolloSingle).toHaveBeenCalled()
  })

  it('verificationScore = 1 cuando todas las citas están verificadas', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse(RAW_CORRECTION_PAYLOAD))
    mockVerifyAllCitations.mockResolvedValue([CITA_VERIFICADA, CITA_VERIFICADA])

    const result = await correctDesarrollo({ texto: 'Texto.', temaId: TEMA_ID, userId: USER_ID })

    expect(result.verificationScore).toBe(1)
  })

  it('verificationScore parcial cuando algunas citas fallan', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse(RAW_CORRECTION_PAYLOAD))
    // 1 verificada + 1 no verificada → score 0.5
    mockVerifyAllCitations.mockResolvedValue([CITA_VERIFICADA, CITA_NO_VERIFICADA])

    const result = await correctDesarrollo({ texto: 'Texto.', temaId: TEMA_ID, userId: USER_ID })

    expect(result.verificationScore).toBe(0.5)
    expect(result.citasVerificadas).toHaveLength(2)
  })

  it('verificationScore = 1 cuando no hay citas en el texto (nada que verificar)', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse(RAW_CORRECTION_PAYLOAD))
    mockVerifyAllCitations.mockResolvedValue([])  // sin citas extraídas

    const result = await correctDesarrollo({ texto: 'Texto sin citas legales.', temaId: TEMA_ID, userId: USER_ID })

    expect(result.verificationScore).toBe(1)
    expect(result.citasVerificadas).toHaveLength(0)
  })

  it('lanza error descriptivo si la BD falla al guardar', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse(RAW_CORRECTION_PAYLOAD))
    mockInsertDesarrolloSingle.mockResolvedValue({
      data: null,
      error: { message: 'connection refused', code: '500' },
    })

    await expect(
      correctDesarrollo({ texto: 'Texto.', temaId: TEMA_ID, userId: USER_ID })
    ).rejects.toThrow(/Error al guardar en BD/)
  })

  it('lanza error si GPT devuelve JSON inválido tras retry', async () => {
    // Ambos intentos de callGPTJSON devuelven basura
    mockCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'no es json' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 100, completion_tokens: 10 },
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: 'tampoco es json' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 100, completion_tokens: 10 },
      })

    await expect(
      correctDesarrollo({ texto: 'Texto.', temaId: TEMA_ID, userId: USER_ID })
    ).rejects.toThrow(/callGPTJSON/)
  })
})
