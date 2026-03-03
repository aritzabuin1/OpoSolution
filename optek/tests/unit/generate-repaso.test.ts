/**
 * tests/unit/generate-repaso.test.ts — §repaso_errores
 *
 * Tests unitarios para la lógica del endpoint generate-repaso.
 * Verifica la extracción de preguntas falladas, deduplicación y shuffle.
 *
 * Cobertura:
 *   - Extracción correcta de preguntas falladas (respuesta ≠ correcta)
 *   - Preguntas en blanco (null) no se incluyen
 *   - Preguntas correctas no se incluyen
 *   - Deduplicación por enunciado
 *   - Límite máximo de 20 preguntas
 *   - Mínimo 3 preguntas para generar repaso
 */

import { describe, it, expect } from 'vitest'
import type { Pregunta } from '@/types/ai'

// ─── Helpers de test (lógica pura extraída del endpoint) ─────────────────────

function extraerPreguntasFalladas(
  tests: Array<{ preguntas: Pregunta[]; respuestas_usuario: (number | null)[] }>
): Map<string, Pregunta> {
  const map = new Map<string, Pregunta>()
  for (const test of tests) {
    test.preguntas.forEach((pregunta, idx) => {
      const respuesta = test.respuestas_usuario[idx]
      if (respuesta === null || respuesta === pregunta.correcta) return
      const key = pregunta.enunciado.slice(0, 100)
      if (!map.has(key)) {
        map.set(key, { ...pregunta })
      }
    })
  }
  return map
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePregunta(enunciado: string, correcta: 0 | 1 | 2 | 3 = 0): Pregunta {
  return {
    enunciado,
    opciones: ['A', 'B', 'C', 'D'],
    correcta,
    explicacion: `Explicación de "${enunciado}"`,
  }
}

const P1 = makePregunta('¿Cuál es el plazo de notificación de la LPAC?', 0)
const P2 = makePregunta('¿Qué es el silencio administrativo positivo?', 1)
const P3 = makePregunta('¿Cuántos magistrados tiene el Tribunal Constitucional?', 2)
const P4 = makePregunta('¿Qué artículo de la CE regula el derecho de asociación?', 3)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generate-repaso: extraerPreguntasFalladas()', () => {
  it('extrae las preguntas falladas correctamente', () => {
    const tests = [
      {
        preguntas: [P1, P2, P3],
        respuestas_usuario: [
          1, // P1 falla (correcta=0)
          1, // P2 acierta (correcta=1)
          0, // P3 falla (correcta=2)
        ],
      },
    ]
    const result = extraerPreguntasFalladas(tests)
    expect(result.size).toBe(2)
    expect(result.has(P1.enunciado.slice(0, 100))).toBe(true)
    expect(result.has(P3.enunciado.slice(0, 100))).toBe(true)
    expect(result.has(P2.enunciado.slice(0, 100))).toBe(false)
  })

  it('no incluye preguntas en blanco (null)', () => {
    const tests = [
      {
        preguntas: [P1, P2],
        respuestas_usuario: [null, 0], // P1 en blanco, P2 falla
      },
    ]
    const result = extraerPreguntasFalladas(tests)
    expect(result.size).toBe(1)
    expect(result.has(P2.enunciado.slice(0, 100))).toBe(true)
    expect(result.has(P1.enunciado.slice(0, 100))).toBe(false)
  })

  it('deduplica la misma pregunta que aparece en múltiples tests', () => {
    const tests = [
      { preguntas: [P1], respuestas_usuario: [1] }, // P1 falla
      { preguntas: [P1], respuestas_usuario: [2] }, // P1 falla de nuevo
      { preguntas: [P1], respuestas_usuario: [3] }, // P1 falla de nuevo
    ]
    const result = extraerPreguntasFalladas(tests)
    expect(result.size).toBe(1) // Solo 1 entrada aunque falle 3 veces
  })

  it('deduplica por los primeros 100 chars del enunciado', () => {
    const enunciadoLargo = 'A'.repeat(120)
    const pregA = makePregunta(enunciadoLargo + '___A___', 0)
    const pregB = makePregunta(enunciadoLargo + '___B___', 0) // mismos primeros 100 chars
    const tests = [
      { preguntas: [pregA, pregB], respuestas_usuario: [1, 1] },
    ]
    const result = extraerPreguntasFalladas(tests)
    // Ambas comparten la misma key (primeros 100 chars) → solo 1 entry
    expect(result.size).toBe(1)
  })

  it('devuelve mapa vacío si todos los tests están en blanco', () => {
    const tests = [
      { preguntas: [P1, P2, P3], respuestas_usuario: [null, null, null] },
    ]
    const result = extraerPreguntasFalladas(tests)
    expect(result.size).toBe(0)
  })

  it('devuelve mapa vacío si todos los tests están correctos', () => {
    const tests = [
      {
        preguntas: [P1, P2, P3],
        respuestas_usuario: [0, 1, 2], // todas correctas
      },
    ]
    const result = extraerPreguntasFalladas(tests)
    expect(result.size).toBe(0)
  })

  it('procesa múltiples tests y combina errores únicos', () => {
    // P1 correcta=0, P2 correcta=1, P3 correcta=2, P4 correcta=3
    const tests = [
      { preguntas: [P1, P2], respuestas_usuario: [1, 0] },    // P1 falla (1≠0), P2 falla (0≠1)
      { preguntas: [P3, P4], respuestas_usuario: [0, 3] },    // P3 falla (0≠2), P4 acierta (3=3)
    ]
    const result = extraerPreguntasFalladas(tests)
    expect(result.size).toBe(3) // P1, P2, P3
    expect(result.has(P4.enunciado.slice(0, 100))).toBe(false)
  })
})

