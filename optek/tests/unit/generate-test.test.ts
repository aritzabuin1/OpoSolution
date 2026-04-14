/**
 * tests/unit/generate-test.test.ts — OPTEK §1.7.4, §1.7.5, §1.3A.18
 *
 * Tests de integración para generateTest().
 * Provider (callAIJSON), retrieval, verification y Supabase se mockean completamente.
 *
 * Cobertura:
 *   §1.7.4    Flujo completo genera test de N preguntas → verificación → retorna test válido
 *   §1.7.5    Pregunta que no pasa verificación → se filtra y se reintenta
 *   Extra     Sin preguntas verificadas → lanza error descriptivo
 *   §1.3A.18  Bloque II: guardrail verifica contenido en contexto, prompt sin citas legales
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks — deben declararse ANTES de los imports bajo test ──────────────────

// vi.hoisted() garantiza disponibilidad antes del hoisting de vi.mock()
const { mockCallAIJSON } = vi.hoisted(() => ({
  mockCallAIJSON: vi.fn(),
}))

// Mock provider — callAIJSON se usa en generate-test.ts
vi.mock('@/lib/ai/provider', () => ({
  callAIJSON: mockCallAIJSON,
}))

// Mock retrieval — buildContext, formatContext y retrieveExamples
const mockBuildContext = vi.fn()
const mockFormatContext = vi.fn()
const mockRetrieveExamples = vi.fn()

vi.mock('@/lib/ai/retrieval', () => ({
  buildContext: (...args: unknown[]) => mockBuildContext(...args),
  formatContext: (...args: unknown[]) => mockFormatContext(...args),
  retrieveExamples: (...args: unknown[]) => mockRetrieveExamples(...args),
}))

// Mock verification — extractCitations, batchVerifyCitations, verifyContentMatch
// Así controlamos exactamente qué preguntas "pasan" la verificación
const mockExtractCitations = vi.fn()
const mockBatchVerifyCitations = vi.fn()
const mockVerifyContentMatch = vi.fn()

vi.mock('@/lib/ai/verification', () => ({
  extractCitations: (...args: unknown[]) => mockExtractCitations(...args),
  batchVerifyCitations: (...args: unknown[]) => mockBatchVerifyCitations(...args),
  verifyContentMatch: (...args: unknown[]) => mockVerifyContentMatch(...args),
}))

// Mock citation-aliases — resolveLeyNombre
vi.mock('@/lib/ai/citation-aliases', () => ({
  resolveLeyNombre: (ley: string) => {
    const known: Record<string, string> = { LPAC: 'LPAC', CE: 'CE', TREBEP: 'TREBEP' }
    return known[ley] ?? null
  },
}))

// Mock Supabase server — createServiceClient para temas + tests_generados + preguntas_oficiales
const mockInsertSelectSingle = vi.fn()
const mockTemasSelectSingle = vi.fn()
const mockPreguntasOficialesResult = vi.fn()

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
      if (table === 'preguntas_oficiales') {
        return {
          select: () => ({
            // fillWithOfficialQuestions now queries without tema_id filter
            limit: mockPreguntasOficialesResult,
            eq: () => ({
              limit: mockPreguntasOficialesResult,
            }),
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
  bloqueType: null,
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
  bloqueType: 'ofimatica',
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

/** Respuesta simulada de callAIJSON. Acepta cualquier array de preguntas (Bloque I o II). */
function buildAIResponse(preguntas: Array<Record<string, unknown>>) {
  return { preguntas }
}

// ─── Setup base (válido para casi todos los tests) ────────────────────────────

