/**
 * tests/unit/generate-test.test.ts — OPTEK §1.7.4, §1.7.5, §1.3A.18
 *
 * Tests de integración para generateTest().
 * OpenAI, retrieval, verification y Supabase se mockean completamente.
 *
 * Cobertura:
 *   §1.7.4    Flujo completo genera test de N preguntas → verificación → retorna test válido
 *   §1.7.5    Pregunta que no pasa verificación → se filtra y se reintenta
 *   Extra     Sin preguntas verificadas → lanza error descriptivo
 *   Extra     GPT-5-mini se usa (no GPT-5) para mantener coste bajo
 *   §1.3A.18  Bloque II: guardrail verifica contenido en contexto, prompt sin citas legales
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks — deben declararse ANTES de los imports bajo test ──────────────────

// vi.hoisted() garantiza disponibilidad antes del hoisting de vi.mock()
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}))

// Mock SDK OpenAI — openai.ts lo usa internamente
vi.mock('openai', () => {
  function OpenAIMock() {
    return { chat: { completions: { create: mockCreate } } }
  }
  return { default: OpenAIMock }
})

// Mock retrieval — buildContext y formatContext
const mockBuildContext = vi.fn()
const mockFormatContext = vi.fn()

vi.mock('@/lib/ai/retrieval', () => ({
  buildContext: (...args: unknown[]) => mockBuildContext(...args),
  formatContext: (...args: unknown[]) => mockFormatContext(...args),
}))

// Mock verification — extractCitations, verifyCitation, verifyContentMatch
// Así controlamos exactamente qué preguntas "pasan" la verificación
const mockExtractCitations = vi.fn()
const mockVerifyCitation = vi.fn()
const mockVerifyContentMatch = vi.fn()

vi.mock('@/lib/ai/verification', () => ({
  extractCitations: (...args: unknown[]) => mockExtractCitations(...args),
  verifyCitation: (...args: unknown[]) => mockVerifyCitation(...args),
  verifyContentMatch: (...args: unknown[]) => mockVerifyContentMatch(...args),
}))

// Mock citation-aliases — resolveLeyNombre
vi.mock('@/lib/ai/citation-aliases', () => ({
  resolveLeyNombre: (ley: string) => {
    const known: Record<string, string> = { LPAC: 'LPAC', CE: 'CE', TREBEP: 'TREBEP' }
    return known[ley] ?? null
  },
}))

// Mock Supabase server — createServiceClient para temas + tests_generados
const mockInsertSelectSingle = vi.fn()
const mockTemasSelectSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockResolvedValue({
    from: (table: string) => {
      if (table === 'tests_generados') {
        return {
          insert: () => ({
            select: () => ({ single: mockInsertSelectSingle }),
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
      return {
        from: vi.fn(),
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

// Mock sanitize
vi.mock('@/lib/utils/sanitize', () => ({
  sanitizeForAI: vi.fn((s: string) => s),
}))

// ─── Import bajo test (después de todos los mocks) ────────────────────────────

import { generateTest } from '@/lib/ai/generate-test'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TEMA_ID = 'tema-uuid-001'
const USER_ID = 'user-uuid-001'

const CONTEXT_FIXTURE = {
  articulos: [
    {
      id: 'art-001',
      ley_nombre: 'LPAC',
      ley_codigo: 'BOE-A-2015-10565',
      articulo_numero: '53',
      apartado: null,
      titulo_capitulo: 'Derechos del interesado',
      texto_integro: 'Los interesados tendrán los siguientes derechos: a) conocer el estado del procedimiento.',
    },
  ],
  tokensEstimados: 150,
  strategy: 'semantic' as const,
  esBloqueII: false,
  temaNumero: 11,
}

/** Contexto de Bloque II (ofimática) para §1.3A.18 */
const CONTEXT_BLOQUE2_FIXTURE = {
  articulos: [
    {
      id: 'sec-001',
      ley_nombre: '[OFIMATICA]',
      ley_codigo: 'ofimatica',
      articulo_numero: '',
      apartado: null,
      titulo_capitulo: 'Word 365 — Atajos de teclado básicos',
      texto_integro: 'Ctrl+B aplica negrita. Ctrl+I aplica cursiva. Ctrl+U aplica subrayado. Para insertar tabla: Pestaña Insertar > Tabla.',
    },
  ],
  tokensEstimados: 80,
  strategy: 'hybrid' as const,
  esBloqueII: true,
  temaNumero: 24,
}