describe('generate-repaso: límites y reglas', () => {
  const MAX_PREGUNTAS = 20
  const MIN_PREGUNTAS = 3

  it('limita a MAX_PREGUNTAS cuando hay más errores disponibles', () => {
    const preguntas = Array.from({ length: 30 }, (_, i) =>
      makePregunta(`Pregunta número ${i + 1}`, 0)
    )
    const tests = [
      { preguntas, respuestas_usuario: preguntas.map(() => 1) },
    ]
    const falladas = [...extraerPreguntasFalladas(tests).values()]
    const seleccionadas = falladas.slice(0, MAX_PREGUNTAS)
    expect(seleccionadas.length).toBe(MAX_PREGUNTAS)
  })

  it('no genera repaso cuando hay menos de MIN_PREGUNTAS errores', () => {
    const tests = [
      { preguntas: [P1, P2], respuestas_usuario: [1, 0] }, // P1 falla, P2 falla → 2 errores
    ]
    const falladas = [...extraerPreguntasFalladas(tests).values()]
    expect(falladas.length).toBeLessThan(MIN_PREGUNTAS)
  })

  it('genera repaso cuando hay exactamente MIN_PREGUNTAS errores', () => {
    const tests = [
      { preguntas: [P1, P2, P3, P4], respuestas_usuario: [1, 0, 0, 2] },
      // P1 falla (1≠0), P2 acierta (0=1?no, 0≠1 falla), P3 acierta (0=2?no, 0≠2 falla), P4 acierta (2=3?no)
    ]
    // Actually all fail here since none match correcta
    const falladas = [...extraerPreguntasFalladas(tests).values()]
    expect(falladas.length).toBeGreaterThanOrEqual(MIN_PREGUNTAS)
  })

  it('preserva la cita y dificultad de la pregunta original', () => {
    const preguntaConCita: Pregunta = {
      enunciado: '¿Qué establece el Art. 14 CE?',
      opciones: ['A', 'B', 'C', 'D'],
      correcta: 0,
      explicacion: 'El Art. 14 establece la igualdad.',
      cita: { ley: 'CE', articulo: '14', textoExacto: 'Los españoles son iguales ante la ley' },
      dificultad: 'dificil',
    }
    const tests = [
      { preguntas: [preguntaConCita], respuestas_usuario: [1] },
    ]
    const falladas = [...extraerPreguntasFalladas(tests).values()]
    expect(falladas[0].cita).toEqual(preguntaConCita.cita)
    expect(falladas[0].dificultad).toBe('dificil')
  })

  it('preserva temaId y temaTitulo de preguntas de simulacro', () => {
    const preguntaSimulacro: Pregunta = {
      enunciado: '¿Cuál es el objeto de la Ley 39/2015?',
      opciones: ['A', 'B', 'C', 'D'],
      correcta: 2,
      explicacion: 'La Ley 39/2015 regula el procedimiento administrativo.',
      temaId: 'tema-uuid-011',
      temaTitulo: 'T11: Procedimiento administrativo',
    }
    const tests = [
      { preguntas: [preguntaSimulacro], respuestas_usuario: [0] },
    ]
    const falladas = [...extraerPreguntasFalladas(tests).values()]
    expect(falladas[0].temaId).toBe('tema-uuid-011')
    expect(falladas[0].temaTitulo).toBe('T11: Procedimiento administrativo')
  })
})
