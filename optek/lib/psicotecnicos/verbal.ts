/**
 * lib/psicotecnicos/verbal.ts — §1.3B.4
 *
 * Generador de preguntas verbales (sinónimos y antónimos) para psicotécnicos.
 *
 * Fuente: data/psicotecnicos/banco_verbal.json
 *   - ≥112 pares de sinónimos
 *   - ≥109 pares de antónimos
 *   Total: ≥221 pares de nivel oficial (Auxiliar Administrativo del Estado)
 *
 * Dificultad: la complejidad del vocabulario aumenta con el nivel (el banco
 * está ordenado de más común a más culto, se samplea de los tramos correspondientes).
 * Nivel 1 → primeros 40% del banco | Nivel 2 → banco completo | Nivel 3 → últimos 60%
 */

import { randomUUID } from 'node:crypto'
import { rnd, shuffleOptions } from './numeric'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Importar banco (Next.js resuelve JSON imports con resolveJsonModule) ──────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bancoVerbal = require('../../../data/psicotecnicos/banco_verbal.json') as {
  sinonimos: VerbalEntry[]
  antonimos: VerbalEntry[]
}

interface VerbalEntry {
  pregunta: string
  correcta: string
  distractores: [string, string, string]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Selecciona un subconjunto del banco según la dificultad. */
function getSubset(entries: VerbalEntry[], dificultad: Dificultad): VerbalEntry[] {
  const n = entries.length
  if (dificultad === 1) return entries.slice(0, Math.ceil(n * 0.5))
  if (dificultad === 2) return entries
  // Dificultad 3: mezcla de vocabulario más culto (últimos 60%)
  return entries.slice(Math.floor(n * 0.4))
}

/** Selecciona una entrada aleatoria del subconjunto dado. */
function pickEntry(entries: VerbalEntry[], dificultad: Dificultad): VerbalEntry {
  const subset = getSubset(entries, dificultad)
  return subset[rnd(0, subset.length - 1)]
}

// ─── Generadores ─────────────────────────────────────────────────────────────

function generateSinonimo(dificultad: Dificultad): PsicotecnicoQuestion {
  const entry = pickEntry(bancoVerbal.sinonimos, dificultad)
  const { opciones, correcta } = shuffleOptions(entry.correcta, entry.distractores)

  return {
    id: randomUUID(),
    categoria: 'verbal',
    subtipo: 'sinonimo',
    enunciado: entry.pregunta,
    opciones,
    correcta,
    explicacion: `Sinónimo de la palabra propuesta: «${entry.correcta}».`,
    dificultad,
  }
}

function generateAntonimo(dificultad: Dificultad): PsicotecnicoQuestion {
  const entry = pickEntry(bancoVerbal.antonimos, dificultad)
  const { opciones, correcta } = shuffleOptions(entry.correcta, entry.distractores)

  return {
    id: randomUUID(),
    categoria: 'verbal',
    subtipo: 'antonimo',
    enunciado: entry.pregunta,
    opciones,
    correcta,
    explicacion: `Antónimo (contrario) de la palabra propuesta: «${entry.correcta}».`,
    dificultad,
  }
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

/**
 * Genera N preguntas verbales (sinónimos/antónimos) sin repetición de enunciado.
 *
 * Construye un pool combinado (sinónimos + antónimos) del nivel de dificultad,
 * lo mezcla con Fisher-Yates, y toma las primeras `count` entradas.
 * Garantiza diversidad incluso cuando count es pequeño respecto al banco.
 */
export function generateVerbal(
  count: number,
  dificultad: Dificultad
): PsicotecnicoQuestion[] {
  type TaggedEntry = VerbalEntry & { tipo: 'sinonimo' | 'antonimo' }

  const pool: TaggedEntry[] = [
    ...getSubset(bancoVerbal.sinonimos, dificultad).map((e) => ({ ...e, tipo: 'sinonimo' as const })),
    ...getSubset(bancoVerbal.antonimos, dificultad).map((e) => ({ ...e, tipo: 'antonimo' as const })),
  ]

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rnd(0, i)
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, count).map((entry) => {
    const { opciones, correcta } = shuffleOptions(entry.correcta, entry.distractores)
    return {
      id: randomUUID(),
      categoria: 'verbal' as const,
      subtipo: entry.tipo === 'sinonimo' ? 'sinonimo' as const : 'antonimo' as const,
      enunciado: entry.pregunta,
      opciones,
      correcta,
      explicacion:
        entry.tipo === 'sinonimo'
          ? `Sinónimo de la palabra propuesta: «${entry.correcta}».`
          : `Antónimo (contrario) de la palabra propuesta: «${entry.correcta}».`,
      dificultad,
    }
  })
}

export { generateSinonimo, generateAntonimo }