/** Construye una pregunta raw válida (Claude-like payload) */
function makePreguntaRaw(idx: number) {
  return {
    enunciado: `Pregunta de test número ${idx} sobre procedimiento administrativo`,
    opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'] as [string, string, string, string],
    correcta: 0 as const,
    explicacion: `La respuesta correcta es A según el artículo ${idx} LPAC`,
    cita: { ley: 'LPAC', articulo: `${idx}`, textoExacto: 'Los interesados...' },
  }
}

/** Respuesta simulada del SDK de OpenAI. Acepta cualquier array de preguntas (Bloque I o II). */
function buildSDKResponse(preguntas: Array<Record<string, unknown>>) {
  return {
    choices: [{ message: { content: JSON.stringify({ preguntas }) }, finish_reason: 'stop' }],
    usage: { prompt_tokens: 400, completion_tokens: 200 },
  }
}

// ─── Setup base (válido para casi todos los tests) ────────────────────────────

function setupBase() {
  // Retrieval: siempre retorna contexto fixture
  mockBuildContext.mockResolvedValue(CONTEXT_FIXTURE)
  mockFormatContext.mockReturnValue('=== CONTEXTO LEGISLATIVO MOCK ===')

  // Temas: retorna título
  mockTemasSelectSingle.mockResolvedValue({
    data: { titulo: 'Procedimiento Administrativo Común' },
    error: null,
  })

  // BD insert: retorna id del test
  mockInsertSelectSingle.mockResolvedValue({
    data: { id: 'test-guardado-uuid' },
    error: null,
  })

  // Verification mocks — por defecto: NO extrae citas (verificación low confidence → pasa)
  mockExtractCitations.mockReturnValue([])
  mockVerifyCitation.mockResolvedValue({ verificada: true, cita: {}, textoEnBD: 'texto real' })
  mockVerifyContentMatch.mockReturnValue({ match: true, confidence: 'low', details: 'sin info' })
}

// ─── §1.7.4 — Flujo completo ──────────────────────────────────────────────────

describe('§1.7.4 — generateTest: flujo completo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupBase()
  })

  it('retorna TestGenerado con id, preguntas, temaId, promptVersion y createdAt', async () => {
    const preguntas = [makePreguntaRaw(1), makePreguntaRaw(2), makePreguntaRaw(3)]
    mockCreate.mockResolvedValueOnce(buildSDKResponse(preguntas))

    const result = await generateTest({
      temaId: TEMA_ID,
      numPreguntas: 3,
      dificultad: 'media',
      userId: USER_ID,
    })

    expect(result.id).toBe('test-guardado-uuid')
    expect(result.temaId).toBe(TEMA_ID)
    expect(result.promptVersion).toBe('2.0.0')
    expect(result.preguntas).toHaveLength(3)
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('las preguntas tienen la estructura correcta (enunciado, opciones, correcta, explicacion, cita)', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse([makePreguntaRaw(1)]))

    const result = await generateTest({
      temaId: TEMA_ID,
      numPreguntas: 1,
      dificultad: 'facil',
      userId: USER_ID,
    })

    const p = result.preguntas[0]
    expect(p.enunciado).toBeTruthy()
    expect(p.opciones).toHaveLength(4)
    expect([0, 1, 2, 3]).toContain(p.correcta)
    expect(p.explicacion).toBeTruthy()
    expect(p.cita).toMatchObject({ ley: expect.any(String), articulo: expect.any(String) })
  })

  it('llama a buildContext con el temaId correcto', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse([makePreguntaRaw(1)]))

    await generateTest({
      temaId: 'tema-especifico-123',
      numPreguntas: 1,
      dificultad: 'media',
      userId: USER_ID,
    })

    expect(mockBuildContext).toHaveBeenCalledWith('tema-especifico-123')
  })

  it('guarda el test en BD (INSERT a tests_generados)', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse([makePreguntaRaw(1)]))

    await generateTest({ temaId: TEMA_ID, numPreguntas: 1, dificultad: 'media', userId: USER_ID })

    expect(mockInsertSelectSingle).toHaveBeenCalled()
  })

  it('pasa la dificultad al prompt de GPT', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse([makePreguntaRaw(1)]))

    await generateTest({ temaId: TEMA_ID, numPreguntas: 1, dificultad: 'dificil', userId: USER_ID })

    const callArgs = mockCreate.mock.calls[0][0]
    // OpenAI: messages[0]=system, messages[1]=user
    const userMessage = callArgs.messages[1].content as string
    expect(userMessage).toContain('DIFÍCIL')
  })

  it('usa GPT-5-mini (no GPT-5) para mantener el coste bajo', async () => {
    mockCreate.mockResolvedValueOnce(buildSDKResponse([makePreguntaRaw(1)]))

    await generateTest({ temaId: TEMA_ID, numPreguntas: 1, dificultad: 'media', userId: USER_ID })

    const callArgs = mockCreate.mock.calls[0][0]
    expect(callArgs.model).toBe('gpt-5-mini')
  })
})

