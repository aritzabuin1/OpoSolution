/**
 * tests/unit/schemas.test.ts
 *
 * Tests unitarios para los schemas Zod de validación de respuestas AI.
 *
 * Cobertura:
 *   - PreguntaSchema: correcta como string/number, opciones tuple, min lengths
 *   - TestGeneradoRawSchema: array limits
 *   - CorreccionDesarrolloRawSchema: coercion, ranges
 *   - CazaTrampasRawSchema: tipos de error, min/max
 *   - CitaLegalSchema: campos requeridos vs opcionales
 */

import { describe, it, expect } from 'vitest'
import {
  PreguntaSchema,
  TestGeneradoRawSchema,
  CorreccionDesarrolloRawSchema,
  CazaTrampasRawSchema,
  CitaLegalSchema,
} from '@/lib/ai/schemas'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const validPregunta = {
  enunciado: 'El plazo para interponer recurso de alzada es de',
  opciones: ['1 mes', '2 meses', '3 meses', '15 días'],
  correcta: 0,
  explicacion: 'Según el artículo 122 de la LPAC, el plazo es de 1 mes.',
  cita: { ley: 'LPAC', articulo: '122', textoExacto: 'Un mes si el acto es expreso' },
}

// ─── PreguntaSchema ──────────────────────────────────────────────────────────

describe('PreguntaSchema', () => {
  it('valida pregunta completa con cita', () => {
    const r = PreguntaSchema.safeParse(validPregunta)
    expect(r.success).toBe(true)
  })

  it('valida pregunta sin cita (psicotécnicos/Bloque II)', () => {
    const { cita, ...sinCita } = validPregunta
    const r = PreguntaSchema.safeParse(sinCita)
    expect(r.success).toBe(true)
  })

  it('coerce correcta de string "2" a number 2', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, correcta: '2' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.correcta).toBe(2)
  })

  it('coerce correcta de string "0" a number 0', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, correcta: '0' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.correcta).toBe(0)
  })

  it('rechaza correcta fuera de rango (4)', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, correcta: 4 })
    expect(r.success).toBe(false)
  })

  it('rechaza correcta negativa (-1)', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, correcta: -1 })
    expect(r.success).toBe(false)
  })

  it('rechaza enunciado demasiado corto', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, enunciado: 'Hola' })
    expect(r.success).toBe(false)
  })

  it('rechaza explicación demasiado corta', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, explicacion: 'Corto' })
    expect(r.success).toBe(false)
  })

  it('rechaza opciones con menos de 4 elementos', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, opciones: ['a', 'b', 'c'] })
    expect(r.success).toBe(false)
  })

  it('rechaza opciones con más de 4 elementos', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, opciones: ['a', 'b', 'c', 'd', 'e'] })
    expect(r.success).toBe(false)
  })

  it('acepta dificultad válida', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, dificultad: 'media' })
    expect(r.success).toBe(true)
  })

  it('rechaza dificultad inválida', () => {
    const r = PreguntaSchema.safeParse({ ...validPregunta, dificultad: 'extrema' })
    expect(r.success).toBe(false)
  })

  it('acepta sin dificultad (opcional)', () => {
    const r = PreguntaSchema.safeParse(validPregunta)
    expect(r.success).toBe(true)
  })
})

// ─── TestGeneradoRawSchema ───────────────────────────────────────────────────

describe('TestGeneradoRawSchema', () => {
  it('valida array de 1 pregunta (mínimo)', () => {
    const r = TestGeneradoRawSchema.safeParse({ preguntas: [validPregunta] })
    expect(r.success).toBe(true)
  })

  it('valida array de 10 preguntas', () => {
    const r = TestGeneradoRawSchema.safeParse({
      preguntas: Array.from({ length: 10 }, () => validPregunta),
    })
    expect(r.success).toBe(true)
  })

  it('rechaza array vacío', () => {
    const r = TestGeneradoRawSchema.safeParse({ preguntas: [] })
    expect(r.success).toBe(false)
  })

  it('rechaza más de 30 preguntas', () => {
    const r = TestGeneradoRawSchema.safeParse({
      preguntas: Array.from({ length: 31 }, () => validPregunta),
    })
    expect(r.success).toBe(false)
  })

  it('rechaza si falta el campo preguntas', () => {
    const r = TestGeneradoRawSchema.safeParse({})
    expect(r.success).toBe(false)
  })
})

// ─── CorreccionDesarrolloRawSchema ───────────────────────────────────────────

