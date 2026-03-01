/**
 * lib/psicotecnicos/index.ts — §1.3B.6
 *
 * Orquestador del motor determinista de psicotécnicos.
 *
 * Distribución por defecto (examen Auxiliar Administrativo del Estado):
 *   40% numérico | 25% series | 20% verbal | 15% organización
 *
 * Guardrail §1.3B.7: nivel BÁSICO obligatorio. Números ≤4 dígitos,
 * operaciones máximo 2 pasos. El reto del examen es la VELOCIDAD.
 */

import { generateNumeric } from './numeric'
import { generateSeries } from './series'
import { generateVerbal } from './verbal'
import { generateOrganization } from './organization'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Distribución por defecto ─────────────────────────────────────────────────

/**
 * Distribución de categorías (fracción del total de preguntas).
 * Suma debe ser 1.0.
 */
const DEFAULT_DISTRIBUCION: Record<string, number> = {
  numerico:     0.40,
  series:       0.25,
  verbal:       0.20,
  organizacion: 0.15,
}

// ─── generatePsicotecnicos ────────────────────────────────────────────────────

/**
 * Genera N preguntas psicotécnicas con distribución configurable.
 *
 * @param count       Número de preguntas a generar (típicamente 30)
 * @param dificultad  1 (fácil), 2 (media), 3 (difícil)
 * @param distribucion  Distribución opcional por categoría (sobrescribe la por defecto)
 *
 * @returns Array de PsicotecnicoQuestion con contenido único por id
 *
 * @example
 * // 30 preguntas de dificultad media (examen tipo)
 * const preguntas = generatePsicotecnicos(30, 2)
 *
 * @example
 * // 10 preguntas solo numéricas para práctica
 * const preguntas = generatePsicotecnicos(10, 1, { numerico: 1.0, series: 0, verbal: 0, organizacion: 0 })
 */
export function generatePsicotecnicos(
  count: number,
  dificultad: Dificultad,
  distribucion: Partial<Record<string, number>> = {}
): PsicotecnicoQuestion[] {
  const dist = { ...DEFAULT_DISTRIBUCION, ...distribucion }

  // Normalizar para que sumen exactamente 1.0
  const total = Object.values(dist).reduce((a, b) => (a ?? 0) + (b ?? 0), 0 as number)
  const keys = Object.keys(dist)
  const normalized: Record<string, number> = {}
  for (const k of keys) {
    normalized[k] = (dist[k] ?? 0) / (total || 1)
  }

  // Calcular cuántas preguntas por categoría (usando floor + asignación del resto)
  const counts: Record<string, number> = {}
  let assigned = 0
  const fractions: Array<{ key: string; frac: number }> = []

  for (const k of keys) {
    const exact = (normalized[k] ?? 0) * count
    counts[k] = Math.floor(exact)
    assigned += counts[k]
    fractions.push({ key: k, frac: exact - Math.floor(exact) })
  }

  // Distribuir el resto a las categorías con mayor fracción sobrante
  let remainder = count - assigned
  fractions.sort((a, b) => b.frac - a.frac)
  for (const { key } of fractions) {
    if (remainder <= 0) break
    counts[key] = (counts[key] ?? 0) + 1
    remainder--
  }

  // Generar preguntas con deduplicación por enunciado
  // Retry con max 5 iteraciones extra para reemplazar eventuales duplicados
  const seen = new Set<string>()
  const preguntas: PsicotecnicoQuestion[] = []

  const generadores: Array<() => PsicotecnicoQuestion[]> = [
    () => generateNumeric(counts['numerico'] ?? 0, dificultad),
    () => generateSeries(counts['series'] ?? 0, dificultad),
    () => generateVerbal(counts['verbal'] ?? 0, dificultad),
    () => generateOrganization(counts['organizacion'] ?? 0, dificultad),
  ]

  for (const gen of generadores) {
    for (const q of gen()) {
      if (!seen.has(q.enunciado)) {
        seen.add(q.enunciado)
        preguntas.push(q)
      }
    }
  }

  // Rellenar huecos dejados por duplicados (máx 5 intentos por hueco)
  const catGeneradores: Record<string, (d: Dificultad) => PsicotecnicoQuestion[]> = {
    numerico: (d) => generateNumeric(1, d),
    series: (d) => generateSeries(1, d),
    verbal: (d) => generateVerbal(1, d),
    organizacion: (d) => generateOrganization(1, d),
  }
  // Solo categorías con cuota > 0 para respetar la distribución solicitada
  const catKeys = Object.keys(catGeneradores).filter((k) => (counts[k] ?? 0) > 0)

  while (preguntas.length < count) {
    // Elegir categoría con mayor déficit
    const catKey = catKeys[Math.floor(Math.random() * catKeys.length)]
    const gen = catGeneradores[catKey]
    let added = false
    for (let attempt = 0; attempt < 5 && !added; attempt++) {
      const [q] = gen(dificultad)
      if (q && !seen.has(q.enunciado)) {
        seen.add(q.enunciado)
        preguntas.push(q)
        added = true
      }
    }
    // Safety: si no puede deduplicar (banco muy pequeño), añadir igualmente
    if (!added) {
      const [q] = gen(dificultad)
      if (q) preguntas.push(q)
      break
    }
  }

  // Mezclar el orden (Fisher-Yates) para que no vengan por bloques
  for (let i = preguntas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[preguntas[i], preguntas[j]] = [preguntas[j], preguntas[i]]
  }

  return preguntas
}

// Re-exportar tipos y generadores individuales para facilitar el acceso
export type { PsicotecnicoQuestion, Dificultad, CategoriaPsicotecnico } from './types'
export { generateNumeric } from './numeric'
export { generateSeries } from './series'
export { generateVerbal } from './verbal'
export { generateOrganization } from './organization'
