/**
 * tests/unit/claude.test.ts — OPTEK §1.6.7, §1.6.8
 *
 * Tests unitarios para callClaudeJSON y el Circuit Breaker.
 * El SDK de Anthropic se mockea completamente — sin requests reales.
 *
 * Cobertura:
 *   §1.6.7  callClaudeJSON con respuesta JSON válida
 *   §1.6.8  callClaudeJSON con respuesta inválida → retry → throw
 *   Circuit  5 fallos → OPEN → throw inmediato
 *   Circuit  OPEN + 60s → HALF_OPEN → permite 1 request
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'

// ─── Mock del SDK de Anthropic ────────────────────────────────────────────────
// vi.hoisted() garantiza que los mocks estén disponibles antes del hoisting
// de vi.mock() — necesario porque vi.mock() sube al tope del módulo en compilación.

const { mockCreate, mockStream } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockStream: vi.fn(),
}))

vi.mock('@anthropic-ai/sdk', () => {
  // Función constructora (no arrow function) para que `new Anthropic()` funcione
  function AnthropicMock() {
    return {
      messages: {
        create: mockCreate,
        stream: mockStream,
      },
    }
  }
  return { default: AnthropicMock }
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

import { callClaudeJSON, circuit } from '@/lib/ai/claude'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Construye una respuesta válida del SDK de Anthropic */
function buildAnthropicResponse(text: string) {
  return {
    content: [{ type: 'text', text }],
    usage: { input_tokens: 100, output_tokens: 50 },
    stop_reason: 'end_turn',
  }
}

/** Reinicia el circuit breaker a estado CLOSED antes de cada test */
function resetCircuit() {
  circuit.state = 'CLOSED'
  circuit.failures = 0
  circuit.lastFailureAt = 0
}

// ─── Schema de prueba ─────────────────────────────────────────────────────────

const TestSchema = z.object({
  nombre: z.string().min(1),
  valor: z.number().min(0),
})
type TestType = z.infer<typeof TestSchema>

// ─── Tests: callClaudeJSON ────────────────────────────────────────────────────

describe('callClaudeJSON', () => {
  beforeEach(() => {
    resetCircuit()
    vi.clearAllMocks()
  })

  // ── §1.6.7: Respuesta válida ────────────────────────────────────────────────

  describe('§1.6.7 — respuesta JSON válida', () => {
    it('parsea y retorna el objeto validado con el schema Zod', async () => {
      const validPayload = { nombre: 'LPAC', valor: 39 }
      mockCreate.mockResolvedValueOnce(
        buildAnthropicResponse(JSON.stringify(validPayload))
      )

      const result = await callClaudeJSON<TestType>(
        'System prompt',
        'User prompt',
        TestSchema
      )

      expect(result).toEqual(validPayload)
    })

    it('limpia bloques markdown ```json``` antes de parsear', async () => {
      const validPayload = { nombre: 'LRJSP', valor: 40 }
      const withMarkdown = '```json\n' + JSON.stringify(validPayload) + '\n```'
      mockCreate.mockResolvedValueOnce(
        buildAnthropicResponse(withMarkdown)
      )

      const result = await callClaudeJSON<TestType>(
        'System prompt',
        'User prompt',
        TestSchema
      )

      expect(result).toEqual(validPayload)
    })

    it('llama a Haiku por defecto (sin options.model especificado)', async () => {
      const validPayload = { nombre: 'CE', valor: 1 }
      mockCreate.mockResolvedValueOnce(
        buildAnthropicResponse(JSON.stringify(validPayload))
      )

      await callClaudeJSON<TestType>('System', 'User', TestSchema)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-haiku-4-5-20251001',
        })
      )
    })

    it('añade instrucción JSON al system prompt', async () => {
      const validPayload = { nombre: 'TREBEP', valor: 5 }
      mockCreate.mockResolvedValueOnce(
        buildAnthropicResponse(JSON.stringify(validPayload))
      )

      await callClaudeJSON<TestType>('Mi system prompt base', 'User', TestSchema)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('JSON válido'),
        })
      )
    })
  })

  // ── §1.6.8: Respuesta inválida → retry ────────────────────────────────────

  describe('§1.6.8 — respuesta inválida → retry → throw', () => {
    it('hace retry si la primera respuesta no es JSON válido', async () => {
      const validPayload = { nombre: 'LOPDGDD', valor: 3 }

      mockCreate
        .mockResolvedValueOnce(buildAnthropicResponse('Texto libre que no es JSON'))
        .mockResolvedValueOnce(buildAnthropicResponse(JSON.stringify(validPayload)))

      const result = await callClaudeJSON<TestType>('System', 'User', TestSchema)

      expect(result).toEqual(validPayload)
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })

    it('hace retry si el JSON no pasa la validación Zod', async () => {
      // nombre vacío no pasa min(1), valor negativo no pasa min(0)
      const invalidPayload = { nombre: '', valor: -1 }
      const validPayload = { nombre: 'LGP', valor: 47 }

      mockCreate
        .mockResolvedValueOnce(buildAnthropicResponse(JSON.stringify(invalidPayload)))
        .mockResolvedValueOnce(buildAnthropicResponse(JSON.stringify(validPayload)))

      const result = await callClaudeJSON<TestType>('System', 'User', TestSchema)

      expect(result).toEqual(validPayload)
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })

    it('el prompt de retry incluye el mensaje de corrección', async () => {
      const validPayload = { nombre: 'LGOB', valor: 50 }

      mockCreate
        .mockResolvedValueOnce(buildAnthropicResponse('no es json'))
        .mockResolvedValueOnce(buildAnthropicResponse(JSON.stringify(validPayload)))

      await callClaudeJSON<TestType>('System', 'User', TestSchema)

      // El segundo call debe incluir el mensaje de corrección en el user content
      const secondCallArgs = mockCreate.mock.calls[1][0]
      const userMessage = secondCallArgs.messages[0].content as string
      expect(userMessage).toContain('Tu respuesta anterior no era JSON válido')
    })

    it('lanza un error descriptivo si ambos intentos fallan', async () => {
      mockCreate
        .mockResolvedValueOnce(buildAnthropicResponse('primer intento inválido'))
        .mockResolvedValueOnce(buildAnthropicResponse('segundo intento también inválido'))

      await expect(
        callClaudeJSON<TestType>('System', 'User', TestSchema)
      ).rejects.toThrow(/callClaudeJSON.*2 intentos/)
    })

    it('el error incluye fragmento de la respuesta recibida', async () => {
      const badResponse = 'respuesta completamente inesperada del modelo'
      mockCreate
        .mockResolvedValueOnce(buildAnthropicResponse(badResponse))
        .mockResolvedValueOnce(buildAnthropicResponse(badResponse))

      await expect(
        callClaudeJSON<TestType>('System', 'User', TestSchema)
      ).rejects.toThrow(/respuesta completamente inesperada/)
    })
  })
})