function setupBase() {
  // Retrieval: siempre retorna contexto fixture
  mockBuildContext.mockResolvedValue(CONTEXT_FIXTURE)
  mockFormatContext.mockReturnValue('=== CONTEXTO LEGISLATIVO MOCK ===')
  // §1.4.4: ejemplos INAP — por defecto vacío (la mayoría de temas no tienen aún)
  mockRetrieveExamples.mockResolvedValue('')

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

  // preguntas_oficiales: por defecto vacío (no hay fallback)
  mockPreguntasOficialesResult.mockResolvedValue({ data: [], error: null })

  // Verification mocks — por defecto: NO extrae citas (sin citas → acepta pregunta directamente)
  mockExtractCitations.mockReturnValue([])
  mockBatchVerifyCitations.mockResolvedValue(new Map())
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
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse(preguntas))

    const result = await generateTest({
      temaId: TEMA_ID,
      numPreguntas: 3,
      dificultad: 'media',
      userId: USER_ID,
    })

    expect(result.id).toBe('test-guardado-uuid')
    expect(result.temaId).toBe(TEMA_ID)
    expect(result.promptVersion).toBe('2.7.0')
    expect(result.preguntas).toHaveLength(3)
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('las preguntas tienen la estructura correcta (enunciado, opciones, correcta, explicacion, cita)', async () => {
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([makePreguntaRaw(1)]))

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
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([makePreguntaRaw(1)]))

    await generateTest({
      temaId: 'tema-especifico-123',
      numPreguntas: 1,
      dificultad: 'media',
      userId: USER_ID,
    })

    // §2.11: buildContext ahora recibe (temaId, query?, userId?) — weakness-weighted RAG
    expect(mockBuildContext).toHaveBeenCalledWith('tema-especifico-123', undefined, USER_ID)
  })

  it('guarda el test en BD (INSERT a tests_generados)', async () => {
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([makePreguntaRaw(1)]))

    await generateTest({ temaId: TEMA_ID, numPreguntas: 1, dificultad: 'media', userId: USER_ID })

    expect(mockInsertSelectSingle).toHaveBeenCalled()
  })

  it('pasa la dificultad al prompt', async () => {
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([makePreguntaRaw(1)]))

    await generateTest({ temaId: TEMA_ID, numPreguntas: 1, dificultad: 'dificil', userId: USER_ID })

    // callAIJSON(systemPrompt, userPrompt, schema, options)
    const userPrompt = mockCallAIJSON.mock.calls[0][1] as string
    expect(userPrompt).toContain('DIFÍCIL')
  })
})

// ─── §1.7.5 — Filtrado de preguntas inválidas ─────────────────────────────────

