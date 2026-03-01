/**
 * tests/unit/generate-cazatrampas.test.ts — §2.12.15, §2.12.16
 *
 * Tests unitarios para generateCazaTrampas().
 * Supabase, callGPTJSON y logger se mockean completamente.
 *
 * Cobertura:
 *   §2.12.15  Si valor_original NO es substring del artículo → reintenta y al agotar → lanza error
 *   §2.12.16  Si texto_trampa NO contiene valor_trampa → reintenta y al agotar → lanza error
 *   Extra     Primer intento falla verificación, segundo tiene éxito → devuelve sesión
 *   Extra     Happy path — GPT válido desde primer intento → devuelve CazaTrampasSession
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// vi.hoisted() garantiza disponibilidad antes del hoisting de vi.mock()
const { mockCallGPTJSON, mockLimitQuery, mockInsertSingle } = vi.hoisted(() => ({
  mockCallGPTJSON: vi.fn(),
  mockLimitQuery: vi.fn(),
  mockInsertSingle: vi.fn(),
}))

vi.mock('@/lib/ai/openai', () => ({
  callGPTJSON: mockCallGPTJSON,
}))

// Mock Supabase: la query de legislacion termina con .limit(), la de insert termina con .single()
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() =>
    Promise.resolve({
      from: (table: string) => {
        if (table === 'legislacion') {
          // Soporta cadena con y sin .contains() antes de .limit()
          const chainEnd = { limit: mockLimitQuery }
          return {
            select: () => ({
              eq: () => ({
                gte: () => ({
                  filter: () => ({
                    limit: mockLimitQuery,
                    contains: () => chainEnd,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'cazatrampas_sesiones') {
          return {
            insert: () => ({
              select: () => ({
                single: mockInsertSingle,
              }),
            }),
          }
        }
        throw new Error(`Unexpected table: ${table}`)
      },
    })
  ),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  },
}))

// ─── Import bajo test ─────────────────────────────────────────────────────────

import { generateCazaTrampas } from '@/lib/ai/generate-cazatrampas'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const USER_ID = 'user-test-xyz'
const SESION_UUID = '99999999-9999-9999-9999-999999999999'

/** Artículo con texto suficientemente largo (≥200 chars) */
const articuloBase = {
  id: 'aaa-001',
  ley_nombre: 'Ley 39/2015 LPAC',
  articulo_numero: '14',
  titulo_capitulo: 'Título II',
  texto_integro:
    'Artículo 14. Derecho y obligación de relacionarse electrónicamente con las Administraciones Públicas. ' +
    'Con carácter general, los ciudadanos podrán elegir en todo momento si se comunican para el ejercicio de ' +
    'sus derechos y obligaciones a través de medios electrónicos con las Administraciones Públicas o no, salvo ' +
    'que estén obligados a relacionarse a través de medios electrónicos con las Administraciones Públicas. ' +
    'El plazo para resolver será de tres meses a contar desde la fecha de presentación de la solicitud.',
}

/** GPT devuelve datos válidos: valor_original en texto, valor_trampa en texto_trampa */
function gptValido(overrides?: { valor_original?: string; valor_trampa?: string; texto_trampa?: string }) {
  const valor_original = overrides?.valor_original ?? 'tres meses'
  const valor_trampa = overrides?.valor_trampa ?? 'seis meses'
  const texto_trampa =
    overrides?.texto_trampa ??
    articuloBase.texto_integro.replace(valor_original, valor_trampa)

  return {
    texto_trampa,
    errores_reales: [
      {
        tipo: 'plazo',
        valor_original,
        valor_trampa,
        explicacion: 'El plazo correcto es tres meses.',
      },
    ],
  }
}

function setupArticulo() {
  mockLimitQuery.mockResolvedValue({ data: [articuloBase], error: null })
}

function setupInsert() {
  mockInsertSingle.mockResolvedValue({ data: { id: SESION_UUID }, error: null })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateCazaTrampas — §2.12.15 verificación valor_original', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('lanza error si valor_original nunca es substring del texto (todos los reintentos fallan)', async () => {
    setupArticulo()

    // GPT siempre devuelve un valor_original que NO existe en el texto
    const rawInvalido = {
      texto_trampa: 'texto con seis meses',
      errores_reales: [
        {
          tipo: 'plazo',
          valor_original: 'VALOR_QUE_NO_EXISTE_EN_EL_TEXTO',
          valor_trampa: 'seis meses',
          explicacion: 'X',
        },
      ],
    }
    mockCallGPTJSON.mockResolvedValue(rawInvalido) // siempre devuelve el mismo inválido

    await expect(
      generateCazaTrampas(USER_ID, undefined, 1)
    ).rejects.toThrow('No se pudo generar Caza-Trampas con errores verificados tras los reintentos')

    // Se deben haber hecho MAX_RETRIES+1 = 3 intentos
    expect(mockCallGPTJSON).toHaveBeenCalledTimes(3)
  })

  it('éxito si el segundo intento devuelve valor_original válido (primer intento falla)', async () => {
    setupArticulo()
    setupInsert()

    const rawInvalido = {
      texto_trampa: 'texto con seis meses',
      errores_reales: [
        {
          tipo: 'plazo',
          valor_original: 'NO_EXISTE',
          valor_trampa: 'seis meses',
          explicacion: 'X',
        },
      ],
    }
    const rawValido = gptValido()

    mockCallGPTJSON
      .mockResolvedValueOnce(rawInvalido) // intento 0 → falla
      .mockResolvedValueOnce(rawValido)   // intento 1 → OK

    const sesion = await generateCazaTrampas(USER_ID, undefined, 1)

    expect(sesion.id).toBe(SESION_UUID)
    expect(sesion.numErrores).toBe(1)
    expect(mockCallGPTJSON).toHaveBeenCalledTimes(2)
  })
})

