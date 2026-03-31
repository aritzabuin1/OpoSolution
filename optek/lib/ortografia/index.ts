/**
 * lib/ortografia/index.ts — §6.5
 *
 * Motor determinista de ortografía para Guardia Civil.
 * Genera preguntas aleatorias del banco por categoría y dificultad.
 */

import { randomUUID } from 'node:crypto'
import type { CategoriaOrtografia, Dificultad, OrtografiaQuestion } from './types'
import { ORTOGRAFIA_BANK } from './bank'

/** Distribution for GC exam orthography section */
export const ORTOGRAFIA_DISTRIBUCION: Record<CategoriaOrtografia, number> = {
  acentuacion: 0.20,
  b_v: 0.12,
  h: 0.12,
  g_j: 0.10,
  ll_y: 0.08,
  c_z_s: 0.08,
  mayusculas: 0.10,
  puntuacion: 0.10,
  homofonos: 0.10,
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateOrtografia(
  count: number,
  dificultad: Dificultad,
  distribucion: Record<CategoriaOrtografia, number> = ORTOGRAFIA_DISTRIBUCION
): OrtografiaQuestion[] {
  // 1. Allocate per category
  const cats = Object.keys(distribucion) as CategoriaOrtografia[]
  const allocations: Record<string, number> = {}
  let remaining = count

  // Floor allocation
  for (const cat of cats) {
    allocations[cat] = Math.floor(count * distribucion[cat])
    remaining -= allocations[cat]
  }
  // Distribute remainder by largest fractional part
  const sorted = [...cats].sort((a, b) =>
    (count * distribucion[b] - Math.floor(count * distribucion[b])) -
    (count * distribucion[a] - Math.floor(count * distribucion[a]))
  )
  for (let i = 0; i < remaining; i++) {
    allocations[sorted[i]]++
  }

  // 2. Pick items per category
  const questions: OrtografiaQuestion[] = []
  const usedEnunciados = new Set<string>()

  for (const cat of cats) {
    const pool = ORTOGRAFIA_BANK.filter(
      item => item.categoria === cat && item.dificultad === dificultad
    )
    if (pool.length === 0) {
      // Fallback: any difficulty for this category
      const fallbackPool = ORTOGRAFIA_BANK.filter(item => item.categoria === cat)
      const needed = allocations[cat]
      const shuffled = shuffleArray(fallbackPool)
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
      continue
    }

    const shuffled = shuffleArray(pool)
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

  // 3. If we still need more questions (pool exhaustion), fill from any category
  if (questions.length < count) {
    const allPool = shuffleArray(
      ORTOGRAFIA_BANK.filter(item => !usedEnunciados.has(item.enunciado))
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

/** Total items in the bank */
export function getOrtografiaBankSize(): number {
  return ORTOGRAFIA_BANK.length
}

/** Items per category */
export function getOrtografiaBankStats(): Record<CategoriaOrtografia, number> {
  const stats = {} as Record<CategoriaOrtografia, number>
  for (const item of ORTOGRAFIA_BANK) {
    stats[item.categoria] = (stats[item.categoria] || 0) + 1
  }
  return stats
}

// Re-export types
export type { CategoriaOrtografia, Dificultad, OrtografiaQuestion, OrtografiaItem } from './types'