describe('§1.7.5 — generateTest: filtrado de preguntas que no pasan verificación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupBase()
  })

  it('filtra preguntas cuya cita no existe en BD — acepta parcial sin reintentar', async () => {
    // Pregunta 2 → tiene cita con ley DESCONOCIDA → rechazada por verifyPreguntas
    // Preguntas 1 y 3 → sin citas → aceptadas
    mockExtractCitations.mockImplementation((text: string) => {
      if (text.includes('Pregunta de test número 2')) {
        return [{ ley: 'LEY_DESCONOCIDA', leyRaw: 'LEY_DESCONOCIDA', articulo: '999', textoOriginal: 'artículo 999 LEY_DESCONOCIDA', leyResuelta: false }]
      }
      return []
    })

    // Batch verification: return empty map (ley desconocida won't be found)
    mockBatchVerifyCitations.mockResolvedValue(new Map([
      ['artículo 999 LEY_DESCONOCIDA', { verificada: false }],
    ]))

    // Single pass: 3 preguntas (1 y 3 válidas, 2 inválida) → 2 verificadas
    mockCallAIJSON
      .mockResolvedValueOnce(buildAIResponse([
        makePreguntaRaw(1), makePreguntaRaw(2), makePreguntaRaw(3),
      ]))

    const result = await generateTest({
      temaId: TEMA_ID,
      numPreguntas: 3,
      dificultad: 'media',
      userId: USER_ID,
    })

    // Returns partial: 2/3 verified (no retry)
    expect(result.preguntas).toHaveLength(2)
    // AI called only once (single-pass, no retries)
    expect(mockCallAIJSON).toHaveBeenCalledTimes(1)
  })

  it('lanza error descriptivo si ninguna pregunta pasa verificación', async () => {
    // TODAS las preguntas tienen citas con ley no reconocida → fallan
    mockExtractCitations.mockReturnValue([
      { ley: 'LEY_DESCONOCIDA', leyRaw: 'LEY_DESCONOCIDA', articulo: '999', textoOriginal: 'artículo 999 LEY_DESCONOCIDA', leyResuelta: false },
    ])
    mockBatchVerifyCitations.mockResolvedValue(new Map([
      ['artículo 999 LEY_DESCONOCIDA', { verificada: false }],
    ]))

    mockCallAIJSON.mockResolvedValue(buildAIResponse([makePreguntaRaw(1)]))

    await expect(
      generateTest({ temaId: TEMA_ID, numPreguntas: 3, dificultad: 'media', userId: USER_ID })
    ).rejects.toThrow(/Ninguna pregunta verificada/)
  })

  it('filtra pregunta cuyo contenido es inconsistente con el artículo real (confidence=high)', async () => {
    // Cita LPAC art.53 → existe en BD → pero contenido no coincide (plazo incorrecto)
    mockExtractCitations.mockReturnValue([
      { ley: 'LPAC', leyRaw: 'LPAC', articulo: '53', textoOriginal: 'artículo 53 LPAC', leyResuelta: true },
    ])
    mockBatchVerifyCitations.mockResolvedValue(new Map([
      ['artículo 53 LPAC', { verificada: true, textoEnBD: 'El plazo máximo para resolver será de tres meses.' }],
    ]))
    // ContentMatch: plazo incorrecto → no coincide, confidence=high
    mockVerifyContentMatch.mockReturnValue({
      match: false,
      confidence: 'high',
      details: 'Plazo 999 días no encontrado en el artículo',
    })

    mockCallAIJSON.mockResolvedValue(buildAIResponse([makePreguntaRaw(1)]))

    await expect(
      generateTest({ temaId: TEMA_ID, numPreguntas: 1, dificultad: 'media', userId: USER_ID })
    ).rejects.toThrow(/Ninguna pregunta verificada/)
  })

  it('acepta pregunta con content match confidence=low (sin info verificable)', async () => {
    // Cita LPAC art.53 → existe en BD → contenido no match con confidence=LOW → acepta
    mockExtractCitations.mockReturnValue([
      { ley: 'LPAC', leyRaw: 'LPAC', articulo: '53', textoOriginal: 'artículo 53 LPAC', leyResuelta: true },
    ])
    mockBatchVerifyCitations.mockResolvedValue(new Map([
      ['artículo 53 LPAC', { verificada: true, textoEnBD: 'texto del artículo' }],
    ]))
    mockVerifyContentMatch.mockReturnValue({
      match: false,
      confidence: 'low',
      details: 'Sin información verificable',
    })

    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([makePreguntaRaw(1)]))

    const result = await generateTest({
      temaId: TEMA_ID,
      numPreguntas: 1,
      dificultad: 'media',
      userId: USER_ID,
    })

    expect(result.preguntas).toHaveLength(1)
  })
})

// ─── INAP fill — rellenar con preguntas oficiales ────────────────────────────

