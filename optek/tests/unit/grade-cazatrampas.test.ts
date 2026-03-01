/**
 * tests/unit/grade-cazatrampas.test.ts — §2.12.14
 *
 * Tests unitarios para gradeCazaTrampas().
 * Supabase y logger se mockean completamente — no requieren conexión real.
 *
 * Cobertura:
 *   - Detección perfecta (100%)
 *   - Cero detecciones (0%)
 *   - Detección parcial → puntuación proporcional
 *   - Matching case-insensitive
 *   - Sesión no encontrada → lanza error
 *   - No autorizado (userId diferente) → lanza error
 *   - Sesión ya completada → lanza error
 *   - Error al guardar → lanza error
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks — deben declararse ANTES de los imports bajo test ──────────────────

const mockSingle = vi.fn()
const mockUpdateEq = vi.fn()
const mockUpdate = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() =>
    Promise.resolve({
      from: (table: string) => {
        if (table === 'cazatrampas_sesiones') {
          return {
            select: () => ({
              eq: () => ({
                single: mockSingle,
              }),
            }),
            update: mockUpdate,
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
    child: vi.fn().mockReturnValue({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

// ─── Import bajo test ─────────────────────────────────────────────────────────

import { gradeCazaTrampas } from '@/lib/ai/grade-cazatrampas'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SESION_ID = '11111111-1111-1111-1111-111111111111'
const USER_ID = 'user-abc-123'

const erroresBase = [
  {
    tipo: 'plazo',
    valor_original: 'treinta días',
    valor_trampa: 'cuarenta días',
    explicacion: 'El plazo legal es 30 días, no 40.',
  },
  {
    tipo: 'porcentaje',
    valor_original: 'el 50%',
    valor_trampa: 'el 60%',
    explicacion: 'El porcentaje correcto es 50%.',
  },
]

function mockSesion(overrides?: Partial<{
  user_id: string
  errores_reales: typeof erroresBase
  completada_at: string | null
}>) {
  const sesion = {
    id: SESION_ID,
    user_id: USER_ID,
    errores_reales: erroresBase,
    completada_at: null,
    ...overrides,
  }
  mockSingle.mockResolvedValueOnce({ data: sesion, error: null })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('gradeCazaTrampas — detección determinista', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Restaurar implementación de mockUpdate después del reset
    mockUpdate.mockImplementation(() => ({ eq: mockUpdateEq }))
    // Por defecto, el update en BD tiene éxito
    mockUpdateEq.mockResolvedValue({ error: null })
  })

  it('detecta todos los errores correctamente → puntuación 100', async () => {
    mockSesion()

    const resultado = await gradeCazaTrampas(SESION_ID, USER_ID, [
      { valor_trampa_detectado: 'cuarenta días', valor_original_propuesto: 'treinta días' },
      { valor_trampa_detectado: 'el 60%', valor_original_propuesto: 'el 50%' },
    ])

    expect(resultado.puntuacion).toBe(100)
    expect(resultado.aciertos).toBe(2)
    expect(resultado.total).toBe(2)
    expect(resultado.detalles[0].detectado).toBe(true)
    expect(resultado.detalles[1].detectado).toBe(true)
  })

  it('no detecta ningún error → puntuación 0', async () => {
    mockSesion()

    const resultado = await gradeCazaTrampas(SESION_ID, USER_ID, [
      { valor_trampa_detectado: 'texto_inexistente', valor_original_propuesto: 'algo' },
    ])

    expect(resultado.puntuacion).toBe(0)
    expect(resultado.aciertos).toBe(0)
    expect(resultado.total).toBe(2)
    expect(resultado.detalles[0].detectado).toBe(false)
    expect(resultado.detalles[1].detectado).toBe(false)
  })

  it('detección parcial (1 de 2) → puntuación 50', async () => {
    mockSesion()

    const resultado = await gradeCazaTrampas(SESION_ID, USER_ID, [
      { valor_trampa_detectado: 'cuarenta días', valor_original_propuesto: 'treinta días' },
    ])

    expect(resultado.puntuacion).toBe(50)
    expect(resultado.aciertos).toBe(1)
    expect(resultado.total).toBe(2)
    expect(resultado.detalles[0].detectado).toBe(true)
    expect(resultado.detalles[1].detectado).toBe(false)
  })

  it('matching es case-insensitive y trim', async () => {
    mockSesion()

    // "CUARENTA DÍAS " con mayúsculas y espacio extra debe matchear "cuarenta días"
    const resultado = await gradeCazaTrampas(SESION_ID, USER_ID, [
      { valor_trampa_detectado: '  CUARENTA DÍAS  ', valor_original_propuesto: 'treinta días' },
      { valor_trampa_detectado: 'EL 60%', valor_original_propuesto: 'el 50%' },
    ])

    expect(resultado.aciertos).toBe(2)
    expect(resultado.puntuacion).toBe(100)
  })

  it('correccion_correcta es true cuando propone el valor_original correcto', async () => {
    mockSesion()

    const resultado = await gradeCazaTrampas(SESION_ID, USER_ID, [
      { valor_trampa_detectado: 'cuarenta días', valor_original_propuesto: 'treinta días' },
      { valor_trampa_detectado: 'el 60%', valor_original_propuesto: 'propuesta incorrecta' },
    ])

    expect(resultado.detalles[0].correccion_correcta).toBe(true)
    expect(resultado.detalles[1].correccion_correcta).toBe(false)
  })
})

describe('gradeCazaTrampas — validaciones de sesión', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Restaurar implementación de mockUpdate después del reset
    mockUpdate.mockImplementation(() => ({ eq: mockUpdateEq }))
    // Por defecto, el update en BD tiene éxito
    mockUpdateEq.mockResolvedValue({ error: null })
  })

  it('lanza error si la sesión no existe', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

    await expect(
      gradeCazaTrampas(SESION_ID, USER_ID, [
        { valor_trampa_detectado: 'x', valor_original_propuesto: 'y' },
      ])
    ).rejects.toThrow('Sesión no encontrada')
  })

  it('lanza error si el userId no coincide (no autorizado)', async () => {
    mockSesion({ user_id: 'otro-usuario' })

    await expect(
      gradeCazaTrampas(SESION_ID, USER_ID, [
        { valor_trampa_detectado: 'x', valor_original_propuesto: 'y' },
      ])
    ).rejects.toThrow('No autorizado')
  })

  it('lanza error si la sesión ya fue completada', async () => {
    mockSesion({ completada_at: '2026-02-28T10:00:00Z' })

    await expect(
      gradeCazaTrampas(SESION_ID, USER_ID, [
        { valor_trampa_detectado: 'x', valor_original_propuesto: 'y' },
      ])
    ).rejects.toThrow('Esta sesión ya ha sido completada')
  })

  it('lanza error si falla el update en BD', async () => {
    mockSesion()
    // Sobreescribir el default: update falla
    mockUpdateEq.mockResolvedValue({ error: { message: 'DB error' } })

    await expect(
      gradeCazaTrampas(SESION_ID, USER_ID, [
        { valor_trampa_detectado: 'cuarenta días', valor_original_propuesto: 'treinta días' },
      ])
    ).rejects.toThrow('Error al guardar el resultado')
  })
})

describe('gradeCazaTrampas — estructura del resultado', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Restaurar implementación de mockUpdate después del reset
    mockUpdate.mockImplementation(() => ({ eq: mockUpdateEq }))
    // Por defecto, el update en BD tiene éxito
    mockUpdateEq.mockResolvedValue({ error: null })
  })

  it('detalles incluye los erroresReales con la info de detección del usuario', async () => {
    mockSesion()

    const deteccion = { valor_trampa_detectado: 'cuarenta días', valor_original_propuesto: 'treinta días' }
    const resultado = await gradeCazaTrampas(SESION_ID, USER_ID, [deteccion])

    const detalle = resultado.detalles[0]
    expect(detalle.error.tipo).toBe('plazo')
    expect(detalle.error.valor_trampa).toBe('cuarenta días')
    expect(detalle.error.valor_original).toBe('treinta días')
    expect(detalle.deteccion_usuario).toEqual(deteccion)
  })

  it('llama a update en BD con los campos correctos', async () => {
    mockSesion()

    await gradeCazaTrampas(SESION_ID, USER_ID, [
      { valor_trampa_detectado: 'cuarenta días', valor_original_propuesto: 'treinta días' },
    ])

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        puntuacion: 50,
        completada_at: expect.any(String),
      })
    )
    expect(mockUpdateEq).toHaveBeenCalledWith('id', SESION_ID)
  })
})
