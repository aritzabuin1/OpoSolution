/**
 * lib/psicotecnicos/organization.ts — §1.3B.5
 *
 * Generador de problemas de organización de datos para psicotécnicos.
 *
 * Tipos implementados:
 *   - intruso: identificar el número que NO pertenece a una serie
 *   - ordenacion: determinar qué elemento ocupa una posición dada al ordenar
 *
 * Guardrail §1.3B.7: valores ≤4 dígitos, lógica de 1 paso.
 */

import { randomUUID } from 'node:crypto'
import { rnd, pick, shuffleOptions } from './numeric'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Intruso ──────────────────────────────────────────────────────────────────

/**
 * Genera una secuencia de 5 números donde uno no sigue el patrón.
 * Pregunta: "¿Cuál es el número intruso?"
 * Las 4 opciones son 4 de los 5 números (correcta = el intruso).
 */
function generateIntruso(dificultad: Dificultad): PsicotecnicoQuestion {
  type PatternDef = {
    name: string
    generate: (dificultad: Dificultad) => number[]
    makeWrong: (seq: number[], idx: number) => number
    describe: (seq: number[]) => string
  }

  const patterns: PatternDef[] = [
    {
      name: 'multiplos',
      generate: (dif) => {
        const n = dif === 1 ? rnd(2, 5) : dif === 2 ? rnd(4, 9) : rnd(6, 13)
        const start = rnd(1, 4)
        return Array.from({ length: 5 }, (_, i) => (start + i) * n)
      },
      makeWrong: (seq, idx) => {
        // Replace with a non-multiple: seq[idx] ± rnd(1, step-1)
        const step = seq[1] - seq[0]
        const offset = rnd(1, Math.max(1, step - 1))
        return seq[idx] + offset
      },
      describe: (seq) => {
        const step = seq[1] - seq[0]
        return `múltiplos de ${step / (seq[0] / (seq[0] / step))}`
      },
    },
    {
      name: 'aritmetica',
      generate: (dif) => {
        const a = rnd(3, dif === 1 ? 15 : 30)
        const d = dif === 1 ? rnd(3, 7) : dif === 2 ? rnd(5, 12) : rnd(8, 18)
        return Array.from({ length: 5 }, (_, i) => a + i * d)
      },
      makeWrong: (seq, idx) => {
        const d = seq[1] - seq[0]
        return seq[idx] + rnd(1, Math.max(1, Math.floor(d / 2)))
      },
      describe: (seq) => {
        const d = seq[1] - seq[0]
        return `progresión aritmética con diferencia +${d}`
      },
    },
    {
      name: 'pares',
      generate: () => {
        const start = rnd(2, 20) * 2  // start par
        return Array.from({ length: 5 }, (_, i) => start + i * 2)
      },
      makeWrong: (seq, idx) => seq[idx] + 1,  // impar
      describe: () => 'números pares',
    },
  ]

  const pattern = pick(patterns)
  const sequence = pattern.generate(dificultad)

  // Pick intruso index (avoid first and last for better difficulty)
  const intrusoIdx = dificultad === 1 ? rnd(1, 3) : rnd(0, 4)

  const originalValue = sequence[intrusoIdx]
  let wrongValue = pattern.makeWrong(sequence, intrusoIdx)

  // Ensure wrongValue is different, positive, and not accidentally correct
  if (wrongValue === originalValue || wrongValue <= 0) {
    wrongValue = originalValue + 1
  }

  const seqWithIntruso = [...sequence]
  seqWithIntruso[intrusoIdx] = wrongValue

  const enunciado =
    `¿Cuál es el número intruso en la siguiente serie?\n${seqWithIntruso.join('  —  ')}`

  const correctStr = String(wrongValue)

  // Distractors: 3 of the 5 legitimate numbers (excluding the intruso position)
  const legitNumbers = sequence
    .filter((_, i) => i !== intrusoIdx)
    .map(String) as string[]
  // Pick 3 random legitNumbers to show as distractors
  const shuffled = legitNumbers.sort(() => Math.random() - 0.5)
  const distractors = shuffled.slice(0, 3) as [string, string, string]

  const { opciones, correcta } = shuffleOptions(correctStr, distractors)

  const originalSeqStr = sequence.join(', ')
  const explicacion =
    `La serie sigue una ${pattern.describe(sequence)}: ${originalSeqStr}. ` +
    `El número ${wrongValue} no sigue este patrón (debería ser ${originalValue}).`

  return {
    id: randomUUID(),
    categoria: 'organizacion',
    subtipo: 'intruso',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

// ─── Ordenación ───────────────────────────────────────────────────────────────

/**
 * Genera un problema de ordenación: 4 elementos con etiquetas (A, B, C, D)
 * y valores numéricos distintos. Pregunta por qué etiqueta ocupa la Nª posición.
 *
 * Las 4 opciones siempre son "A", "B", "C", "D" en orden aleatorio.
 */
function generateOrdenacion(dificultad: Dificultad): PsicotecnicoQuestion {
  const ranges: Record<Dificultad, [number, number]> = {
    1: [1, 50],
    2: [10, 200],
    3: [50, 999],
  }

  // Generate 4 unique values
  const [min, max] = ranges[dificultad]
  const values = new Set<number>()
  let safetyLimit = 0
  while (values.size < 4 && safetyLimit < 100) {
    values.add(rnd(min, max))
    safetyLimit++
  }
  const valArr = Array.from(values)
  while (valArr.length < 4) valArr.push(valArr[valArr.length - 1] + 1)

  const labels = ['A', 'B', 'C', 'D'] as const
  const items = labels.map((label, i) => ({ label, value: valArr[i] }))

  // Pick ordering direction and position to ask about
  const ascending = Math.random() > 0.5
  const position = rnd(1, 4)

  const sorted = [...items].sort((a, b) =>
    ascending ? a.value - b.value : b.value - a.value
  )
  const correctLabel = sorted[position - 1].label

  const direction = ascending ? 'menor a mayor' : 'mayor a menor'
  const ordinalPos =
    ['primera', 'segunda', 'tercera', 'cuarta'][position - 1] ?? `${position}ª`

  const enunciado =
    `Dado: A=${items[0].value}, B=${items[1].value}, C=${items[2].value}, D=${items[3].value}.\n` +
    `¿Qué elemento ocupa la ${ordinalPos} posición al ordenarlos de ${direction}?`

  // Options are always the 4 labels
  const distractors = labels.filter((l) => l !== correctLabel) as unknown as [
    string,
    string,
    string,
  ]
  const { opciones, correcta } = shuffleOptions(correctLabel, distractors)

  const sortedStr = sorted
    .map((item, i) => `${i + 1}ª: ${item.label}(${item.value})`)
    .join(', ')
  const explicacion =
    `Ordenados de ${direction}: ${sortedStr}. ` +
    `La ${ordinalPos} posición corresponde a ${correctLabel}.`

  return {
    id: randomUUID(),
    categoria: 'organizacion',
    subtipo: 'ordenacion',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

const GENERADORES_ORGANIZACION = [generateIntruso, generateOrdenacion] as const

/**
 * Genera N preguntas de organización de datos.
 */
export function generateOrganization(
  count: number,
  dificultad: Dificultad
): PsicotecnicoQuestion[] {
  return Array.from({ length: count }, () => pick(GENERADORES_ORGANIZACION)(dificultad))
}

export { generateIntruso, generateOrdenacion }
