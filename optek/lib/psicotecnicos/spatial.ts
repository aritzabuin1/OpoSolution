/**
 * lib/psicotecnicos/spatial.ts
 *
 * Generador determinista de problemas de razonamiento espacial.
 * Usado en psicotécnicos de oposiciones de seguridad (Ertzaintza, GC, PN).
 *
 * Tipos implementados:
 *   - rotacion_mental: identificar qué figura resulta de rotar otra
 *   - espejo: identificar el reflejo especular de una figura
 *   - coordenadas: localizar puntos en una cuadrícula
 *   - secuencia_espacial: completar una secuencia de posiciones en rejilla
 *
 * 100% determinista. Sin IA, sin BD.
 */

import { randomUUID } from 'node:crypto'
import { rnd, pick, shuffleOptions } from './numeric'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Utilidades internas ──────────────────────────────────────────────────────

/** Direcciones cardinales y diagonales. */
const DIRECCIONES = ['↑', '→', '↓', '←', '↗', '↘', '↙', '↖'] as const

/** Flechas rotadas 90° en sentido horario. */
const ROTACION_90: Record<string, string> = {
  '↑': '→', '→': '↓', '↓': '←', '←': '↑',
  '↗': '↘', '↘': '↙', '↙': '↖', '↖': '↗',
}

/** Flechas rotadas 180°. */
const ROTACION_180: Record<string, string> = {
  '↑': '↓', '↓': '↑', '→': '←', '←': '→',
  '↗': '↙', '↙': '↗', '↘': '↖', '↖': '↘',
}

/** Flechas rotadas 270° (= 90° antihorario). */
const ROTACION_270: Record<string, string> = {
  '↑': '←', '←': '↓', '↓': '→', '→': '↑',
  '↗': '↖', '↖': '↙', '↙': '↘', '↘': '↗',
}

/** Reflejo horizontal (espejo respecto eje vertical). */
const ESPEJO_H: Record<string, string> = {
  '↑': '↑', '↓': '↓', '→': '←', '←': '→',
  '↗': '↖', '↖': '↗', '↘': '↙', '↙': '↘',
}

/** Reflejo vertical (espejo respecto eje horizontal). */
const ESPEJO_V: Record<string, string> = {
  '↑': '↓', '↓': '↑', '→': '→', '←': '←',
  '↗': '↘', '↘': '↗', '↖': '↙', '↙': '↖',
}

/** Formas geométricas simples para representar con texto. */
const FORMAS = ['▲', '■', '●', '◆', '★', '▼', '◄', '►', '○', '□'] as const

/** Letras de columna para coordenadas. */
const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

/** Aplica una rotación a una secuencia de flechas. */
function rotarSecuencia(flechas: string[], grados: 90 | 180 | 270): string[] {
  const mapa = grados === 90 ? ROTACION_90 : grados === 180 ? ROTACION_180 : ROTACION_270
  return flechas.map((f) => mapa[f] ?? f)
}

/** Aplica reflejo a una secuencia de flechas. */
function reflejarSecuencia(flechas: string[], eje: 'horizontal' | 'vertical'): string[] {
  const mapa = eje === 'horizontal' ? ESPEJO_H : ESPEJO_V
  return flechas.map((f) => mapa[f] ?? f)
}

/** Genera una secuencia aleatoria de flechas cardinales (sin diagonales para nivel 1). */
function generarFlechas(count: number, dificultad: Dificultad): string[] {
  const pool = dificultad === 1 ? DIRECCIONES.slice(0, 4) : DIRECCIONES
  return Array.from({ length: count }, () => pick(pool))
}

// ─── Generadores por tipo ─────────────────────────────────────────────────────

/**
 * Rotación mental: dada una secuencia de flechas, ¿cuál es el resultado
 * de rotarla X grados en sentido horario?
 */
function generateRotacionMental(dificultad: Dificultad): PsicotecnicoQuestion {
  const numFlechas = dificultad === 1 ? 3 : dificultad === 2 ? 4 : 5
  const flechas = generarFlechas(numFlechas, dificultad)
  const gradosOpciones: Array<90 | 180 | 270> = dificultad === 1 ? [90, 180] : [90, 180, 270]
  const grados = pick(gradosOpciones)

  const resultado = rotarSecuencia(flechas, grados)
  const resultadoStr = resultado.join(' ')

  // Distractores: otras rotaciones + reflejo
  const otrasRotaciones: Array<90 | 180 | 270> = [90, 180, 270].filter((g) => g !== grados) as Array<90 | 180 | 270>
  const distractor1 = rotarSecuencia(flechas, otrasRotaciones[0]).join(' ')
  const distractor2 = rotarSecuencia(flechas, otrasRotaciones[1]).join(' ')
  const distractor3 = reflejarSecuencia(flechas, 'horizontal').join(' ')

  // Asegurar distractores únicos
  const distractors = [distractor1, distractor2, distractor3].filter(
    (d, i, arr) => d !== resultadoStr && arr.indexOf(d) === i
  )
  while (distractors.length < 3) {
    const extra = generarFlechas(numFlechas, dificultad).join(' ')
    if (extra !== resultadoStr && !distractors.includes(extra)) distractors.push(extra)
  }

  const { opciones, correcta } = shuffleOptions(resultadoStr, [
    distractors[0],
    distractors[1],
    distractors[2],
  ])

  return {
    id: randomUUID(),
    categoria: 'espacial',
    subtipo: 'rotacion_mental',
    enunciado:
      `Si rotamos la secuencia [ ${flechas.join(' ')} ] ${grados}° en sentido horario, ` +
      `¿cuál es el resultado?`,
    opciones,
    correcta,
    explicacion:
      `Al rotar ${grados}° en sentido horario, cada flecha se transforma: ` +
      flechas.map((f, i) => `${f}→${resultado[i]}`).join(', ') +
      `. Resultado: [ ${resultadoStr} ].`,
    dificultad,
  }
}