describe('generateCazaTrampas — §2.12.16 verificación texto_trampa contiene valor_trampa', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('lanza error si texto_trampa no contiene valor_trampa (todos los reintentos fallan)', async () => {
    setupArticulo()

    // texto_trampa NO contiene valor_trampa
    const rawInvalido = {
      texto_trampa: 'texto que no contiene la trampa esperada',
      errores_reales: [
        {
          tipo: 'porcentaje',
          valor_original: 'tres meses',      // sí existe en texto_integro
          valor_trampa: 'TRAMPA_NO_EN_TEXTO', // pero NO en texto_trampa
          explicacion: 'X',
        },
      ],
    }
    mockCallGPTJSON.mockResolvedValue(rawInvalido)

    await expect(
      generateCazaTrampas(USER_ID, undefined, 1)
    ).rejects.toThrow('No se pudo generar Caza-Trampas con errores verificados tras los reintentos')

    expect(mockCallGPTJSON).toHaveBeenCalledTimes(3)
  })

  it('éxito si el tercer intento (último) cumple ambas verificaciones', async () => {
    setupArticulo()
    setupInsert()

    const rawTrampaSinValorTrampa = {
      texto_trampa: 'texto que no contiene la trampa esperada',
      errores_reales: [
        { tipo: 'plazo', valor_original: 'tres meses', valor_trampa: 'TRAMPA_AUSENTE', explicacion: 'X' },
      ],
    }
    const rawValido = gptValido()

    mockCallGPTJSON
      .mockResolvedValueOnce(rawTrampaSinValorTrampa) // intento 0 → falla
      .mockResolvedValueOnce(rawTrampaSinValorTrampa) // intento 1 → falla
      .mockResolvedValueOnce(rawValido)               // intento 2 → OK

    const sesion = await generateCazaTrampas(USER_ID, undefined, 1)

    expect(sesion.texto_trampa).toContain('seis meses')
    expect(sesion.leyNombre).toBe('Ley 39/2015 LPAC')
    expect(sesion.articuloNumero).toBe('14')
    expect(mockCallGPTJSON).toHaveBeenCalledTimes(3)
  })
})

describe('generateCazaTrampas — happy path', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('devuelve CazaTrampasSession correcta con datos del artículo y sesión', async () => {
    setupArticulo()
    setupInsert()
    mockCallGPTJSON.mockResolvedValue(gptValido())

    const sesion = await generateCazaTrampas(USER_ID, undefined, 1)

    expect(sesion).toMatchObject({
      id: SESION_UUID,
      numErrores: 1,
      leyNombre: 'Ley 39/2015 LPAC',
      articuloNumero: '14',
      tituloCap: 'Título II',
    })
    expect(sesion.texto_trampa).toContain('seis meses')
    expect(sesion.texto_trampa).not.toContain('tres meses') // el error fue inyectado
  })

  it('lanza error si no hay artículos disponibles en BD', async () => {
    mockLimitQuery.mockResolvedValue({ data: [], error: null })

    await expect(
      generateCazaTrampas(USER_ID)
    ).rejects.toThrow('No hay artículos disponibles para Caza-Trampas')
  })

  it('lanza error si todos los artículos tienen texto < 200 chars', async () => {
    mockLimitQuery.mockResolvedValue({
      data: [{ ...articuloBase, texto_integro: 'Texto corto.' }],
      error: null,
    })

    await expect(
      generateCazaTrampas(USER_ID)
    ).rejects.toThrow('Artículos demasiado cortos para Caza-Trampas')
  })

  it('GPT devuelve null en todos los intentos → lanza error', async () => {
    setupArticulo()
    mockCallGPTJSON.mockResolvedValue(null)

    await expect(
      generateCazaTrampas(USER_ID, undefined, 2)
    ).rejects.toThrow('No se pudo generar Caza-Trampas')

    expect(mockCallGPTJSON).toHaveBeenCalledTimes(3)
  })
})
