/**
 * tests/unit/retrieval.test.ts — §1.4.6-1.4.8
 *
 * Tests unitarios del módulo RAG de retrieval.
 * Usan mocks de Supabase y OpenAI — no requieren conexión real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ArticuloContext } from '@/lib/ai/retrieval'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock Supabase client
const mockSupabaseSelect = vi.fn()
const mockRpc = vi.fn()

/**
 * Mock flexible de Supabase que devuelve un proxy encadenable.
 * Todos los métodos de query builder retornan el mismo proxy,
 * excepto los métodos terminales (single, maybySingle, limit) que
 * invocan mockSupabaseSelect.
 */
function buildChainableMock(): ReturnType<typeof vi.fn> {
  const terminal = mockSupabaseSelect
  const chain: Record<string, unknown> = {}
  const handler: ProxyHandler<object> = {
    get(_target, prop: string) {
      // Métodos terminales: llaman al mock
      if (prop === 'single' || prop === 'maybeSingle') return terminal
      if (prop === 'limit') return terminal
      // Métodos encadenables: retornan una función que retorna el proxy
      return () => new Proxy({}, handler)
    },
  }
  return new Proxy(chain, handler) as ReturnType<typeof vi.fn>
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => buildChainableMock(),
    rpc: mockRpc,
  }),
}))

// Mock generateEmbedding — retorna vector fake de 1536 dims
vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const articuloCE1: ArticuloContext = {
  id: 'uuid-ce-1',
  ley_nombre: 'CE',
  ley_codigo: 'BOE-A-1978-31229',
  articulo_numero: '1',
  apartado: null,
  titulo_capitulo: 'TÍTULO PRELIMINAR',
  texto_integro: 'España se constituye en un Estado social y democrático de Derecho...',
  similarity: 0.95,
}

const articuloLPAC53: ArticuloContext = {
  id: 'uuid-lpac-53',
  ley_nombre: 'LPAC',
  ley_codigo: 'BOE-A-2015-10565',
  articulo_numero: '53',
  apartado: null,
  titulo_capitulo: 'TÍTULO IV | CAPÍTULO I',
  texto_integro: 'Derechos del interesado en el procedimiento administrativo...',
  similarity: 0.88,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('retrieveByArticle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna el artículo correcto para CE art.1', async () => {
    mockSupabaseSelect.mockResolvedValue({ data: articuloCE1, error: null })

    const { retrieveByArticle } = await import('@/lib/ai/retrieval')
    const result = await retrieveByArticle('BOE-A-1978-31229', '1')

    expect(result).not.toBeNull()
    expect(result?.ley_nombre).toBe('CE')
    expect(result?.articulo_numero).toBe('1')
    expect(result?.texto_integro).toContain('Estado social')
  })

  it('retorna null si el artículo no existe (PGRST116)', async () => {
    mockSupabaseSelect.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    })

    const { retrieveByArticle } = await import('@/lib/ai/retrieval')
    const result = await retrieveByArticle('BOE-A-1978-31229', '999')

    expect(result).toBeNull()
  })
})

describe('retrieveBySemantic', () => {
  beforeEach(() => vi.clearAllMocks())

  it('llama a match_legislacion RPC y retorna artículos ordenados por similarity', async () => {
    mockRpc.mockResolvedValue({
      data: [articuloLPAC53, articuloCE1],
      error: null,
    })

    const { retrieveBySemantic } = await import('@/lib/ai/retrieval')
    const result = await retrieveBySemantic('plazo recurso alzada', 5)

    expect(mockRpc).toHaveBeenCalledWith('match_legislacion', expect.objectContaining({
      match_count: 5,
      filter_oposicion: undefined,
    }))
    expect(result).toHaveLength(2)
    expect(result[0].ley_nombre).toBe('LPAC')
  })

  it('hace fallback a search_legislacion si match_legislacion falla', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: 'embedding error' } })
      .mockResolvedValueOnce({ data: [articuloCE1], error: null })

    const { retrieveBySemantic } = await import('@/lib/ai/retrieval')
    const result = await retrieveBySemantic('constitución española', 5)

    expect(mockRpc).toHaveBeenCalledTimes(2)
    expect(mockRpc).toHaveBeenLastCalledWith('search_legislacion', expect.any(Object))
    expect(result).toHaveLength(1)
  })
})

