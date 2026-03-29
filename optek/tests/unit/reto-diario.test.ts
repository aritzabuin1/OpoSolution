/**
 * tests/unit/reto-diario.test.ts — §2.20.12
 *
 * Tests unitarios para generateRetoDiarioOnDemand().
 * Supabase, OpenAI y logger se mockean — no requieren conexión real.
 *
 * Cobertura:
 *   §2.20.12 — Idempotencia: si el reto del día ya existe → retorna existente sin llamar a GPT
 *   §2.20.12 — Race condition: UNIQUE violation (23505) → fetch retry + retorna existente
 *   §2.20.13 — Sin artículos disponibles → lanza error
 *   §2.20.13 — Artículos demasiado cortos → lanza error
 *   §2.20.14 — Rama sin leyes configuradas → lanza error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const RETO_EXISTENTE = {
  id: 'reto-uuid-001',
  fecha: '2026-03-01',
  rama: 'age',
  ley_nombre: 'Ley 39/2015 LPAC',
  articulo_numero: '21',
  texto_trampa: 'El plazo es de cuarenta días.',
  num_errores: 3,
}

const ARTICULO_VALIDO = {
  id: 'art-uuid-001',
  ley_nombre: 'Ley 39/2015 LPAC',
  articulo_numero: '21',
  titulo_capitulo: null,
  texto_integro: 'La Administración está obligada a dictar resolución expresa y a notificarla en todos los procedimientos. El plazo máximo en el que debe notificarse la resolución es de treinta días.  Este artículo es suficientemente largo como para pasar el filtro mínimo de 300 caracteres necesarios para ser seleccionado como candidato para el Reto Diario. Aquí añadimos más texto para asegurarnos de que cumple con el requisito de longitud establecido en el módulo de generación.',
}

const GPT_RESULTADO = {
  texto_trampa: 'La Administración está obligada a dictar resolución expresa y a notificarla en todos los procedimientos. El plazo máximo en el que debe notificarse la resolución es de cuarenta días.',
  errores_reales: [
    {
      tipo: 'plazo',
      valor_original: 'treinta días',
      valor_trampa: 'cuarenta días',
      explicacion: 'El plazo correcto es treinta días.',
    },
  ],
}

// ─── Mock: maybeSingle para la verificación de existencia ─────────────────────

const mockMaybySingle = vi.fn()
const mockSingle = vi.fn()
const mockInsertSelect = vi.fn()
const mockInsert = vi.fn()

// Mock de callAIJSON
vi.mock('@/lib/ai/provider', () => ({
  callAIJSON: vi.fn(),
}))

// Mock de prompts
vi.mock('@/lib/ai/prompts', () => ({
  SYSTEM_CAZATRAMPAS: 'system prompt',
  buildCazaTrampasPrompt: vi.fn(() => 'user prompt'),
}))

// Mock de schemas
vi.mock('@/lib/ai/schemas', () => ({
  CazaTrampasRawSchema: {
    parse: vi.fn((data) => data),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

// ─── Mock de Supabase — construido por tabla ────────────────────────────────────
// Chain: .select().eq('fecha').eq('rama').maybeSingle() for reto_diario
// Chain: .select().eq('fecha').eq('rama').single() for retry after 23505

function buildSupabaseMock() {
  return {
    from: (table: string) => {
      if (table === 'reto_diario') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: mockMaybySingle,
                single: mockSingle,
              }),
            }),
          }),
          insert: mockInsert,
        }
      }
      if (table === 'legislacion') {
        return {
          select: () => ({
            eq: () => ({
              not: () => ({
                in: () => ({
                  limit: () => Promise.resolve({ data: [ARTICULO_VALIDO], error: null }),
                }),
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => Promise.resolve(buildSupabaseMock())),
}))

// ─── Import bajo test (DESPUÉS de los mocks) ──────────────────────────────────

import { generateRetoDiarioOnDemand } from '@/lib/ai/reto-diario'
import { callAIJSON } from '@/lib/ai/provider'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateRetoDiarioOnDemand — §2.20.12 Idempotencia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna el reto existente sin llamar a GPT si ya existe para esa fecha+rama', async () => {
    mockMaybySingle.mockResolvedValueOnce({ data: RETO_EXISTENTE, error: null })

    const resultado = await generateRetoDiarioOnDemand('2026-03-01', 'age')

    expect(resultado).toEqual(RETO_EXISTENTE)
    expect(callAIJSON).not.toHaveBeenCalled()
  })

  it('genera el reto si no existe para esa fecha+rama', async () => {
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: null })
    vi.mocked(callAIJSON).mockResolvedValueOnce(GPT_RESULTADO)
    mockInsert.mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: RETO_EXISTENTE, error: null }),
      }),
    })

    const resultado = await generateRetoDiarioOnDemand('2026-03-01', 'age')

    expect(callAIJSON).toHaveBeenCalledTimes(1)
    expect(resultado.id).toBe(RETO_EXISTENTE.id)
  })

  it('UNIQUE violation (23505): hace retry fetch y retorna el existente — §2.20.12 race condition', async () => {
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: null })
    vi.mocked(callAIJSON).mockResolvedValueOnce(GPT_RESULTADO)
    mockInsert.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({ data: null, error: { code: '23505', message: 'unique_violation' } }),
      }),
    })
    mockSingle.mockResolvedValueOnce({ data: RETO_EXISTENTE, error: null })

    const resultado = await generateRetoDiarioOnDemand('2026-03-01', 'age')

    expect(resultado).toEqual(RETO_EXISTENTE)
  })
})

describe('generateRetoDiarioOnDemand — §2.20.13 Errores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lanza error si no hay artículos disponibles en BD', async () => {
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: null })

    const { createServiceClient } = await import('@/lib/supabase/server')
    vi.mocked(createServiceClient).mockResolvedValueOnce({
      from: (table: string) => {
        if (table === 'reto_diario') {
          return {
            select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
            insert: mockInsert,
          }
        }
        if (table === 'legislacion') {
          return {
            select: () => ({
              eq: () => ({
                not: () => ({
                  in: () => ({
                    limit: () => Promise.resolve({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await expect(generateRetoDiarioOnDemand('2026-03-01', 'age')).rejects.toThrow('No hay artículos disponibles')
  })

  it('lanza error si todos los artículos son demasiado cortos (<300 chars)', async () => {
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: null })

    const { createServiceClient } = await import('@/lib/supabase/server')
    vi.mocked(createServiceClient).mockResolvedValueOnce({
      from: (table: string) => {
        if (table === 'reto_diario') {
          return {
            select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
            insert: mockInsert,
          }
        }
        if (table === 'legislacion') {
          return {
            select: () => ({
              eq: () => ({
                not: () => ({
                  in: () => ({
                    limit: () => Promise.resolve({
                      data: [{ ...ARTICULO_VALIDO, texto_integro: 'Texto corto.' }],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await expect(generateRetoDiarioOnDemand('2026-03-01', 'age')).rejects.toThrow('Artículos demasiado cortos')
  })

  it('lanza error si la rama no tiene leyes configuradas', async () => {
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: null })

    await expect(generateRetoDiarioOnDemand('2026-03-01', 'unknown_rama')).rejects.toThrow('No hay leyes configuradas para rama: unknown_rama')
  })
})
