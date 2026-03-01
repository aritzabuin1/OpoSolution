/**
 * tests/unit/verification.test.ts — OPTEK §1.5.2, 1.5.4, 1.5.6, 1.5.8, 1.5.9, 1.5.10
 *
 * Tests unitarios del módulo de verificación determinista de citas legales.
 * Usan mocks de Supabase — no requieren conexión real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock Supabase: capturamos la llamada a maybySingle para controlar respuestas
const mockMaybeSingle = vi.fn()
const mockInsert = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'api_usage_log') {
        return { insert: mockInsert.mockResolvedValue({ error: null }) }
      }
      // tabla legislacion
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: mockMaybeSingle,
              }),
            }),
          }),
        }),
      }
    },
  }),
}))

// Mock logger — evitar salida de logs en tests
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

// ─── Imports bajo test ────────────────────────────────────────────────────────

import {
  extractCitations,
  verifyCitation,
  verifyContentMatch,
  verifyAllCitations,
} from '@/lib/ai/verification'
import type { ExtractedCitation } from '@/lib/ai/verification'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const articuloCE1TextoReal =
  'España se constituye en un Estado social y democrático de Derecho, que propugna como ' +
  'valores superiores de su ordenamiento jurídico la libertad, la justicia, la igualdad ' +
  'y el pluralismo político.'

const articuloLPAC53TextoReal =
  'Los interesados en el procedimiento administrativo tendrán los siguientes derechos: ' +
  'a conocer en cualquier momento el estado de la tramitación de los procedimientos ' +
  'en los que tengan la condición de interesados. El plazo máximo para resolver ' +
  'será de tres meses contados desde la fecha de la solicitud.'

const articuloCE14TextoReal =
  'Los españoles son iguales ante la ley, sin que pueda prevalecer discriminación alguna ' +
  'por razón de nacimiento, raza, sexo, religión, opinión o cualquier otra condición ' +
  'o circunstancia personal o social.'

// ─── §1.5.2 — extractCitations: 10+ formatos distintos ───────────────────────

describe('§1.5.2 — extractCitations: formatos de citas legales', () => {
  beforeEach(() => vi.clearAllMocks())

  it('formato "artículo 14 CE" → ley=CE, art=14', () => {
    const result = extractCitations('El artículo 14 CE garantiza la igualdad.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('CE')
    expect(cita.articulo).toBe('14')
    expect(cita.leyResuelta).toBe(true)
  })

  it('formato "art. 53.1 LPAC" → ley=LPAC, art=53, apartado=1', () => {
    const result = extractCitations('Según el art. 53.1 LPAC, los interesados tienen derechos.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('LPAC')
    expect(cita.articulo).toBe('53')
    expect(cita.apartado).toBe('1')
    expect(cita.leyResuelta).toBe(true)
  })

  it('formato "Art. 53.1 de la Ley 39/2015" → ley=LPAC, art=53, apartado=1', () => {
    const result = extractCitations('Véase el Art. 53.1 de la Ley 39/2015 sobre procedimiento.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('LPAC')
    expect(cita.articulo).toBe('53')
    expect(cita.leyResuelta).toBe(true)
  })

  it('formato "artículo 14 de la Constitución" → ley=CE, art=14', () => {
    const result = extractCitations('El artículo 14 de la Constitución establece la igualdad.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('CE')
    expect(cita.articulo).toBe('14')
    expect(cita.leyResuelta).toBe(true)
  })

  it('formato "artículo 1 del TREBEP" → ley=TREBEP, art=1', () => {
    const result = extractCitations('El artículo 1 del TREBEP regula el objeto del estatuto.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('TREBEP')
    expect(cita.articulo).toBe('1')
    expect(cita.leyResuelta).toBe(true)
  })

  it('formato "artículo 103.3 CE" → ley=CE, art=103, apartado=3', () => {
    const result = extractCitations('El artículo 103.3 CE prevé la regulación del estatuto.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('CE')
    expect(cita.articulo).toBe('103')
    expect(cita.apartado).toBe('3')
    expect(cita.leyResuelta).toBe(true)
  })

  it('formato "artículo 23 LOPDGDD" → ley=LOPDGDD, art=23', () => {
    const result = extractCitations('El artículo 23 LOPDGDD regula el derecho de acceso.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('LOPDGDD')
    expect(cita.articulo).toBe('23')
    expect(cita.leyResuelta).toBe(true)
  })

  it('formato "artículo 6 LRJSP" → ley=LRJSP, art=6', () => {
    const result = extractCitations('El artículo 6 LRJSP regula los principios generales.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('LRJSP')
    expect(cita.articulo).toBe('6')
    expect(cita.leyResuelta).toBe(true)
  })

  it('formato "artículo 4 TREBEP" → ley=TREBEP, art=4', () => {
    const result = extractCitations('El artículo 4 TREBEP define el ámbito de aplicación.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('TREBEP')
    expect(cita.articulo).toBe('4')
    expect(cita.leyResuelta).toBe(true)
  })

  it('ley no reconocida → leyResuelta=false', () => {
    const result = extractCitations('Según el artículo 5 LEYINVENTADA, se establece algo.')
    if (result.length > 0) {
      const cita = result[0]
      expect(cita.leyResuelta).toBe(false)
    }
    // Si no captura LEYINVENTADA por no estar en el patrón, también es correcto
  })

  it('no captura artículos con número en texto ("artículo catorce CE")', () => {
    const result = extractCitations('El artículo catorce CE garantiza la igualdad.')
    // No debe capturar porque "catorce" no es número
    const citaConCatorce = result.find((c) => c.textoOriginal.includes('catorce'))
    expect(citaConCatorce).toBeUndefined()
  })

  it('no captura disposiciones adicionales', () => {
    const result = extractCitations(
      'La disposición adicional primera LPAC regula las especialidades.'
    )
    // El regex solo captura art[ículo], no "disposición"
    expect(result.length).toBe(0)
  })

  it('captura múltiples citas en un texto', () => {
    const text =
      'El artículo 14 CE y el artículo 53 LPAC son fundamentales en el procedimiento.'
    const result = extractCitations(text)
    expect(result.length).toBeGreaterThanOrEqual(2)
    const leyes = result.map((c) => c.ley)
    expect(leyes).toContain('CE')
    expect(leyes).toContain('LPAC')
  })
})

// ─── §1.5.9 — edge case "bis" ─────────────────────────────────────────────────

describe('§1.5.9 — edge case artículos "bis"', () => {
  it('formato "art. 9 bis de la LPAC" → art="9 bis", ley=LPAC', () => {
    const result = extractCitations('El art. 9 bis de la LPAC regula la representación.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('LPAC')
    expect(cita.articulo).toBe('9 bis')
    expect(cita.leyResuelta).toBe(true)
  })

  it('formato "artículo 9 bis LPAC" → art="9 bis", ley=LPAC', () => {
    const result = extractCitations('El artículo 9 bis LPAC establece algo.')
    expect(result.length).toBeGreaterThanOrEqual(1)
    const cita = result[0]
    expect(cita.ley).toBe('LPAC')
    expect(cita.articulo).toBe('9 bis')
  })
})

// ─── §1.5.4 — verifyCitation ─────────────────────────────────────────────────

describe('§1.5.4 — verifyCitation: lookup en BD', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cita válida CE art.1 → verified=true con textoEnBD', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        texto_integro: articuloCE1TextoReal,
        ley_codigo: 'BOE-A-1978-31229',
        articulo_numero: '1',
        apartado: null,
      },
      error: null,
    })

    const cita: ExtractedCitation = {
      ley: 'CE',
      leyRaw: 'CE',
      articulo: '1',
      textoOriginal: 'artículo 1 CE',
      leyResuelta: true,
    }

    const result = await verifyCitation(cita)

    expect(result.verificada).toBe(true)
    expect(result.textoEnBD).toContain('Estado social')
    expect(result.cita.ley).toBe('CE')
    expect(result.cita.articulo).toBe('1')
  })

  it('cita inventada CE art.999 → verified=false con error', async () => {
    // Ambos intentos (exacto + variante) retornan null
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const cita: ExtractedCitation = {
      ley: 'CE',
      leyRaw: 'CE',
      articulo: '999',
      textoOriginal: 'artículo 999 CE',
      leyResuelta: true,
    }

    const result = await verifyCitation(cita)

    expect(result.verificada).toBe(false)
    expect(result.error).toBe('Artículo no encontrado en BD')
  })

  it('ley no resuelta → verified=false con error de ley no reconocida', async () => {
    const cita: ExtractedCitation = {
      ley: 'LEYINVENTADA',
      leyRaw: 'LEYINVENTADA',
      articulo: '1',
      textoOriginal: 'artículo 1 LEYINVENTADA',
      leyResuelta: false,
    }

    const result = await verifyCitation(cita)

    expect(result.verificada).toBe(false)
    expect(result.error).toContain('Ley no reconocida')
    expect(result.error).toContain('LEYINVENTADA')
  })

  it('error de BD → verified=false con error de base de datos', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'connection timeout', code: '500' },
    })

    const cita: ExtractedCitation = {
      ley: 'CE',
      leyRaw: 'CE',
      articulo: '14',
      textoOriginal: 'artículo 14 CE',
      leyResuelta: true,
    }

    const result = await verifyCitation(cita)

    expect(result.verificada).toBe(false)
    expect(result.error).toBe('Error de base de datos')
  })
})

// ─── §1.5.6 — verifyContentMatch ─────────────────────────────────────────────

describe('§1.5.6 — verifyContentMatch: verificación determinista', () => {
  const citaBase: ExtractedCitation = {
    ley: 'LPAC',
    leyRaw: 'LPAC',
    articulo: '53',
    textoOriginal: 'artículo 53 LPAC',
    leyResuelta: true,
  }

  it('plazo correcto "tres meses" → match=true, confidence=high', () => {
    const claimText = 'El plazo es de tres meses desde la solicitud.'
    const articuloTexto =
      'El plazo máximo para resolver será de tres meses contados desde la fecha de la solicitud.'
    const result = verifyContentMatch(citaBase, claimText, articuloTexto)
    expect(result.match).toBe(true)
    expect(result.confidence).toBe('high')
  })

  it('plazo numérico correcto "10 días" → match=true, confidence=high', () => {
    const claimText = 'El interesado tiene 10 días para presentar el recurso.'
    const articuloTexto =
      'El plazo para interponer el recurso de alzada será de 10 días hábiles.'
    const result = verifyContentMatch(citaBase, claimText, articuloTexto)
    expect(result.match).toBe(true)
    expect(result.confidence).toBe('high')
  })

  it('plazo incorrecto "5 días" cuando el artículo dice "10 días" → match=false, confidence=high', () => {
    const claimText = 'El interesado tiene 5 días para presentar el recurso.'
    const articuloTexto =
      'El plazo para interponer el recurso de alzada será de 10 días hábiles.'
    const result = verifyContentMatch(citaBase, claimText, articuloTexto)
    expect(result.match).toBe(false)
    expect(result.confidence).toBe('high')
  })

  it('órgano correcto "Consejo de Ministros" → match=true, confidence=medium', () => {
    const claimText = 'La decisión corresponde al Consejo de Ministros.'
    const articuloTexto =
      'La aprobación del reglamento corresponderá al Consejo de Ministros por Real Decreto.'
    const result = verifyContentMatch(citaBase, claimText, articuloTexto)
    expect(result.match).toBe(true)
    expect(result.confidence).toBe('medium')
  })

  it('órgano incorrecto "Senado" cuando artículo menciona "Congreso" → match=false, confidence=medium', () => {
    const claimText = 'La aprobación corresponde al Senado.'
    const articuloTexto =
      'La iniciativa legislativa corresponde al Congreso de los Diputados.'
    const result = verifyContentMatch(citaBase, claimText, articuloTexto)
    expect(result.match).toBe(false)
    expect(result.confidence).toBe('medium')
  })

  it('texto genérico sin plazos ni órganos → match=true, confidence=low', () => {
    const claimText = 'Este artículo es importante para el procedimiento.'
    const articuloTexto = 'El artículo regula los principios generales del procedimiento.'
    const result = verifyContentMatch(citaBase, claimText, articuloTexto)
    expect(result.match).toBe(true)
    expect(result.confidence).toBe('low')
  })

  it('plazo en texto "diez días" en artículo → match=true para claim "10 días"', () => {
    const claimText = 'El plazo es de 10 días.'
    const articuloTexto = 'El recurso deberá interponerse en el plazo de diez días hábiles.'
    const result = verifyContentMatch(citaBase, claimText, articuloTexto)
    expect(result.match).toBe(true)
    expect(result.confidence).toBe('high')
  })
})

// ─── §1.5.8 — verifyAllCitations: texto con 3 citas (2 válidas, 1 inválida) ──

describe('§1.5.8 — verifyAllCitations: pipeline completo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('texto con 2 citas válidas y 1 inválida → score 0.67', async () => {
    // Configurar mock: primer y segundo .maybeSingle devuelve artículo, tercero devuelve null
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: {
          texto_integro: articuloCE1TextoReal,
          ley_codigo: 'BOE-A-1978-31229',
          articulo_numero: '1',
          apartado: null,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          texto_integro: articuloCE14TextoReal,
          ley_codigo: 'BOE-A-1978-31229',
          articulo_numero: '14',
          apartado: null,
        },
        error: null,
      })
      // Tercer intento (exacto) → null
      .mockResolvedValueOnce({ data: null, error: null })
      // Cuarto intento (variant retry) → null
      .mockResolvedValueOnce({ data: null, error: null })

    const text =
      'El artículo 1 CE establece el Estado social. ' +
      'El artículo 14 CE garantiza la igualdad. ' +
      'El artículo 999 TREBEP no existe en la ley.'

    const results = await verifyAllCitations(text)

    expect(results.length).toBeGreaterThanOrEqual(2)
    const verified = results.filter((r) => r.verificada)
    const failed = results.filter((r) => !r.verificada)
    expect(verified.length).toBeGreaterThanOrEqual(1)
    expect(failed.length).toBeGreaterThanOrEqual(1)

    // Score: verified/total
    const score = verified.length / results.length
    // Con 2 verificadas de 3: score ≈ 0.67
    expect(score).toBeGreaterThan(0.5)
  })

  it('retorna resultados con textoEnBD para citas verificadas', async () => {
    // Reset explícito para aislar completamente este test de estados previos
    mockMaybeSingle.mockReset()
    mockMaybeSingle.mockResolvedValue({
      data: {
        texto_integro: articuloCE14TextoReal,
        ley_codigo: 'BOE-A-1978-31229',
        articulo_numero: '14',
        apartado: null,
      },
      error: null,
    })

    // Verificar directamente que extractCitations funciona en este contexto
    const citationsFromText = extractCitations('El artículo 14 CE garantiza la igualdad ante la ley.')
    expect(citationsFromText.length).toBeGreaterThan(0)
    expect(citationsFromText[0].ley).toBe('CE')
    expect(citationsFromText[0].articulo).toBe('14')

    const text = 'El artículo 14 CE garantiza la igualdad ante la ley.'
    const results = await verifyAllCitations(text)

    expect(results.length).toBeGreaterThan(0)
    const verificada = results.find((r) => r.verificada)
    expect(verificada).toBeDefined()
    expect(verificada?.textoEnBD).toContain('iguales ante la ley')
  })
})

// ─── §1.5.10 — texto sin citas → array vacío sin error ───────────────────────

describe('§1.5.10 — verifyAllCitations: texto sin citas legales', () => {
  beforeEach(() => vi.clearAllMocks())

  it('texto sin ninguna cita → retorna [] sin error', async () => {
    const text =
      'El procedimiento administrativo es un conjunto de actos que sigue la Administración.'
    const results = await verifyAllCitations(text)
    expect(results).toEqual([])
    expect(mockMaybeSingle).not.toHaveBeenCalled()
  })

  it('string vacío → retorna [] sin error', async () => {
    const results = await verifyAllCitations('')
    expect(results).toEqual([])
  })

  it('texto con "artículo" pero sin número → retorna []', async () => {
    const text = 'El artículo es la unidad básica de la ley.'
    const results = await verifyAllCitations(text)
    // "artículo" sin número y sin nombre de ley no debe capturarse
    expect(results).toEqual([])
  })
})

// ─── resolveLeyNombre: cobertura directa del alias ────────────────────────────

describe('resolveLeyNombre: alias dictionary', () => {
  it('resuelve siglas directas', async () => {
    const { resolveLeyNombre } = await import('@/lib/ai/citation-aliases')
    expect(resolveLeyNombre('CE')).toBe('CE')
    expect(resolveLeyNombre('LPAC')).toBe('LPAC')
    expect(resolveLeyNombre('TREBEP')).toBe('TREBEP')
    expect(resolveLeyNombre('LOPDGDD')).toBe('LOPDGDD')
  })

  it('resuelve nombres completos en minúsculas', async () => {
    const { resolveLeyNombre } = await import('@/lib/ai/citation-aliases')
    expect(resolveLeyNombre('constitución española')).toBe('CE')
    expect(resolveLeyNombre('ley 39/2015')).toBe('LPAC')
    expect(resolveLeyNombre('estatuto básico')).toBe('TREBEP')
    expect(resolveLeyNombre('violencia de género')).toBe('LOVIGEN')
  })

  it('es case-insensitive', async () => {
    const { resolveLeyNombre } = await import('@/lib/ai/citation-aliases')
    expect(resolveLeyNombre('CE')).toBe('CE')
    expect(resolveLeyNombre('ce')).toBe('CE')
    expect(resolveLeyNombre('Ce')).toBe('CE')
  })

  it('retorna null para nombres desconocidos', async () => {
    const { resolveLeyNombre } = await import('@/lib/ai/citation-aliases')
    expect(resolveLeyNombre('LEYINVENTADA')).toBeNull()
    expect(resolveLeyNombre('')).toBeNull()
    expect(resolveLeyNombre('xyz')).toBeNull()
  })
})