describe('buildContext', () => {
  beforeEach(() => vi.clearAllMocks())

  it('no excede MAX_CONTEXT_CHARS (~8000 tokens)', async () => {
    // Simular muchos artículos
    const manyArticulos: ArticuloContext[] = Array.from({ length: 100 }, (_, i) => ({
      id: `uuid-${i}`,
      ley_nombre: 'CE',
      ley_codigo: 'BOE-A-1978-31229',
      articulo_numero: String(i + 1),
      apartado: null,
      titulo_capitulo: 'TÍTULO PRELIMINAR',
      texto_integro: 'x'.repeat(500), // 500 chars por artículo
      similarity: 0.9,
    }))

    mockSupabaseSelect.mockResolvedValue({ data: manyArticulos, error: null })
    mockRpc.mockResolvedValue({ data: manyArticulos, error: null })

    const { buildContext } = await import('@/lib/ai/retrieval')
    const ctx = await buildContext('tema-uuid-1', 'constitución')

    // 32000 chars / 500 chars por artículo = máx 64 artículos
    expect(ctx.articulos.length).toBeLessThanOrEqual(64)
    expect(ctx.tokensEstimados).toBeLessThanOrEqual(8100) // pequeño margen
  })

  it('deduplica artículos que aparecen en byTema y bySemantic', async () => {
    // Mismo artículo en ambas fuentes
    mockSupabaseSelect.mockResolvedValue({ data: [articuloCE1], error: null })
    mockRpc.mockResolvedValue({ data: [articuloCE1, articuloLPAC53], error: null })

    const { buildContext } = await import('@/lib/ai/retrieval')
    const ctx = await buildContext('tema-uuid-1', 'derechos fundamentales')

    const ids = ctx.articulos.map((a) => a.id)
    const uniqueIds = new Set(ids)
    expect(ids.length).toBe(uniqueIds.size) // sin duplicados
  })
})

describe('formatArticulo', () => {
  it('incluye ley_nombre, articulo_numero y texto en el output', async () => {
    const { formatArticulo } = await import('@/lib/ai/retrieval')
    const formatted = formatArticulo(articuloCE1)

    expect(formatted).toContain('[CE]')
    expect(formatted).toContain('Artículo 1')
    expect(formatted).toContain('Estado social')
    expect(formatted).toContain('TÍTULO PRELIMINAR')
  })
})

// ─── §2.11 Weakness-Weighted RAG ─────────────────────────────────────────────

