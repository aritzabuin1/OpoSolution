/**
 * tests/unit/psicotecnicos.test.ts — OPTEK §1.3B.8, §1.3B.9, §1.3B.10
 *
 * Tests unitarios del motor determinista de psicotécnicos.
 * No requieren BD ni APIs externas — generación 100% determinista.
 *
 * Cobertura:
 *   §1.3B.8  100 preguntas numéricas → respuesta correcta matematicamente verificada
 *   §1.3B.9  50 series → siguiente número sigue el patrón declarado
 *   §1.3B.10 Batch de 30 preguntas → sin enunciados duplicados (diversidad)
 */

import { describe, it, expect } from 'vitest'
import {
  generateReglaTres,
  generatePorcentaje,
  generateFraccion,
  generateDescuento,
} from '@/lib/psicotecnicos/numeric'
import {
  generateSerieAritmetica,
  generateSerieGeometrica,
  generateSerieFibonacci,
  generateSerieAlternante,
} from '@/lib/psicotecnicos/series'
import { generateVerbal } from '@/lib/psicotecnicos/verbal'
import { generateOrganization } from '@/lib/psicotecnicos/organization'
import { generatePsicotecnicos } from '@/lib/psicotecnicos/index'
import type { PsicotecnicoQuestion, Dificultad } from '@/lib/psicotecnicos/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrae el primer número de un string de opción (e.g., "24 días" → 24, "300€" → 300). */
function parseOpcionNumero(s: string): number {
  const m = s.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : NaN
}

/** Verifica que una pregunta tiene estructura válida. */
function assertPreguntaValida(q: PsicotecnicoQuestion): void {
  expect(q.id).toBeTruthy()
  expect(q.enunciado.length).toBeGreaterThan(5)
  expect(q.opciones).toHaveLength(4)
  expect([0, 1, 2, 3]).toContain(q.correcta)
  expect(q.explicacion.length).toBeGreaterThan(5)
  expect(q.dificultad).toBeOneOf([1, 2, 3])
  // Todas las opciones deben ser distintas entre sí
  const unique = new Set(q.opciones)
  expect(unique.size).toBe(4)
}

// ─── §1.3B.8 — Verificación matemática de preguntas numéricas ─────────────────

describe('§1.3B.8 — 100 preguntas numéricas: respuesta correcta matemáticamente', () => {
  const DIFICULTADES: Dificultad[] = [1, 2, 3]

  it('generateReglaTres: opciones[correcta] es (A*B)/C días', () => {
    // A*m = C, B = D*m → A*B / C = D  (regla inversa)
    for (let i = 0; i < 34; i++) {
      const d = DIFICULTADES[i % 3]
      const q = generateReglaTres(d)
      assertPreguntaValida(q)

      // Extraer A, B, C del enunciado
      const mEnunciado = q.enunciado.match(
        /Si (\d+) trabajadores tardan (\d+) días.+tardarán (\d+) trabajadores/
      )
      expect(mEnunciado).toBeTruthy()
      if (!mEnunciado) continue
      const [, aStr, bStr, cStr] = mEnunciado
      const a = parseInt(aStr), b = parseInt(bStr), c = parseInt(cStr)

      const expected = (a * b) / c
      const actual = parseOpcionNumero(q.opciones[q.correcta])
      expect(actual).toBeCloseTo(expected, 5)
    }
  })

  it('generatePorcentaje: opciones[correcta] es (P*BASE)/100', () => {
    for (let i = 0; i < 34; i++) {
      const d = DIFICULTADES[i % 3]
      const q = generatePorcentaje(d)
      assertPreguntaValida(q)

      const m = q.enunciado.match(/¿Cuánto es el (\d+)% de (\d+)\?/)
      expect(m).toBeTruthy()
      if (!m) continue
      const pct = parseInt(m[1]), base = parseInt(m[2])

      const expected = (pct * base) / 100
      const actual = parseOpcionNumero(q.opciones[q.correcta])
      expect(actual).toBeCloseTo(expected, 5)
    }
  })

  it('generateFraccion: opciones[correcta] es (X/Y)*Z', () => {
    for (let i = 0; i < 33; i++) {
      const d = DIFICULTADES[i % 3]
      const q = generateFraccion(d)
      assertPreguntaValida(q)

      const m = q.enunciado.match(/¿Cuánto es (\d+)\/(\d+) de (\d+)\?/)
      expect(m).toBeTruthy()
      if (!m) continue
      const x = parseInt(m[1]), y = parseInt(m[2]), z = parseInt(m[3])

      const expected = (x * z) / y
      const actual = parseOpcionNumero(q.opciones[q.correcta])
      expect(actual).toBeCloseTo(expected, 5)
    }
  })

  it('generateDescuento: opciones[correcta] es PRECIO*(1-DESC/100)€', () => {
    for (let i = 0; i < 34; i++) {
      const d = DIFICULTADES[i % 3]
      const q = generateDescuento(d)
      assertPreguntaValida(q)

      const m = q.enunciado.match(/cuesta (\d+)€.+tiene un (\d+)% de descuento/)
      expect(m).toBeTruthy()
      if (!m) continue
      const precio = parseInt(m[1]), desc = parseInt(m[2])

      const expected = precio * (100 - desc) / 100
      const actual = parseOpcionNumero(q.opciones[q.correcta])
      expect(actual).toBeCloseTo(expected, 5)
    }
  })
})