// ─── §1.7.5 — Filtrado de preguntas inválidas ─────────────────────────────────

describe('§1.7.5 — generateTest: filtrado de preguntas que no pasan verificación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupBase()
  })

  it('filtra preguntas cuya cita no existe en BD — reintenta y completa el test', async () => {
    // Primera ronda: GPT devuelve 3 preguntas
    // Pregunta 1 y 3 → pasan (extractCitations devuelve array vacío → lenient mode con LPAC reconocida)
    // Pregunta 2 → FALLA (extractCitations devuelve cita de ley DESCONOCIDA → no pasa lenient mode)
    let callCount = 0
    mockExtractCitations.mockImplementation((text: string) => {
      callCount++
      // Pregunta 2 (callCount 2): devuelve cita con ley no reconocida → FALLA en lenient mode
      if (text.includes('Pregunta de test número 2')) {
        return [{ ley: 'LEY_DESCONOCIDA', leyRaw: 'LEY_DESCONOCIDA', articulo: '999', textoOriginal: 'artículo 999 LEY_DESCONOCIDA', leyResuelta: false }]
      }
      // Resto: no extrae citas → pasa directamente (ley reconocida en campo cita)
      return []
    })

    // Verificación: art.999 → falla; cualquier otra → pasa
    mockVerifyCitation.mockImplementation((citation: { articulo: string }) => {
      if (citation.articulo === '999') {
        return Promise.resolve({ verificada: false, cita: citation, error: 'Artículo no encontrado' })
      }
      return Promise.resolve({
        verificada: true,
        cita: citation,
        textoEnBD: 'texto del artículo existente en BD',
      })
    })

    // Ronda 1: 3 preguntas (1 y 3 válidas, 2 inválida) → 2 verificadas de 3
    mockCreate
      .mockResolvedValueOnce(buildSDKResponse([
        makePreguntaRaw(1), makePreguntaRaw(2), makePreguntaRaw(3),
      ]))
      // Ronda 2 (reintento — 1 faltante): devuelve 1 pregunta
      .mockResolvedValueOnce(buildSDKResponse([makePreguntaRaw(4)]))

    // Reiniciar callCount para que el reintento no interprete pregunta4 como "pregunta 2"
    callCount = 0

    const result = await generateTest({
      temaId: TEMA_ID,
      numPreguntas: 3,
      dificultad: 'media',
      userId: USER_ID,
    })

    // Debe retornar exactamente 3 preguntas (2 de ronda 1 + 1 del reintento)
    expect(result.preguntas).toHaveLength(3)
    // Claude fue llamado 2 veces (ronda inicial + reintento)
    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('lanza error descriptivo si todas las preguntas fallan tras MAX_RETRIES', async () => {
    // TODAS las preguntas tienen citas con ley no reconocida → fallan en lenient mode
    mockExtractCitations.mockReturnValue([
      { ley: 'LEY_DESCONOCIDA', leyRaw: 'LEY_DESCONOCIDA', articulo: '999', textoOriginal: 'artículo 999 LEY_DESCONOCIDA', leyResuelta: false },
    ])
    mockVerifyCitation.mockResolvedValue({
      verificada: false,
      cita: { ley: 'LEY_DESCONOCIDA', articulo: '999' },
      error: 'Artículo no encontrado',
    })

    mockCreate.mockResolvedValue(buildSDKResponse([makePreguntaRaw(1)]))

    await expect(
      generateTest({ temaId: TEMA_ID, numPreguntas: 3, dificultad: 'media', userId: USER_ID })
    ).rejects.toThrow(/No se pudieron generar preguntas verificadas/)
  })

  it('filtra pregunta cuyo contenido es inconsistente con el artículo real (confidence=high)', async () => {
    // Extrae cita → cita existe en BD → pero el contenido no coincide (plazo incorrecto)
    mockExtractCitations.mockReturnValue([
      { ley: 'LPAC', leyRaw: 'LPAC', articulo: '53', textoOriginal: 'artículo 53 LPAC', leyResuelta: true },
    ])
    mockVerifyCitation.mockResolvedValue({
      verificada: true,
      cita: { ley: 'LPAC', articulo: '53' },
      textoEnBD: 'El plazo máximo para resolver será de tres meses.',
    })
    // ContentMatch: plazo incorrecto → no coincide, confidence=high
    mockVerifyContentMatch.mockReturnValue({
      match: false,
      confidence: 'high',
      details: 'Plazo 999 días no encontrado en el artículo',
    })

    // Todas las preguntas generadas fallan content match → error
    mockCreate.mockResolvedValue(buildSDKResponse([makePreguntaRaw(1)]))

    await expect(
      generateTest({ temaId: TEMA_ID, numPreguntas: 1, dificultad: 'media', userId: USER_ID })
    ).rejects.toThrow(/No se pudieron generar preguntas verificadas/)
  })

  it('acepta pregunta con content match confidence=low (sin info verificable)', async () => {
    // Extrae cita → existe en BD → contenido no match con confidence=LOW → acepta
    mockExtractCitations.mockReturnValue([
      { ley: 'LPAC', leyRaw: 'LPAC', articulo: '53', textoOriginal: 'artículo 53 LPAC', leyResuelta: true },
    ])
    mockVerifyCitation.mockResolvedValue({
      verificada: true,
      cita: { ley: 'LPAC', articulo: '53' },
      textoEnBD: 'texto del artículo',
    })
    // ContentMatch: no match pero confidence=low → se acepta igualmente
    mockVerifyContentMatch.mockReturnValue({
      match: false,
      confidence: 'low',
      details: 'Sin información verificable',
    })

    mockCreate.mockResolvedValueOnce(buildSDKResponse([makePreguntaRaw(1)]))

    const result = await generateTest({
      temaId: TEMA_ID,
      numPreguntas: 1,
      dificultad: 'media',
      userId: USER_ID,
    })

    // Debe pasar la verificación y retornar la pregunta
    expect(result.preguntas).toHaveLength(1)
  })
})