describe('buildContext — §2.11 Weakness-Weighted RAG', () => {
  // vi.resetAllMocks() (no clearAllMocks) para vaciar la cola de mockOnce
  // entre tests y evitar que valores residuales sangren entre casos.
  beforeEach(() => vi.resetAllMocks())

  const articuloDebil: ArticuloContext = {
    id: 'uuid-lpac-21',
    ley_nombre: 'LPAC',
    ley_codigo: 'BOE-A-2015-10565',
    articulo_numero: '21',
    apartado: null,
    titulo_capitulo: 'TÍTULO IV | CAPÍTULO I',
    texto_integro: 'La Administración está obligada a dictar resolución expresa...',
  }

  it('cuando userId se pasa y RPC retorna artículos débiles, aparecen primero en el contexto', async () => {
    // Flujo con weakness boost (query=undefined → no retrieveBySemantic):
    //   1. temas.select (maybySingle) → tema número 1 (Bloque I)
    //   2. rpc('get_user_weak_articles') → [{legislacion_id: 'uuid-lpac-21', fallos: 5}]
    //   3. legislacion.select.in.eq.limit → [articuloDebil]
    //   4. retrieveByTema: legislacion.select.contains.eq.limit → [articuloCE1]
    mockSupabaseSelect
      .mockResolvedValueOnce({ data: { numero: 1 }, error: null })  // 1. temas lookup
      .mockResolvedValueOnce({ data: [articuloDebil], error: null }) // 3. legislacion.in (débiles)
      .mockResolvedValueOnce({ data: [articuloCE1], error: null })   // 4. retrieveByTema

    mockRpc.mockResolvedValueOnce({
      data: [{ legislacion_id: 'uuid-lpac-21', fallos: 5 }],
      error: null,
    }) // 2. get_user_weak_articles

    const { buildContext } = await import('@/lib/ai/retrieval')
    const ctx = await buildContext('tema-uuid-bloque1', undefined, 'user-uuid-123')

    expect(ctx.strategy).toBe('weakness-weighted')
    expect(ctx.weakArticulosCount).toBe(1)
    // El artículo débil debe aparecer PRIMERO
    expect(ctx.articulos[0].id).toBe('uuid-lpac-21')
    expect(ctx.articulos[0].articulo_numero).toBe('21')
  })

  it('cuando userId se pasa pero RPC retorna vacío, buildContext funciona igual que sin userId', async () => {
    // Usuario nuevo: sin preguntas incorrectas → RPC devuelve []
    mockSupabaseSelect
      .mockResolvedValueOnce({ data: { numero: 5 }, error: null }) // temas lookup
      .mockResolvedValueOnce({ data: [articuloCE1], error: null }) // retrieveByTema

    mockRpc
      .mockResolvedValueOnce({ data: [], error: null })                          // get_user_weak_articles
      .mockResolvedValueOnce({ data: [articuloLPAC53], error: null })            // match_legislacion

    const { buildContext } = await import('@/lib/ai/retrieval')
    const ctx = await buildContext('tema-uuid-5', undefined, 'user-nuevo-uuid')

    expect(ctx.strategy).not.toBe('weakness-weighted')
    expect(ctx.weakArticulosCount).toBe(0)
    expect(ctx.articulos.length).toBeGreaterThan(0)
  })

  it('cuando RPC falla, buildContext degrada con gracia y retorna contexto normal', async () => {
    mockSupabaseSelect
      .mockResolvedValueOnce({ data: { numero: 3 }, error: null }) // temas lookup
      .mockResolvedValueOnce({ data: [articuloCE1], error: null }) // retrieveByTema

    mockRpc
      .mockRejectedValueOnce(new Error('RPC not found')) // get_user_weak_articles → error
      .mockResolvedValueOnce({ data: [], error: null })  // match_legislacion fallback

    const { buildContext } = await import('@/lib/ai/retrieval')
    // No debe lanzar excepción
    const ctx = await buildContext('tema-uuid-3', undefined, 'user-uuid-fallo')

    expect(ctx.articulos.length).toBeGreaterThan(0)
    expect(ctx.strategy).not.toBe('weakness-weighted')
  })

  it('cuando NO se pasa userId, no llama a get_user_weak_articles', async () => {
    mockSupabaseSelect
      .mockResolvedValueOnce({ data: { numero: 2 }, error: null }) // temas lookup
      .mockResolvedValueOnce({ data: [articuloCE1], error: null }) // retrieveByTema

    mockRpc.mockResolvedValue({ data: [], error: null }) // solo llamadas semánticas

    const { buildContext } = await import('@/lib/ai/retrieval')
    await buildContext('tema-uuid-2')

    // get_user_weak_articles NO debe haberse llamado
    const rpcCalls = (mockRpc.mock.calls as string[][]).map(([name]) => name)
    expect(rpcCalls).not.toContain('get_user_weak_articles')
  })
})

// ─── §1.4.4 retrieveExamples ──────────────────────────────────────────────────

describe('retrieveExamples — §1.4.4', () => {
  beforeEach(() => vi.resetAllMocks())

  it('retorna string formateado con preguntas reales cuando hay datos', async () => {
    const preguntasFixture = [
      {
        numero: 3,
        enunciado: '¿Cuál es el plazo máximo para resolver un procedimiento administrativo?',
        opciones: ['1 mes', '3 meses', '6 meses', '1 año'],
        correcta: 1,
      },
      {
        numero: 7,
        enunciado: '¿Qué organismo fiscaliza el gasto público del Estado?',
        opciones: ['El Consejo de Estado', 'El Tribunal de Cuentas', 'El Tribunal Constitucional', 'La IGAE'],
        correcta: 1,
      },
    ]

    mockSupabaseSelect.mockResolvedValueOnce({ data: preguntasFixture, error: null })

    const { retrieveExamples } = await import('@/lib/ai/retrieval')
    const result = await retrieveExamples('tema-uuid-lpac', 2)

    expect(result).toContain('EJEMPLOS REALES DEL INAP')
    expect(result).toContain('plazo máximo para resolver')
    expect(result).toContain('B) 3 meses')
    expect(result).toContain('[Respuesta: B]')
    expect(result).toContain('Tribunal de Cuentas')
  })

  it('retorna string vacío cuando no hay preguntas oficiales para el tema', async () => {
    mockSupabaseSelect.mockResolvedValueOnce({ data: [], error: null })

    const { retrieveExamples } = await import('@/lib/ai/retrieval')
    const result = await retrieveExamples('tema-nuevo-uuid', 3)

    expect(result).toBe('')
  })

  it('retorna string vacío en caso de error de BD', async () => {
    mockSupabaseSelect.mockResolvedValueOnce({
      data: null,
      error: { message: 'relation does not exist', code: '42P01' },
    })

    const { retrieveExamples } = await import('@/lib/ai/retrieval')
    const result = await retrieveExamples('tema-uuid-error', 3)

    expect(result).toBe('')
  })
})
