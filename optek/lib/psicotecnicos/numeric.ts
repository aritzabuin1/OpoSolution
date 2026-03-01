/**
 * lib/psicotecnicos/numeric.ts — §1.3B.2
 *
 * Generador determinista de problemas numéricos para psicotécnicos.
 *
 * Tipos implementados:
 *   - regla_tres: proporcionalidad inversa (más trabajadores → menos días)
 *   - porcentaje: cálculo de porcentaje de una cantidad
 *   - fraccion: fracción de un total
 *   - descuento: precio final tras aplicar un descuento
 *
 * Guardrail §1.3B.7: números ≤4 dígitos, max 2 operaciones.
 * El reto del examen es la VELOCIDAD, no la complejidad matemática.
 */

import { randomUUID } from 'node:crypto'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Utilidades internas ──────────────────────────────────────────────────────

/** Entero aleatorio en [min, max] inclusivo. */
function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Elemento aleatorio de un array. */
function pick<T>(arr: readonly T[]): T {
  return arr[rnd(0, arr.length - 1)]
}

/** Ordinal español: 1→"primera", 2→"segunda", etc. */
function ordinal(n: number): string {
  const map: Record<number, string> = {
    1: 'primera', 2: 'segunda', 3: 'tercera', 4: 'cuarta', 5: 'quinta',
  }
  return map[n] ?? `${n}ª`
}

/**
 * Genera 3 distractores plausibles a partir de la respuesta correcta.
 * Prioriza los errores comunes pasados como `extras`, luego genera
 * variantes ±cercanas a la respuesta correcta.
 */
function makeDistractors(
  correct: number,
  extras: number[]
): [string, string, string] {
  const unique = new Set<number>()
  for (const v of extras) {
    if (v !== correct && v > 0 && v < 10000) unique.add(v)
  }
  const offsets = [1, 2, 3, 5, 10, 20, 25, 50]
  for (const off of offsets) {
    if (unique.size >= 3) break
    for (const candidate of [correct + off, correct - off]) {
      if (unique.size >= 3) break
      if (candidate > 0 && candidate !== correct && candidate < 10000) {
        unique.add(candidate)
      }
    }
  }
  const arr = Array.from(unique).slice(0, 3)
  return arr.map(String) as [string, string, string]
}

/**
 * Mezcla 4 opciones y devuelve el índice de la correcta.
 * Fisher-Yates aleatorio para evitar sesgos posicionales.
 */
