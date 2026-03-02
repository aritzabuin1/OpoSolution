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
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Datos de prueba ───────────────────────────────────────────────────────────

const RETO_EXISTENTE = {
  id: 'reto-uuid-001',
  fecha: '2026-03-01',
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

// Mock de callGPTJSON
vi.mock('@/lib/ai/openai', () => ({
  callGPTJSON: vi.fn(),
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

function buildSupabaseMock() {
  return {
    from: (table: string) => {
      if (table === 'reto_diario') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: mockMaybySingle,
              single: mockSingle,
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
                limit: () => Promise.resolve({ data: [ARTICULO_VALIDO], error: null }),
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
import { callGPTJSON } from '@/lib/ai/openai'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateRetoDiarioOnDemand — §2.20.12 Idempotencia', () => {
  beforeEach(() => {
    // clearAllMocks limpia el historial pero preserva las implementaciones de vi.mock factories
    vi.clearAllMocks()
  })

  it('retorna el reto existente sin llamar a GPT si ya existe para esa fecha', async () => {
    // Primera consulta: reto ya existe en BD
    mockMaybySingle.mockResolvedValueOnce({ data: RETO_EXISTENTE, error: null })

    const resultado = await generateRetoDiarioOnDemand('2026-03-01')

    expect(resultado).toEqual(RETO_EXISTENTE)
    // GPT NO debe haberse llamado
    expect(callGPTJSON).not.toHaveBeenCalled()
  })

  it('genera el reto si no existe para esa fecha', async () => {
    // Primera consulta (check existencia): no existe
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: null })
    // GPT devuelve resultado válido
    vi.mocked(callGPTJSON).mockResolvedValueOnce(GPT_RESULTADO)
    // INSERT exitoso
    mockInsert.mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: RETO_EXISTENTE, error: null }),
      }),
    })

    const resultado = await generateRetoDiarioOnDemand('2026-03-01')

    expect(callGPTJSON).toHaveBeenCalledTimes(1)
    expect(resultado.id).toBe(RETO_EXISTENTE.id)
  })

  it('UNIQUE violation (23505): hace retry fetch y retorna el existente — §2.20.12 race condition', async () => {
    // Check inicial: no existe
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: null })
    // GPT OK
    vi.mocked(callGPTJSON).mockResolvedValueOnce(GPT_RESULTADO)
    // INSERT falla con 23505 (race condition: otro proceso lo creó antes)
    mockInsert.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({ data: null, error: { code: '23505', message: 'unique_violation' } }),
      }),
    })
    // Retry fetch: devuelve el existente
    mockSingle.mockResolvedValueOnce({ data: RETO_EXISTENTE, error: null })

    const resultado = await generateRetoDiarioOnDemand('2026-03-01')

    expect(resultado).toEqual(RETO_EXISTENTE)
  })
})

describe('generateRetoDiarioOnDemand — §2.20.13 Errores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lanza error si no hay artículos disponibles en BD', async () => {
    // Check existencia: no existe
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: null })

    // Override: legislacion devuelve lista vacía
    const { createServiceClient } = await import('@/lib/supabase/server')
    vi.mocked(createServiceClient).mockResolvedValueOnce({
      from: (table: string) => {
        if (table === 'reto_diario') {
          return {
            select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
            insert: mockInsert,
          }
        }
        if (table === 'legislacion') {
          return {
            select: () => ({
              eq: () => ({
                not: () => ({
                  limit: () => Promise.resolve({ data: [], error: null }),
                }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    await expect(generateRetoDiarioOnDemand('2026-03-01')).rejects.toThrow('No hay artículos disponibles')
  })

  it('lanza error si todos los artículos son demasiado cortos (<300 chars)', async () => {
    mockMaybySingle.mockResolvedValueOnce({ data: null, error: null })

    const { createServiceClient } = await import('@/lib/supabase/server')
    vi.mocked(createServiceClient).mockResolvedValueOnce({
      from: (table: string) => {
        if (table === 'reto_diario') {
          return {
            select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
            insert: mockInsert,
          }
        }
        if (table === 'legislacion') {
          return {
            select: () => ({
              eq: () => ({
                not: () => ({
                  // Artículo demasiado corto — menos de 300 chars
                  limit: () => Promise.resolve({
                    data: [{ ...ARTICULO_VALIDO, texto_integro: 'Texto corto.' }],
                    error: null,
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

    await expect(generateRetoDiarioOnDemand('2026-03-01')).rejects.toThrow('Artículos demasiado cortos')
  })
})