// ─── §1.3B.9 — Verificación de series: siguiente número sigue el patrón ───────

describe('§1.3B.9 — 50 series: el siguiente número sigue el patrón declarado', () => {
  const DIFICULTADES: Dificultad[] = [1, 2, 3]

  /** Extrae los 5 términos de la serie del enunciado. */
  function extraerTerminos(enunciado: string): number[] {
    const linea = enunciado.split('\n').at(-1) ?? enunciado
    return linea.replace(/, __$/, '').trim().split(', ').map(Number)
  }

  it('serie aritmética: siguiente = último + diferencia constante', () => {
    for (let i = 0; i < 18; i++) {
      const d = DIFICULTADES[i % 3]
      const q = generateSerieAritmetica(d)
      assertPreguntaValida(q)

      const terms = extraerTerminos(q.enunciado)
      expect(terms).toHaveLength(5)
      const diff = terms[1] - terms[0]
      // Verificar que la diferencia es constante entre todos los términos
      for (let j = 1; j < terms.length; j++) {
        expect(terms[j] - terms[j - 1]).toBeCloseTo(diff, 5)
      }
      const expected = terms[4] + diff
      const actual = parseOpcionNumero(q.opciones[q.correcta])
      expect(actual).toBeCloseTo(expected, 5)
    }
  })

  it('serie geométrica: siguiente = último × razón constante', () => {
    for (let i = 0; i < 16; i++) {
      const d = DIFICULTADES[i % 3]
      const q = generateSerieGeometrica(d)
      assertPreguntaValida(q)

      const terms = extraerTerminos(q.enunciado)
      expect(terms).toHaveLength(5)
      const ratio = terms[1] / terms[0]
      // Verificar que la razón es constante
      for (let j = 1; j < terms.length; j++) {
        expect(terms[j] / terms[j - 1]).toBeCloseTo(ratio, 3)
      }
      const expected = terms[4] * ratio
      const actual = parseOpcionNumero(q.opciones[q.correcta])
      expect(actual).toBeCloseTo(expected, 3)
    }
  })

  it('serie fibonacci: siguiente = penúltimo + último', () => {
    for (let i = 0; i < 16; i++) {
      const d = DIFICULTADES[i % 3]
      const q = generateSerieFibonacci(d)
      assertPreguntaValida(q)

      const terms = extraerTerminos(q.enunciado)
      expect(terms).toHaveLength(5)
      // Verificar el patrón Fibonacci desde el tercer término
      for (let j = 2; j < terms.length; j++) {
        expect(terms[j]).toBeCloseTo(terms[j - 2] + terms[j - 1], 5)
      }
      const expected = terms[3] + terms[4]
      const actual = parseOpcionNumero(q.opciones[q.correcta])
      expect(actual).toBeCloseTo(expected, 5)
    }
  })

  it('serie alternante: estructura válida (4 opciones distintas)', () => {
    for (let i = 0; i < 6; i++) {
      const d = DIFICULTADES[i % 3]
      const q = generateSerieAlternante(d)
      assertPreguntaValida(q)
      // Verificar que hay términos en el enunciado
      expect(q.enunciado).toContain('__')
      expect(q.subtipo).toBe('serie_alternante')
    }
  })
})