function shuffleOptions(
  correct: string,
  distractors: [string, string, string]
): { opciones: [string, string, string, string]; correcta: 0 | 1 | 2 | 3 } {
  const all: string[] = [correct, ...distractors]
  for (let i = all.length - 1; i > 0; i--) {
    const j = rnd(0, i)
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  const correcta = all.indexOf(correct) as 0 | 1 | 2 | 3
  return { opciones: all as [string, string, string, string], correcta }
}

// ─── Generadores por tipo ─────────────────────────────────────────────────────

/**
 * Regla de tres inversa: más recursos → menos tiempo.
 *
 * Garantía de resultado entero:
 *   trabajadores_inicial = A
 *   multiplicador = m ∈ {2, 3, 4}
 *   trabajadores_nuevo = C = A * m
 *   resultado = D (elegido libremente)
 *   días_inicial = B = D * m          → A*B = A*(D*m) = C*D ✓
 */
function generateReglaTres(dificultad: Dificultad): PsicotecnicoQuestion {
  const rangosA: Record<Dificultad, [number, number]> = {
    1: [2, 4],
    2: [3, 6],
    3: [4, 8],
  }
  const rangosD: Record<Dificultad, [number, number]> = {
    1: [4, 12],
    2: [6, 18],
    3: [8, 24],
  }

  const a = rnd(...rangosA[dificultad])   // trabajadores iniciales
  const m = rnd(2, 4)                     // multiplicador
  const c = a * m                         // trabajadores nuevos
  const d = rnd(...rangosD[dificultad])   // días resultado (lo que se busca)
  const b = d * m                         // días iniciales (se deduce)

  const enunciado =
    `Si ${a} trabajadores tardan ${b} días en realizar una obra, ` +
    `¿cuántos días tardarán ${c} trabajadores en realizar la misma obra?`

  const explicacion =
    `Regla de tres inversa (más trabajadores → menos días): ` +
    `${a} × ${b} = ${c} × x → x = (${a} × ${b}) / ${c} = ${d} días.`

  const distractors = makeDistractors(d, [
    b,           // confundir con días iniciales
    d + a,       // error sumando trabajadores
    Math.round((b * c) / a), // error usando regla directa
  ])

  const { opciones, correcta } = shuffleOptions(`${d} días`, [
    `${distractors[0]} días`,
    `${distractors[1]} días`,
    `${distractors[2]} días`,
  ])

  return {
    id: randomUUID(),
    categoria: 'numerico',
    subtipo: 'regla_tres',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

/**
 * Porcentaje: calcular X% de Y.
 *
 * Garantía de resultado entero: porcentajes son divisores de 100
 * y bases son múltiplos de 100.
 */
function generatePorcentaje(dificultad: Dificultad): PsicotecnicoQuestion {
  const PCTS_D1 = [5, 10, 20, 25, 50] as const
  const PCTS_D2 = [15, 30, 40, 60, 75] as const
  const PCTS_D3 = [12, 35, 45, 65, 80] as const
  const BASES_D1 = [100, 200, 400, 500, 1000] as const
  const BASES_D2 = [200, 300, 400, 500, 600] as const
  const BASES_D3 = [250, 350, 450, 550, 750] as const

  let pct: number, base: number
  // Try to get an integer result (pct * base) / 100
  let attempts = 0
  do {
    if (dificultad === 1) {
      pct = pick(PCTS_D1)
      base = pick(BASES_D1)
    } else if (dificultad === 2) {
      pct = pick(PCTS_D2)
      base = pick(BASES_D2)
    } else {
      pct = pick(PCTS_D3)
      base = pick(BASES_D3)
    }
    attempts++
  } while ((pct * base) % 100 !== 0 && attempts < 50)

  // Fallback to guaranteed integer
  if ((pct * base) % 100 !== 0) { pct = 25; base = 400 }

  const result = (pct * base) / 100

  const enunciado = `¿Cuánto es el ${pct}% de ${base}?`
  const explicacion = `${pct}% de ${base} = ${pct} × ${base} / 100 = ${result}.`

  const distractors = makeDistractors(result, [
    (pct * base) / 10,   // confundir % con ‰
    base - result,        // confundir con el complemento (100%-X%)
    pct * (base / 100) + base, // error sumando en lugar de multiplicar
  ])

  const { opciones, correcta } = shuffleOptions(String(result), distractors)

  return {
    id: randomUUID(),
    categoria: 'numerico',
    subtipo: 'porcentaje',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

/**
 * Fracción de un total: ¿cuánto es X/Y de Z?
 *
 * Garantía: Z = Y × multiplicador, por lo que X/Y × Z = X × multiplicador (entero).
 */
function generateFraccion(dificultad: Dificultad): PsicotecnicoQuestion {
  const denominadores: Record<Dificultad, readonly number[]> = {
    1: [2, 3, 4, 5],
    2: [3, 4, 5, 6, 8],
    3: [4, 5, 6, 8, 10],
  }

  const y = pick(denominadores[dificultad])   // denominador
  const x = rnd(1, y - 1)                     // numerador (< denominador)
  const mult = rnd(dificultad === 1 ? 3 : 5, dificultad === 3 ? 15 : 10)
  const z = y * mult                          // total (múltiplo de y)
  const result = x * mult                     // = (x/y) × z

  const enunciado = `¿Cuánto es ${x}/${y} de ${z}?`
  const explicacion =
    `${x}/${y} de ${z} = ${x} × (${z}/${y}) = ${x} × ${mult} = ${result}.`

  const distractors = makeDistractors(result, [
    x * y,           // multiplicar numerador por denominador en lugar de dividir z
    z / y,           // calcular solo 1/y (olvidar el numerador x)
    result + mult,   // sumar el multiplicador en lugar de multiplicar
  ])

  const { opciones, correcta } = shuffleOptions(String(result), distractors)

  return {
    id: randomUUID(),
    categoria: 'numerico',
    subtipo: 'fraccion',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

/**
 * Descuento: precio final tras aplicar un X% de descuento.
 *
 * Garantía: precio × (100-pct) / 100 es entero.
 * Usa precios y descuentos que siempre producen número entero.
 */
function generateDescuento(dificultad: Dificultad): PsicotecnicoQuestion {
  const DESCUENTOS: Record<Dificultad, readonly number[]> = {
    1: [10, 20, 25, 50],
    2: [15, 20, 30, 40],
    3: [12, 25, 35, 45],
  }
  const PRECIOS: Record<Dificultad, readonly number[]> = {
    1: [100, 200, 300, 400, 500],
    2: [120, 200, 300, 400, 600],
    3: [200, 400, 500, 600, 800],
  }

  let desc: number, precio: number
  let attempts = 0
  do {
    desc = pick(DESCUENTOS[dificultad])
    precio = pick(PRECIOS[dificultad])
    attempts++
  } while ((precio * (100 - desc)) % 100 !== 0 && attempts < 50)

  if ((precio * (100 - desc)) % 100 !== 0) { desc = 20; precio = 300 }

  const result = (precio * (100 - desc)) / 100
  const ahorro = precio - result

  const enunciado =
    `Un artículo cuesta ${precio}€. Si tiene un ${desc}% de descuento, ` +
    `¿cuál es su precio final?`
  const explicacion =
    `Precio final = ${precio} × (1 - ${desc}/100) = ${precio} × ${(100 - desc) / 100} = ${result}€. ` +
    `(Ahorro: ${ahorro}€)`

  const distractors = makeDistractors(result, [
    precio - desc,    // restar el porcentaje como valor absoluto
    ahorro,           // confundir el ahorro con el precio final
    precio + ahorro,  // sumar en lugar de restar
  ])

  const suffix = '€'
  const { opciones, correcta } = shuffleOptions(
    `${result}${suffix}`,
    distractors.map((d) => `${d}${suffix}`) as [string, string, string]
  )

  return {
    id: randomUUID(),
    categoria: 'numerico',
    subtipo: 'descuento',
    enunciado,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

/** Subtipos numéricos disponibles para selección aleatoria. */
const SUBTIPOS_NUMERICOS = [
  generateReglaTres,
  generatePorcentaje,
  generateFraccion,
  generateDescuento,
] as const

/**
 * Genera N preguntas numéricas con subtipo aleatorio.
 *
 * @param count  Número de preguntas a generar
 * @param dificultad  1 (fácil), 2 (media), 3 (difícil)
 */
export function generateNumeric(
  count: number,
  dificultad: Dificultad
): PsicotecnicoQuestion[] {
  return Array.from({ length: count }, () => pick(SUBTIPOS_NUMERICOS)(dificultad))
}

// Exportar generadores individuales para tests de round-trip
export { generateReglaTres, generatePorcentaje, generateFraccion, generateDescuento }
// Exportar utilidades compartidas para reutilizar en otros generadores
export { rnd, pick, makeDistractors, shuffleOptions, ordinal }
