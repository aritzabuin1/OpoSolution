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
