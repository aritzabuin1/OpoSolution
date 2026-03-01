/**
 * lib/psicotecnicos/series.ts — §1.3B.3
 *
 * Generador determinista de series numéricas para psicotécnicos.
 *
 * Patrones implementados:
 *   - serie_aritmetica: progresión con diferencia constante (+d)
 *   - serie_geometrica: progresión con razón constante (×r)
 *   - serie_fibonacci: cada término = suma de los dos anteriores
 *   - serie_alternante: dos subseries entrelazadas
 *
 * Formato: se muestran los primeros 5 términos, se pide el 6º.
 * Guardrail §1.3B.7: términos ≤4 dígitos, razones ≤4 en geométrica.
 */

import { randomUUID } from 'node:crypto'
import { rnd, pick, makeDistractors, shuffleOptions } from './numeric'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Generadores de series ────────────────────────────────────────────────────

/**
 * Serie aritmética: a, a+d, a+2d, a+3d, a+4d → siguiente = a+5d
 *
 * Dificultad:
 *   1: d∈[2,5], a∈[1,10]
 *   2: d∈[3,9], a∈[2,20]
 *   3: d∈[7,15], a∈[5,30]
 */
function generateSerieAritmetica(dificultad: Dificultad): PsicotecnicoQuestion {
  const ranges: Record<Dificultad, { aRange: [number, number]; dRange: [number, number] }> = {
    1: { aRange: [1, 10], dRange: [2, 5] },
    2: { aRange: [2, 20], dRange: [3, 9] },
    3: { aRange: [5, 30], dRange: [7, 15] },
  }
  const { aRange, dRange } = ranges[dificultad]
  const a = rnd(...aRange)
  const d = rnd(...dRange)

  const terms = Array.from({ length: 5 }, (_, i) => a + i * d)
  const next = a + 5 * d

  const enunciado = `¿Cuál es el siguiente número en la serie?\n${terms.join(', ')}, __`
  const explicacion = `Serie aritmética con diferencia d = +${d}. Cada término aumenta en ${d}. Siguiente: ${terms[4]} + ${d} = ${next}.`

  const distractors = makeDistractors(next, [
    next + d,        // saltar un paso extra
    next - d,        // retroceder
    next + 1,        // error por 1
  ])

  const { opciones, correcta } = shuffleOptions(String(next), distractors)

  return {
    id: randomUUID(),
    categoria: 'series',
    subtipo: 'serie_aritmetica',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

/**
 * Serie geométrica: a, a×r, a×r², a×r³, a×r⁴ → siguiente = a×r⁵
 *
 * Guardrail: r∈[2,3] para dif 1-2, r∈[2,4] para dif 3.
 * Limitamos razón y punto de partida para que términos ≤4 dígitos.
 */
function generateSerieGeometrica(dificultad: Dificultad): PsicotecnicoQuestion {
  const configs: Record<Dificultad, { aRange: [number, number]; r: number[] }> = {
    1: { aRange: [1, 3], r: [2, 3] },
    2: { aRange: [1, 4], r: [2, 3] },
    3: { aRange: [1, 3], r: [2, 3, 4] },
  }
  const cfg = configs[dificultad]
  const r = pick(cfg.r)

  // Ensure a*r^5 ≤ 9999
  let a: number
  let attempts = 0
  do {
    a = rnd(...cfg.aRange)
    attempts++
  } while (a * Math.pow(r, 5) > 9999 && attempts < 20)
  if (a * Math.pow(r, 5) > 9999) a = 1

  const terms = Array.from({ length: 5 }, (_, i) => a * Math.pow(r, i))
  const next = a * Math.pow(r, 5)

  const enunciado = `¿Cuál es el siguiente número en la serie?\n${terms.join(', ')}, __`
  const explicacion = `Serie geométrica con razón r = ×${r}. Cada término se multiplica por ${r}. Siguiente: ${terms[4]} × ${r} = ${next}.`

  const distractors = makeDistractors(next, [
    next + terms[4],    // sumar en lugar de multiplicar
    terms[4] + r,       // confundir razón con diferencia
    next * r,           // aplicar razón una vez más
  ])

  const { opciones, correcta } = shuffleOptions(String(next), distractors)

  return {
    id: randomUUID(),
    categoria: 'series',
    subtipo: 'serie_geometrica',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

/**
 * Serie tipo Fibonacci: cada término = suma de los dos anteriores.
 * f(n) = f(n-1) + f(n-2)
 *
 * Dificultad determina el punto de partida para controlar la magnitud.
 */
function generateSerieFibonacci(dificultad: Dificultad): PsicotecnicoQuestion {
  const ranges: Record<Dificultad, { f0: [number, number]; f1: [number, number] }> = {
    1: { f0: [1, 4], f1: [1, 4] },
    2: { f0: [2, 6], f1: [3, 7] },
    3: { f0: [3, 8], f1: [5, 10] },
  }
  const { f0, f1 } = ranges[dificultad]
  const a = rnd(...f0)
  const b = rnd(...f1)

  // Generate terms: a, b, a+b, a+2b, 2a+3b, 3a+5b
  const seq = [a, b]
  for (let i = 2; i < 6; i++) seq.push(seq[i - 1] + seq[i - 2])
  const terms = seq.slice(0, 5)
  const next = seq[5]

  const enunciado = `¿Cuál es el siguiente número en la serie?\n${terms.join(', ')}, __`
  const explicacion =
    `Cada número es la suma de los dos anteriores: ${terms[3]} + ${terms[4]} = ${next}.`

  const distractors = makeDistractors(next, [
    terms[4] + terms[3] + 1,  // error por 1
    terms[4] * 2,              // doblar en vez de sumar
    next - a,                  // restar el primer término
  ])

  const { opciones, correcta } = shuffleOptions(String(next), distractors)

  return {
    id: randomUUID(),
    categoria: 'series',
    subtipo: 'serie_fibonacci',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

/**
 * Serie alternante: dos subseries entrelazadas.
 * Posiciones impares (1,3,5): a, a+d1, a+2d1
 * Posiciones pares (2,4,6): b, b+d2, b+2d2
 * Secuencia: a, b, a+d1, b+d2, a+2d1 → siguiente = b+2d2
 *
 * Dificultad: valores y diferencias según nivel.
 */
function generateSerieAlternante(dificultad: Dificultad): PsicotecnicoQuestion {
  const ranges: Record<Dificultad, { ab: [number, number]; d: [number, number] }> = {
    1: { ab: [1, 10], d: [2, 4] },
    2: { ab: [2, 20], d: [3, 7] },
    3: { ab: [5, 25], d: [4, 10] },
  }
  const { ab, d } = ranges[dificultad]
  const a = rnd(...ab)
  const d1 = rnd(...d)
  let b: number
  let d2: number
  // Ensure b ≠ a and d2 ≠ d1 for non-trivial question
  do { b = rnd(...ab) } while (b === a)
  do { d2 = rnd(...d) } while (d2 === d1)

  // t1=a, t2=b, t3=a+d1, t4=b+d2, t5=a+2d1  → t6 = b+2d2
  const terms = [a, b, a + d1, b + d2, a + 2 * d1]
  const next = b + 2 * d2

  const enunciado = `¿Cuál es el siguiente número en la serie?\n${terms.join(', ')}, __`
  const explicacion =
    `Serie con dos subseries alternadas:\n` +
    `• Posiciones 1,3,5: ${a}, ${a + d1}, ${a + 2 * d1} (progresión +${d1})\n` +
    `• Posiciones 2,4,6: ${b}, ${b + d2}, ${b + 2 * d2} (progresión +${d2})\n` +
    `El 6º término continúa la subserie par: ${b + d2} + ${d2} = ${next}.`

  const distractors = makeDistractors(next, [
    a + 3 * d1,       // continuar la subserie impar en vez de la par
    terms[4] + d2,    // aplicar d2 al último término visible
    next + d1,        // combinar ambas diferencias
  ])

  const { opciones, correcta } = shuffleOptions(String(next), distractors)

  return {
    id: randomUUID(),
    categoria: 'series',
    subtipo: 'serie_alternante',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

const GENERADORES_SERIES = [
  generateSerieAritmetica,
  generateSerieGeometrica,
  generateSerieFibonacci,
  generateSerieAlternante,
] as const

/**
 * Genera N preguntas de series con patrón aleatorio.
 */
export function generateSeries(
  count: number,
  dificultad: Dificultad
): PsicotecnicoQuestion[] {
  return Array.from({ length: count }, () => pick(GENERADORES_SERIES)(dificultad))
}

// Exportar generadores individuales para tests de round-trip
export {
  generateSerieAritmetica,
  generateSerieGeometrica,
  generateSerieFibonacci,
  generateSerieAlternante,
}