// ─── §1.3B.10 — Diversidad: sin enunciados duplicados en un batch ─────────────

describe('§1.3B.10 — Diversidad en batch de 30 preguntas', () => {
  it('30 preguntas generadas: enunciados únicos (sin duplicados)', () => {
    const preguntas = generatePsicotecnicos(30, 2)
    expect(preguntas).toHaveLength(30)

    const enunciados = preguntas.map((p) => p.enunciado)
    const unique = new Set(enunciados)
    // Con la aleatoriedad matemática, es estadísticamente imposible que
    // dos preguntas de distinto tipo tengan el mismo enunciado.
    // Para numérico/series, incluso del mismo tipo los valores son aleatorios.
    expect(unique.size).toBe(30)
  })

  it('30 preguntas: distribución aproximada por categoría (test estadístico)', () => {
    // Ejecutar 3 veces para reducir varianza aleatoria
    const counts: Record<string, number> = { numerico: 0, series: 0, verbal: 0, organizacion: 0 }
    const N_RUNS = 3

    for (let r = 0; r < N_RUNS; r++) {
      const preguntas = generatePsicotecnicos(30, 2)
      for (const p of preguntas) {
        counts[p.categoria] = (counts[p.categoria] ?? 0) + 1
      }
    }

    const total = N_RUNS * 30
    // Verificar que cada categoría tiene entre el 5% y 55% del total
    // (rango amplio para tolerar varianza con muestras pequeñas)
    for (const [cat, n] of Object.entries(counts)) {
      const pct = n / total
      expect(pct).toBeGreaterThan(0.05)
      expect(pct).toBeLessThan(0.55)
      void cat
    }
  })

  it('ids únicos en todas las preguntas generadas', () => {
    const preguntas = generatePsicotecnicos(30, 2)
    const ids = preguntas.map((p) => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(30)
  })
})

// ─── Tests adicionales de estructura ──────────────────────────────────────────

describe('estructura válida para todos los generadores', () => {
  const DIFICULTADES: Dificultad[] = [1, 2, 3]

  it('generateVerbal: estructura correcta', () => {
    for (const d of DIFICULTADES) {
      const qs = generateVerbal(5, d)
      expect(qs).toHaveLength(5)
      for (const q of qs) {
        assertPreguntaValida(q)
        expect(q.categoria).toBe('verbal')
        expect(['sinonimo', 'antonimo']).toContain(q.subtipo)
      }
    }
  })

  it('generateOrganization: estructura correcta', () => {
    for (const d of DIFICULTADES) {
      const qs = generateOrganization(5, d)
      expect(qs).toHaveLength(5)
      for (const q of qs) {
        assertPreguntaValida(q)
        expect(q.categoria).toBe('organizacion')
        expect(['intruso', 'ordenacion']).toContain(q.subtipo)
      }
    }
  })

  it('generatePsicotecnicos con distribución personalizada', () => {
    // Solo numérico
    const soloNum = generatePsicotecnicos(10, 1, { numerico: 1, series: 0, verbal: 0, organizacion: 0 })
    expect(soloNum).toHaveLength(10)
    expect(soloNum.every((q) => q.categoria === 'numerico')).toBe(true)
  })
})