describe('CorreccionDesarrolloRawSchema', () => {
  const validCorreccion = {
    puntuacion: 7.5,
    feedback: 'El desarrollo es correcto pero mejorable en estructura.',
    mejoras: ['Citar el artículo 14 CE', 'Añadir jurisprudencia'],
    citas_usadas: [{ ley: 'CE', articulo: '14', textoExacto: 'Igualdad ante la ley' }],
    dimension_juridica: 8,
    dimension_argumentacion: 7,
    dimension_estructura: 6.5,
  }

  it('valida corrección completa', () => {
    const r = CorreccionDesarrolloRawSchema.safeParse(validCorreccion)
    expect(r.success).toBe(true)
  })

  it('coerce puntuación de string "7.5" a número', () => {
    const r = CorreccionDesarrolloRawSchema.safeParse({ ...validCorreccion, puntuacion: '7.5' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.puntuacion).toBe(7.5)
  })

  it('rechaza puntuación > 10', () => {
    const r = CorreccionDesarrolloRawSchema.safeParse({ ...validCorreccion, puntuacion: 11 })
    expect(r.success).toBe(false)
  })

  it('rechaza puntuación < 0', () => {
    const r = CorreccionDesarrolloRawSchema.safeParse({ ...validCorreccion, puntuacion: -1 })
    expect(r.success).toBe(false)
  })

  it('rechaza feedback demasiado corto', () => {
    const r = CorreccionDesarrolloRawSchema.safeParse({ ...validCorreccion, feedback: 'Mal' })
    expect(r.success).toBe(false)
  })

  it('rechaza array mejoras vacío', () => {
    const r = CorreccionDesarrolloRawSchema.safeParse({ ...validCorreccion, mejoras: [] })
    expect(r.success).toBe(false)
  })

  it('rechaza más de 5 mejoras', () => {
    const r = CorreccionDesarrolloRawSchema.safeParse({
      ...validCorreccion,
      mejoras: ['1', '2', '3', '4', '5', '6'],
    })
    expect(r.success).toBe(false)
  })

  it('coerce dimensiones de string a número', () => {
    const r = CorreccionDesarrolloRawSchema.safeParse({
      ...validCorreccion,
      dimension_juridica: '9',
      dimension_argumentacion: '8.5',
      dimension_estructura: '7',
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.dimension_juridica).toBe(9)
      expect(r.data.dimension_argumentacion).toBe(8.5)
    }
  })
})

// ─── CazaTrampasRawSchema ────────────────────────────────────────────────────

describe('CazaTrampasRawSchema', () => {
  it('valida cazatrampas con 1 error', () => {
    const r = CazaTrampasRawSchema.safeParse({
      texto_trampa: 'El plazo para interponer recurso es de 2 meses desde la notificación.',
      errores_reales: [{
        tipo: 'plazo',
        valor_original: '1 mes',
        valor_trampa: '2 meses',
        explicacion: 'El plazo correcto es 1 mes según art. 122 LPAC.',
      }],
    })
    expect(r.success).toBe(true)
  })

  it('rechaza array de errores vacío', () => {
    const r = CazaTrampasRawSchema.safeParse({
      texto_trampa: 'Texto trampa largo con contenido de derecho administrativo.',
      errores_reales: [],
    })
    expect(r.success).toBe(false)
  })

  it('rechaza más de 5 errores', () => {
    const err = {
      tipo: 'plazo' as const,
      valor_original: 'a',
      valor_trampa: 'b',
      explicacion: 'Cambio deliberado para testear validación.',
    }
    const r = CazaTrampasRawSchema.safeParse({
      texto_trampa: 'Texto trampa largo con contenido de derecho administrativo.',
      errores_reales: Array.from({ length: 6 }, () => err),
    })
    expect(r.success).toBe(false)
  })

  it('rechaza texto_trampa demasiado corto', () => {
    const r = CazaTrampasRawSchema.safeParse({
      texto_trampa: 'Corto',
      errores_reales: [{ tipo: 'plazo', valor_original: 'a', valor_trampa: 'b', explicacion: 'Razón del cambio.' }],
    })
    expect(r.success).toBe(false)
  })

  it('valida todos los tipos de error inyectado', () => {
    const tipos = ['plazo', 'porcentaje', 'sujeto', 'verbo', 'cifra', 'otro'] as const
    for (const tipo of tipos) {
      const r = CazaTrampasRawSchema.safeParse({
        texto_trampa: 'Texto largo para testing de cada tipo de error posible.',
        errores_reales: [{ tipo, valor_original: 'a', valor_trampa: 'b', explicacion: 'Razón de este cambio.' }],
      })
      expect(r.success, `tipo '${tipo}' debería ser válido`).toBe(true)
    }
  })

  it('rechaza tipo de error inválido', () => {
    const r = CazaTrampasRawSchema.safeParse({
      texto_trampa: 'Texto trampa largo con contenido de derecho administrativo.',
      errores_reales: [{
        tipo: 'invalido',
        valor_original: 'a',
        valor_trampa: 'b',
        explicacion: 'Razón del cambio.',
      }],
    })
    expect(r.success).toBe(false)
  })
})

// ─── CitaLegalSchema ─────────────────────────────────────────────────────────

describe('CitaLegalSchema', () => {
  it('valida cita completa con apartado', () => {
    const r = CitaLegalSchema.safeParse({
      ley: 'LPAC',
      articulo: '122.1',
      apartado: '1',
      textoExacto: 'Un mes si el acto es expreso',
    })
    expect(r.success).toBe(true)
  })

  it('valida cita sin apartado (opcional)', () => {
    const r = CitaLegalSchema.safeParse({
      ley: 'CE',
      articulo: '14',
      textoExacto: 'Igualdad ante la ley',
    })
    expect(r.success).toBe(true)
  })

  it('rechaza ley vacía', () => {
    const r = CitaLegalSchema.safeParse({ ley: '', articulo: '14', textoExacto: 'Texto' })
    expect(r.success).toBe(false)
  })

  it('rechaza articulo vacío', () => {
    const r = CitaLegalSchema.safeParse({ ley: 'CE', articulo: '', textoExacto: 'Texto' })
    expect(r.success).toBe(false)
  })

  it('rechaza textoExacto vacío', () => {
    const r = CitaLegalSchema.safeParse({ ley: 'CE', articulo: '14', textoExacto: '' })
    expect(r.success).toBe(false)
  })
})
