/**
 * tests/unit/openai.test.ts — OPTEK §1.9
 *
 * Tests unitarios para callGPTJSON y el Circuit Breaker de OpenAI.
 * El SDK de OpenAI se mockea completamente — sin requests reales.
 *
 * Cobertura:
 *   callGPTJSON con respuesta JSON válida
 *   callGPTJSON con respuesta inválida → retry → throw
 *   Circuit  5 fallos → OPEN → throw inmediato
 *   Circuit  OPEN + 60s → HALF_OPEN → permite 1 request
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'

// ─── Mock del SDK de OpenAI ───────────────────────────────────────────────────

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}))

vi.mock('openai', () => {
  function OpenAIMock() {
    return { chat: { completions: { create: mockCreate } } }
  }
  return { default: OpenAIMock }
})

// Mock de supabase para que logApiUsage no falle en los tests
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

// Mock de sanitize — pasa el contenido sin cambios
vi.mock('@/lib/utils/sanitize', () => ({
  sanitizeForAI: vi.fn((s: string) => s),
}))

// ─── Imports bajo test (después de mocks) ─────────────────────────────────────

import { callGPTJSON, openaiCircuit } from '@/lib/ai/openai'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Construye una respuesta válida del SDK de OpenAI */
function buildOpenAIResponse(text: string) {
  return {
    choices: [{ message: { content: text }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 100, completion_tokens: 50 },
  }
}

/** Reinicia el circuit breaker a estado CLOSED antes de cada test */
function resetCircuit() {
  openaiCircuit.state       = 'CLOSED'
  openaiCircuit.failures    = 0
  openaiCircuit.lastFailureAt = 0
}

// ─── Schema de prueba ─────────────────────────────────────────────────────────

const TestSchema = z.object({
  nombre: z.string().min(1),
  valor: z.number().min(0),
})
type TestType = z.infer<typeof TestSchema>

// ─── Tests: callGPTJSON ───────────────────────────────────────────────────────

describe('callGPTJSON', () => {
  beforeEach(() => {
    resetCircuit()
    vi.clearAllMocks()
  })

  describe('respuesta JSON válida', () => {
    it('parsea y retorna el objeto validado con el schema Zod', async () => {
      const validPayload = { nombre: 'LPAC', valor: 39 }
      mockCreate.mockResolvedValueOnce(
        buildOpenAIResponse(JSON.stringify(validPayload))
      )

      const result = await callGPTJSON<TestType>('System prompt', 'User prompt', TestSchema)

      expect(result).toEqual(validPayload)
    })

    it('limpia bloques markdown ```json``` antes de parsear', async () => {
      const validPayload = { nombre: 'LRJSP', valor: 40 }
      const withMarkdown = '```json\n' + JSON.stringify(validPayload) + '\n```'
      mockCreate.mockResolvedValueOnce(buildOpenAIResponse(withMarkdown))

      const result = await callGPTJSON<TestType>('System prompt', 'User prompt', TestSchema)

      expect(result).toEqual(validPayload)
    })

    it('llama a GPT-5-mini por defecto (sin options.model especificado)', async () => {
      const validPayload = { nombre: 'CE', valor: 1 }
      mockCreate.mockResolvedValueOnce(buildOpenAIResponse(JSON.stringify(validPayload)))

      await callGPTJSON<TestType>('System', 'User', TestSchema)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-5-mini' })
      )
    })

    it('usa GPT-5 cuando se especifica model: "gpt-5"', async () => {
      const validPayload = { nombre: 'TREBEP', valor: 5 }
      mockCreate.mockResolvedValueOnce(buildOpenAIResponse(JSON.stringify(validPayload)))

      await callGPTJSON<TestType>('System', 'User', TestSchema, { model: 'gpt-5' })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-5' })
      )
    })

    it('añade instrucción JSON al system prompt', async () => {
      const validPayload = { nombre: 'TREBEP', valor: 5 }
      mockCreate.mockResolvedValueOnce(buildOpenAIResponse(JSON.stringify(validPayload)))

      await callGPTJSON<TestType>('Mi system prompt base', 'User', TestSchema)

      const callArgs = mockCreate.mock.calls[0][0]
      // OpenAI: messages[0]=system, messages[1]=user
      expect(callArgs.messages[0].content).toContain('JSON válido')
    })
  })

  describe('respuesta inválida → retry → throw', () => {
    it('hace retry si la primera respuesta no es JSON válido', async () => {
      const validPayload = { nombre: 'LOPDGDD', valor: 3 }

      mockCreate
        .mockResolvedValueOnce(buildOpenAIResponse('Texto libre que no es JSON'))
        .mockResolvedValueOnce(buildOpenAIResponse(JSON.stringify(validPayload)))

      const result = await callGPTJSON<TestType>('System', 'User', TestSchema)

      expect(result).toEqual(validPayload)
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })

    it('hace retry si el JSON no pasa la validación Zod', async () => {
      const invalidPayload = { nombre: '', valor: -1 }
      const validPayload   = { nombre: 'LGP', valor: 47 }

      mockCreate
        .mockResolvedValueOnce(buildOpenAIResponse(JSON.stringify(invalidPayload)))
        .mockResolvedValueOnce(buildOpenAIResponse(JSON.stringify(validPayload)))

      const result = await callGPTJSON<TestType>('System', 'User', TestSchema)

      expect(result).toEqual(validPayload)
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })

    it('el prompt de retry incluye el mensaje de corrección', async () => {
      const validPayload = { nombre: 'LGOB', valor: 50 }

      mockCreate
        .mockResolvedValueOnce(buildOpenAIResponse('no es json'))
        .mockResolvedValueOnce(buildOpenAIResponse(JSON.stringify(validPayload)))

      await callGPTJSON<TestType>('System', 'User', TestSchema)

      // El segundo call debe incluir el mensaje de corrección en el user content
      const secondCallArgs  = mockCreate.mock.calls[1][0]
      const userMessage = secondCallArgs.messages[1].content as string
      expect(userMessage).toContain('Tu respuesta anterior no era JSON válido')
    })

    it('lanza un error descriptivo si ambos intentos fallan', async () => {
      mockCreate
        .mockResolvedValueOnce(buildOpenAIResponse('primer intento inválido'))
        .mockResolvedValueOnce(buildOpenAIResponse('segundo intento también inválido'))

      await expect(
        callGPTJSON<TestType>('System', 'User', TestSchema)
      ).rejects.toThrow(/callGPTJSON.*2 intentos/)
    })

    it('el error incluye fragmento de la respuesta recibida', async () => {
      const badResponse = 'respuesta completamente inesperada del modelo'
      mockCreate
        .mockResolvedValueOnce(buildOpenAIResponse(badResponse))
        .mockResolvedValueOnce(buildOpenAIResponse(badResponse))

      await expect(
        callGPTJSON<TestType>('System', 'User', TestSchema)
      ).rejects.toThrow(/respuesta completamente inesperada/)
    })
  })
})