describe('generateTest: INAP fill cuando verificación filtra preguntas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupBase()
  })

  it('rellena con preguntas oficiales INAP si verificación filtra algunas', async () => {
    // Setup: 3 preguntas pedidas, la #2 falla verificación → solo 2 pasan
    mockExtractCitations.mockImplementation((text: string) => {
      if (text.includes('Pregunta de test número 2')) {
        return [{ ley: 'LEY_DESCONOCIDA', leyRaw: 'LEY_DESCONOCIDA', articulo: '999', textoOriginal: 'artículo 999 LEY_DESCONOCIDA', leyResuelta: false }]
      }
      return []
    })
    mockBatchVerifyCitations.mockResolvedValue(new Map([
      ['artículo 999 LEY_DESCONOCIDA', { verificada: false }],
    ]))

    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([
      makePreguntaRaw(1), makePreguntaRaw(2), makePreguntaRaw(3),
    ]))

    // Mock preguntas_oficiales returns 1 question to fill the gap
    mockPreguntasOficialesResult.mockResolvedValue({
      data: [{
        enunciado: 'Pregunta oficial INAP sobre procedimiento',
        opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        correcta: 1,
      }],
      error: null,
    })

    const result = await generateTest({
      temaId: TEMA_ID,
      numPreguntas: 3,
      dificultad: 'media',
      userId: USER_ID,
    })

    // Should have 3 questions: 2 AI-generated + 1 INAP fill
    expect(result.preguntas).toHaveLength(3)
    // AI called only once (no retry)
    expect(mockCallAIJSON).toHaveBeenCalledTimes(1)
  })

  it('no rellena con INAP para Bloque II (ofimática no tiene preguntas oficiales)', async () => {
    mockBuildContext.mockResolvedValue({
      ...CONTEXT_BLOQUE2_FIXTURE,
    })
    mockFormatContext.mockReturnValue(
      '=== Word 365 — Atajos ===\nCtrl+B aplica negrita. Ctrl+I aplica cursiva. Ctrl+U aplica subrayado. Para insertar tabla: Pestaña Insertar > Tabla.'
    )

    // Both questions pass guardrail (Bloque II is lenient)
    const pregunta1 = {
      enunciado: '¿Cuál es el atajo para negrita?',
      opciones: ['Ctrl+B', 'Ctrl+I', 'Ctrl+U', 'Alt+B'] as [string, string, string, string],
      correcta: 0 as const,
      explicacion: 'Ctrl+B aplica negrita.',
      dificultad: 'facil' as const,
    }
    // Only 1 question generated for 2 requested → would need fill
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([pregunta1]))

    const result = await generateTest({
      temaId: 'tema-word-uuid',
      numPreguntas: 2,
      dificultad: 'facil',
      userId: USER_ID,
    })

    // Only 1 question, Bloque II does NOT fill with INAP
    expect(result.preguntas).toHaveLength(1)
    // preguntas_oficiales should NOT be queried
    expect(mockPreguntasOficialesResult).not.toHaveBeenCalled()
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
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([pregunta]))

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

    mockCallAIJSON.mockResolvedValue(buildAIResponse([preguntaInventada]))

    await expect(
      generateTest({ temaId: 'tema-word-uuid', numPreguntas: 1, dificultad: 'facil', userId: USER_ID })
    ).rejects.toThrow(/Ninguna pregunta verificada/)
  })

  it('usa SYSTEM_GENERATE_TEST_BLOQUE2 (no el sistema legal) para Bloque II', async () => {
    const pregunta = makePreguntaOfimatica('Ctrl+B')
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([pregunta]))

    await generateTest({
      temaId: 'tema-word-uuid',
      numPreguntas: 1,
      dificultad: 'media',
      userId: USER_ID,
    })

    // callAIJSON(systemPrompt, userPrompt, schema, options)
    const systemPrompt = mockCallAIJSON.mock.calls[0][0] as string
    // El sistema de Bloque II menciona ofimática, no citas de leyes
    expect(systemPrompt).toContain('ofimática')
    expect(systemPrompt).not.toContain('citar el artículo exacto de la ley')
  })

  it('el user prompt de Bloque II usa "CONTEXTO TÉCNICO" en lugar de "CONTEXTO LEGISLATIVO"', async () => {
    const pregunta = makePreguntaOfimatica('Ctrl+B')
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([pregunta]))

    await generateTest({
      temaId: 'tema-word-uuid',
      numPreguntas: 1,
      dificultad: 'facil',
      userId: USER_ID,
    })

    // callAIJSON(systemPrompt, userPrompt, schema, options)
    const userPrompt = mockCallAIJSON.mock.calls[0][1] as string
    expect(userPrompt).toContain('CONTEXTO TÉCNICO')
    expect(userPrompt).not.toContain('CONTEXTO LEGISLATIVO')
  })

  it('acepta todas las preguntas en modo lenient cuando el contexto es muy corto', async () => {
    // Contexto muy corto (<200 chars) → modo lenient → acepta aunque la opción no esté
    mockFormatContext.mockReturnValue('Contexto corto.')

    const pregunta = makePreguntaOfimatica('Alt+X')  // Alt+X no está en el contexto corto
    mockCallAIJSON.mockResolvedValueOnce(buildAIResponse([pregunta]))

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