// ─── Tests: Circuit Breaker ───────────────────────────────────────────────────

describe('Circuit Breaker', () => {
  beforeEach(() => {
    resetCircuit()
    vi.clearAllMocks()
  })

  afterEach(() => {
    resetCircuit()
    vi.useRealTimers()
  })

  it('empieza en estado CLOSED', () => {
    expect(circuit.state).toBe('CLOSED')
    expect(circuit.failures).toBe(0)
  })

  it('tras 5 fallos de API el circuito pasa a OPEN', async () => {
    const apiError = new Error('API error 529')
    mockCreate.mockRejectedValue(apiError)

    // Cada callClaudeHaiku fallida incrementa circuit.failures en 1.
    // callClaudeJSON hace hasta 2 llamadas internas (intento + retry),
    // pero el checkCircuit() puede cortar el retry una vez OPEN.
    // Acumulamos fallos hasta que el estado sea OPEN.
    for (let i = 0; i < 10; i++) {
      try {
        await callClaudeJSON<TestType>('System', 'User', TestSchema)
      } catch {
        // Esperado — seguimos hasta llegar a OPEN
        if (circuit.state === 'OPEN') break
      }
    }

    expect(circuit.state).toBe('OPEN')
  })

  it('con circuito OPEN la siguiente llamada lanza inmediatamente sin contactar la API', async () => {
    // Forzar estado OPEN directamente
    circuit.state = 'OPEN'
    circuit.lastFailureAt = Date.now()
    circuit.failures = 5

    await expect(
      callClaudeJSON<TestType>('System', 'User', TestSchema)
    ).rejects.toThrow('IA temporalmente no disponible')

    // No debe haber llamado a la API
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('tras 60s en OPEN pasa a HALF_OPEN y permite una request', async () => {
    vi.useFakeTimers()

    // Poner en OPEN con timestamp del pasado (hace >60s)
    circuit.state = 'OPEN'
    circuit.failures = 5
    circuit.lastFailureAt = Date.now() - 61_000  // 61s en el pasado

    // La llamada debe pasar (no lanzar por circuito)
    const validPayload = { nombre: 'LOVIGEN', valor: 1 }
    mockCreate.mockResolvedValueOnce(
      buildAnthropicResponse(JSON.stringify(validPayload))
    )

    const result = await callClaudeJSON<TestType>('System', 'User', TestSchema)

    expect(result).toEqual(validPayload)
    // Tras el éxito el circuito debe cerrarse
    expect(circuit.state).toBe('CLOSED')

    vi.useRealTimers()
  })

  it('circuito OPEN con menos de 60s transcurridos → sigue rechazando', async () => {
    circuit.state = 'OPEN'
    circuit.failures = 5
    circuit.lastFailureAt = Date.now() - 30_000  // solo 30s — no suficiente

    await expect(
      callClaudeJSON<TestType>('System', 'User', TestSchema)
    ).rejects.toThrow('IA temporalmente no disponible')

    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('una llamada exitosa tras HALF_OPEN cierra el circuito', async () => {
    circuit.state = 'HALF_OPEN'
    circuit.failures = 5

    const validPayload = { nombre: 'LGTBI', valor: 4 }
    mockCreate.mockResolvedValueOnce(
      buildAnthropicResponse(JSON.stringify(validPayload))
    )

    await callClaudeJSON<TestType>('System', 'User', TestSchema)

    expect(circuit.state).toBe('CLOSED')
    expect(circuit.failures).toBe(0)
  })
})