// ─── §1.3A.18 — Guardrail Bloque II (ofimática) ───────────────────────────────

describe('§1.3A.18 — generateTest Bloque II: guardrail de contexto técnico', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupBase()
    // Sobrescribir contexto con Bloque II fixture
    mockBuildContext.mockResolvedValue(CONTEXT_BLOQUE2_FIXTURE)
    mockFormatContext.mockReturnValue(
      '=== Word 365 — Atajos ===\nCtrl+B aplica negrita. Ctrl+I aplica cursiva. Ctrl+U aplica subrayado. Para insertar tabla: Pestaña Insertar > Tabla.'
    )
  })

  /** Pregunta de ofimática cuya opción correcta aparece en el contexto */
  function makePreguntaOfimatica(opcionCorrecta: string) {
    return {
      enunciado: '¿Cuál es el atajo de teclado para aplicar negrita en Word?',
      opciones: [opcionCorrecta, 'Ctrl+I', 'Ctrl+U', 'Alt+B'] as [string, string, string, string],
      correcta: 0 as const,
      explicacion: `El atajo ${opcionCorrecta} aplica el formato negrita en Word 365.`,
      dificultad: 'facil' as const,
      // Sin campo "cita" — prueba que el schema lo acepta como optional
    }
  }

  it('acepta pregunta cuya opción correcta aparece en el contexto técnico', async () => {
    // "ctrl+b" está en el contexto → debe pasar el guardrail
    const pregunta = makePreguntaOfimatica('Ctrl+B')
    mockCreate.mockResolvedValueOnce(buildSDKResponse([pregunta]))

    const result = await generateTest({
      temaId: 'tema-word-uuid',
      numPreguntas: 1,
      dificultad: 'facil',
      userId: USER_ID,
    })

    expect(result.preguntas).toHaveLength(1)
    // Pregunta de Bloque II NO tiene cita legal
    expect(result.preguntas[0].cita).toBeUndefined()
  })

  it('rechaza pregunta cuya opción correcta no aparece en el contexto (hallucination)', async () => {
    // "Ctrl+W" NO está en el contexto → debe fallar el guardrail → se reintenta → falla todo
    const preguntaInventada = {
      enunciado: '¿Cuál es el atajo para guardar en Word?',
      opciones: ['Ctrl+W', 'Ctrl+R', 'Ctrl+Y', 'Ctrl+Z'] as [string, string, string, string],
      correcta: 0 as const,
      explicacion: 'Ctrl+W guarda el documento en Word 365.',
      dificultad: 'facil' as const,
    }
    // Contexto muy corto para que no sea modo lenient pero sin estas opciones
    // Actualizar contexto para que sea lo suficientemente largo pero sin las opciones
    mockFormatContext.mockReturnValue(
      '=== Word 365 — Atajos ===\nCtrl+B aplica negrita. Ctrl+I aplica cursiva. Ctrl+U aplica subrayado. Para insertar una tabla utiliza la pestaña Insertar y selecciona la opción Tabla en el grupo correspondiente.'
    )

    mockCreate.mockResolvedValue(buildSDKResponse([preguntaInventada]))

    await expect(
      generateTest({ temaId: 'tema-word-uuid', numPreguntas: 1, dificultad: 'facil', userId: USER_ID })
    ).rejects.toThrow(/No se pudieron generar preguntas verificadas/)
  })

  it('usa SYSTEM_GENERATE_TEST_BLOQUE2 (no el sistema legal) para Bloque II', async () => {
    const pregunta = makePreguntaOfimatica('Ctrl+B')
    mockCreate.mockResolvedValueOnce(buildSDKResponse([pregunta]))

    await generateTest({
      temaId: 'tema-word-uuid',
      numPreguntas: 1,
      dificultad: 'media',
      userId: USER_ID,
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const systemMessage = callArgs.messages[0].content as string
    // El sistema de Bloque II menciona ofimática, no citas de leyes
    expect(systemMessage).toContain('ofimática')
    expect(systemMessage).not.toContain('citar el artículo exacto de la ley')
  })

  it('el user prompt de Bloque II usa "CONTEXTO TÉCNICO" en lugar de "CONTEXTO LEGISLATIVO"', async () => {
    const pregunta = makePreguntaOfimatica('Ctrl+B')
    mockCreate.mockResolvedValueOnce(buildSDKResponse([pregunta]))

    await generateTest({
      temaId: 'tema-word-uuid',
      numPreguntas: 1,
      dificultad: 'facil',
      userId: USER_ID,
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const userMessage = callArgs.messages[1].content as string
    expect(userMessage).toContain('CONTEXTO TÉCNICO')
    expect(userMessage).not.toContain('CONTEXTO LEGISLATIVO')
  })

  it('acepta todas las preguntas en modo lenient cuando el contexto es muy corto', async () => {
    // Contexto muy corto (<200 chars) → modo lenient → acepta aunque la opción no esté
    mockFormatContext.mockReturnValue('Contexto corto.')

    const pregunta = makePreguntaOfimatica('Alt+X')  // Alt+X no está en el contexto corto
    mockCreate.mockResolvedValueOnce(buildSDKResponse([pregunta]))

    const result = await generateTest({
      temaId: 'tema-word-uuid',
      numPreguntas: 1,
      dificultad: 'facil',
      userId: USER_ID,
    })

    // Modo lenient: acepta la pregunta aunque no esté en el contexto
    expect(result.preguntas).toHaveLength(1)
  })
})