// ─── Tests: Circuit Breaker ───────────────────────────────────────────────────

describe('Circuit Breaker OpenAI', () => {
  beforeEach(() => {
    resetCircuit()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetCircuit()
    vi.useRealTimers()
  })

  it('empieza en estado CLOSED', () => {
    expect(openaiCircuit.state).toBe('CLOSED')
    expect(openaiCircuit.failures).toBe(0)
  })

  it('tras 5 fallos de API el circuito pasa a OPEN', async () => {
    const apiError = new Error('API error 429')
    mockCreate.mockRejectedValue(apiError)

    for (let i = 0; i < 10; i++) {
      try {
        await callGPTJSON<TestType>('System', 'User', TestSchema)
      } catch {
        if (openaiCircuit.state === 'OPEN') break
      }
    }

    expect(openaiCircuit.state).toBe('OPEN')
  })

  it('con circuito OPEN la siguiente llamada lanza inmediatamente sin contactar la API', async () => {
    openaiCircuit.state       = 'OPEN'
    openaiCircuit.lastFailureAt = Date.now()
    openaiCircuit.failures    = 5

    await expect(
      callGPTJSON<TestType>('System', 'User', TestSchema)
    ).rejects.toThrow('IA temporalmente no disponible')

    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('tras 60s en OPEN pasa a HALF_OPEN y permite una request', async () => {
    vi.useFakeTimers()

    openaiCircuit.state       = 'OPEN'
    openaiCircuit.failures    = 5
    openaiCircuit.lastFailureAt = Date.now() - 61_000  // 61s en el pasado

    const validPayload = { nombre: 'LGTBI', valor: 4 }
    mockCreate.mockResolvedValueOnce(buildOpenAIResponse(JSON.stringify(validPayload)))

    const result = await callGPTJSON<TestType>('System', 'User', TestSchema)

    expect(result).toEqual(validPayload)
    expect(openaiCircuit.state).toBe('CLOSED')

    vi.useRealTimers()
  })

  it('circuito OPEN con menos de 60s → sigue rechazando', async () => {
    openaiCircuit.state       = 'OPEN'
    openaiCircuit.failures    = 5
    openaiCircuit.lastFailureAt = Date.now() - 30_000  // solo 30s

    await expect(
      callGPTJSON<TestType>('System', 'User', TestSchema)
    ).rejects.toThrow('IA temporalmente no disponible')

    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('una llamada exitosa tras HALF_OPEN cierra el circuito', async () => {
    openaiCircuit.state    = 'HALF_OPEN'
    openaiCircuit.failures = 5

    const validPayload = { nombre: 'LOPJ', valor: 6 }
    mockCreate.mockResolvedValueOnce(buildOpenAIResponse(JSON.stringify(validPayload)))

    await callGPTJSON<TestType>('System', 'User', TestSchema)

    expect(openaiCircuit.state).toBe('CLOSED')
    expect(openaiCircuit.failures).toBe(0)
  })
})
