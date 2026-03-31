/**
 * lib/ingles/index.ts — §6.6
 *
 * Motor determinista de ingles para Guardia Civil.
 * Genera preguntas aleatorias del banco por categoria y dificultad.
 */

import { randomUUID } from 'node:crypto'
import type { CategoriaIngles, Dificultad, InglesQuestion } from './types'
import { INGLES_BANK } from './bank'

/** Distribution for GC exam English section */
export const INGLES_DISTRIBUCION: Record<CategoriaIngles, number> = {
  grammar_tenses: 0.15,
  grammar_prepositions: 0.10,
  grammar_articles: 0.08,
  grammar_comparatives: 0.07,
  grammar_modals: 0.10,
  grammar_conditionals: 0.10,
  vocabulary_police: 0.15,
  vocabulary_general: 0.10,
  reading_comprehension: 0.15,
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateIngles(
  count: number,
  dificultad: Dificultad,
  distribucion: Record<CategoriaIngles, number> = INGLES_DISTRIBUCION
): InglesQuestion[] {
  const cats = Object.keys(distribucion) as CategoriaIngles[]
  const allocations: Record<string, number> = {}
  let remaining = count

  for (const cat of cats) {
    allocations[cat] = Math.floor(count * distribucion[cat])
    remaining -= allocations[cat]
  }
  const sorted = [...cats].sort((a, b) =>
    (count * distribucion[b] - Math.floor(count * distribucion[b])) -
    (count * distribucion[a] - Math.floor(count * distribucion[a]))
  )
  for (let i = 0; i < remaining; i++) {
    allocations[sorted[i]]++
  }

  const questions: InglesQuestion[] = []
  const usedEnunciados = new Set<string>()

  for (const cat of cats) {
    const pool = INGLES_BANK.filter(
      item => item.categoria === cat && item.dificultad === dificultad
    )
    const fallbackPool = pool.length === 0
      ? INGLES_BANK.filter(item => item.categoria === cat)
      : pool

    const shuffled = shuffleArray([...fallbackPool])
    const needed = allocations[cat]
    for (let i = 0; i < needed && i < shuffled.length; i++) {
      const item = shuffled[i]
      if (!usedEnunciados.has(item.enunciado)) {
        usedEnunciados.add(item.enunciado)
        questions.push({
          id: randomUUID(),
          categoria: item.categoria,
          enunciado: item.enunciado,
          opciones: item.opciones,
          correcta: item.correcta,
          explicacion: item.explicacion,
          dificultad: item.dificultad,
        })
      }
    }
  }

  // Fill from any category if needed
  if (questions.length < count) {
    const allPool = shuffleArray(
      [...INGLES_BANK].filter(item => !usedEnunciados.has(item.enunciado))
    )
    for (const item of allPool) {
      if (questions.length >= count) break
      questions.push({
        id: randomUUID(),
        categoria: item.categoria,
        enunciado: item.enunciado,
        opciones: item.opciones,
        correcta: item.correcta,
        explicacion: item.explicacion,
        dificultad: item.dificultad,
      })
    }
  }

  return shuffleArray(questions).slice(0, count)
}

export function getInglesBankSize(): number {
  return INGLES_BANK.length
}

export function getInglesBankStats(): Record<CategoriaIngles, number> {
  const stats = {} as Record<CategoriaIngles, number>
  for (const item of INGLES_BANK) {
    stats[item.categoria] = (stats[item.categoria] || 0) + 1
  }
  return stats
}