/**
 * Espejo: dada una secuencia de flechas/formas, ¿cuál es su reflejo
 * respecto al eje indicado?
 */
function generateEspejo(dificultad: Dificultad): PsicotecnicoQuestion {
  const numFlechas = dificultad === 1 ? 3 : dificultad === 2 ? 4 : 5
  const flechas = generarFlechas(numFlechas, dificultad)
  const eje: 'horizontal' | 'vertical' = pick(['horizontal', 'vertical'])

  const resultado = reflejarSecuencia(flechas, eje)
  const resultadoStr = resultado.join(' ')

  // Distractores
  const otroEje = eje === 'horizontal' ? 'vertical' : 'horizontal'
  const distractor1 = reflejarSecuencia(flechas, otroEje).join(' ')
  const distractor2 = rotarSecuencia(flechas, 180).join(' ')
  const distractor3 = flechas.slice().reverse().join(' ')

  const distractors = [distractor1, distractor2, distractor3].filter(
    (d, i, arr) => d !== resultadoStr && arr.indexOf(d) === i
  )
  while (distractors.length < 3) {
    const extra = generarFlechas(numFlechas, dificultad).join(' ')
    if (extra !== resultadoStr && !distractors.includes(extra)) distractors.push(extra)
  }

  const ejeDesc = eje === 'horizontal' ? 'eje vertical (espejo izquierda-derecha)' : 'eje horizontal (espejo arriba-abajo)'

  const { opciones, correcta } = shuffleOptions(resultadoStr, [
    distractors[0],
    distractors[1],
    distractors[2],
  ])

  return {
    id: randomUUID(),
    categoria: 'espacial',
    subtipo: 'espejo',
    enunciado:
      `¿Cuál es el reflejo de la secuencia [ ${flechas.join(' ')} ] respecto al ${ejeDesc}?`,
    opciones,
    correcta,
    explicacion:
      `Reflejo ${eje}: cada flecha se transforma según su eje de simetría. ` +
      flechas.map((f, i) => `${f}→${resultado[i]}`).join(', ') +
      `. Resultado: [ ${resultadoStr} ].`,
    dificultad,
  }
}

/**
 * Coordenadas: dada una cuadrícula con formas, localizar o identificar
 * la posición correcta de un elemento.
 */
function generateCoordenadas(dificultad: Dificultad): PsicotecnicoQuestion {
  const gridSize = dificultad === 1 ? 3 : dificultad === 2 ? 4 : 5
  const numFormas = dificultad === 1 ? 3 : dificultad === 2 ? 5 : 7

  // Colocar formas en posiciones aleatorias
  const posiciones: Array<{ forma: string; fila: number; col: number }> = []
  const ocupadas = new Set<string>()

  for (let i = 0; i < numFormas; i++) {
    let fila: number, col: number
    do {
      fila = rnd(1, gridSize)
      col = rnd(0, gridSize - 1)
    } while (ocupadas.has(`${fila},${col}`))
    ocupadas.add(`${fila},${col}`)
    posiciones.push({ forma: FORMAS[i % FORMAS.length], fila, col })
  }

  // Elegir una forma para preguntar
  const target = pick(posiciones)
  const coordCorrecta = `${COL_LABELS[target.col]}${target.fila}`

  // Descripción de la cuadrícula
  const gridDesc = posiciones
    .map((p) => `${p.forma} en ${COL_LABELS[p.col]}${p.fila}`)
    .join(', ')

  // Distractores: coordenadas cercanas pero incorrectas
  const distCoords: string[] = []
  const candidatos = [
    `${COL_LABELS[Math.min(target.col + 1, gridSize - 1)]}${target.fila}`,
    `${COL_LABELS[Math.max(target.col - 1, 0)]}${target.fila}`,
    `${COL_LABELS[target.col]}${Math.min(target.fila + 1, gridSize)}`,
    `${COL_LABELS[target.col]}${Math.max(target.fila - 1, 1)}`,
    `${COL_LABELS[rnd(0, gridSize - 1)]}${rnd(1, gridSize)}`,
  ]
  for (const c of candidatos) {
    if (c !== coordCorrecta && !distCoords.includes(c)) distCoords.push(c)
    if (distCoords.length >= 3) break
  }
  while (distCoords.length < 3) {
    const c = `${COL_LABELS[rnd(0, gridSize - 1)]}${rnd(1, gridSize)}`
    if (c !== coordCorrecta && !distCoords.includes(c)) distCoords.push(c)
  }

  const { opciones, correcta } = shuffleOptions(coordCorrecta, distCoords as [string, string, string])

  return {
    id: randomUUID(),
    categoria: 'espacial',
    subtipo: 'coordenadas',
    enunciado:
      `En una cuadrícula ${gridSize}×${gridSize} (columnas ${COL_LABELS.slice(0, gridSize).join(',')}, filas 1-${gridSize}), ` +
      `se colocan: ${gridDesc}. ¿En qué coordenada está ${target.forma}?`,
    opciones,
    correcta,
    explicacion:
      `${target.forma} está en la columna ${COL_LABELS[target.col]} y fila ${target.fila}, ` +
      `es decir, coordenada ${coordCorrecta}.`,
    dificultad,
  }
}

/**
 * Secuencia espacial: una forma se mueve por una rejilla siguiendo un patrón.
 * ¿Cuál será su próxima posición?
 */
function generateSecuenciaEspacial(dificultad: Dificultad): PsicotecnicoQuestion {
  const gridSize = dificultad === 1 ? 4 : dificultad === 2 ? 5 : 6

  // Patrón de movimiento (dx, dy) repetitivo
  type Mov = { dx: number; dy: number; nombre: string }
  const patrones: Mov[] = [
    { dx: 1, dy: 0, nombre: 'una columna a la derecha' },
    { dx: 0, dy: 1, nombre: 'una fila abajo' },
    { dx: 1, dy: 1, nombre: 'una columna derecha y una fila abajo (diagonal)' },
    { dx: 2, dy: 0, nombre: 'dos columnas a la derecha' },
    { dx: 1, dy: -1, nombre: 'una columna derecha y una fila arriba (diagonal)' },
    { dx: 0, dy: 2, nombre: 'dos filas abajo' },
  ]

  const patron = dificultad === 1
    ? pick(patrones.slice(0, 3))
    : dificultad === 2
      ? pick(patrones.slice(0, 5))
      : pick(patrones)

  // Generar secuencia de posiciones (con wrap-around)
  const numPasos = dificultad === 1 ? 3 : 4
  let col = rnd(0, gridSize - 1)
  let fila = rnd(1, gridSize)
  const posiciones: string[] = []

  for (let i = 0; i < numPasos; i++) {
    posiciones.push(`${COL_LABELS[col]}${fila}`)
    col = (col + patron.dx) % gridSize
    fila = ((fila - 1 + patron.dy) % gridSize) + 1
    if (fila < 1) fila += gridSize
  }

  // La siguiente posición es la respuesta
  const respuesta = `${COL_LABELS[col]}${fila}`

  // Distractores
  const distCoords: string[] = []
  const movErroneos = [
    `${COL_LABELS[(col + 1) % gridSize]}${fila}`,
    `${COL_LABELS[col]}${((fila) % gridSize) + 1}`,
    `${COL_LABELS[(col + patron.dx) % gridSize]}${((fila - 1 + patron.dy) % gridSize) + 1}`,
    `${COL_LABELS[Math.abs(col - 1) % gridSize]}${fila}`,
  ]
  for (const c of movErroneos) {
    if (c !== respuesta && !distCoords.includes(c)) distCoords.push(c)
    if (distCoords.length >= 3) break
  }
  while (distCoords.length < 3) {
    const c = `${COL_LABELS[rnd(0, gridSize - 1)]}${rnd(1, gridSize)}`
    if (c !== respuesta && !distCoords.includes(c)) distCoords.push(c)
  }

  const { opciones, correcta } = shuffleOptions(respuesta, distCoords as [string, string, string])

  return {
    id: randomUUID(),
    categoria: 'espacial',
    subtipo: 'secuencia_espacial',
    enunciado:
      `En una rejilla ${gridSize}×${gridSize}, una forma se mueve siguiendo un patrón: ` +
      `${posiciones.join(' → ')} → ?. ¿Cuál es la siguiente posición?`,
    opciones,
    correcta,
    explicacion:
      `El patrón de movimiento es ${patron.nombre}. ` +
      `Desde ${posiciones[posiciones.length - 1]}, el siguiente paso es ${respuesta}.`,
    dificultad,
  }
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

const SUBTIPOS_ESPACIAL = [
  generateRotacionMental,
  generateEspejo,
  generateCoordenadas,
  generateSecuenciaEspacial,
] as const

/**
 * Genera N preguntas espaciales con subtipo aleatorio.
 */
export function generateSpatial(
  count: number,
  dificultad: Dificultad
): PsicotecnicoQuestion[] {
  return Array.from({ length: count }, () => pick(SUBTIPOS_ESPACIAL)(dificultad))
}

export { generateRotacionMental, generateEspejo, generateCoordenadas, generateSecuenciaEspacial }
