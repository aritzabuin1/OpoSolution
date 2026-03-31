/**
 * lib/psicotecnicos/perception.ts
 *
 * Generador determinista de problemas de percepción y atención.
 * Usado en psicotécnicos de oposiciones de seguridad (Ertzaintza, GC, PN).
 *
 * Tipos implementados:
 *   - conteo_simbolos: contar ocurrencias de un símbolo en una cadena
 *   - diferencias: identificar el elemento diferente en una serie
 *   - patron_visual: completar un patrón visual de símbolos
 *
 * 100% determinista. Sin IA, sin BD.
 */

import { randomUUID } from 'node:crypto'
import { rnd, pick, shuffleOptions, makeDistractors } from './numeric'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Bancos de símbolos ───────────────────────────────────────────────────────

const SIMBOLOS_BASICOS = ['●', '○', '■', '□', '▲', '△', '★', '☆', '◆', '◇'] as const
const SIMBOLOS_EXTRA = ['♠', '♣', '♥', '♦', '⊕', '⊗', '⊙', '⊘', '⊞', '⊟'] as const
const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const DIGITOS = '0123456789'.split('')

// ─── Generadores por tipo ─────────────────────────────────────────────────────

/**
 * Conteo de símbolos: dada una cadena con múltiples símbolos mezclados,
 * contar cuántas veces aparece un símbolo específico.
 *
 * Ejercita atención selectiva y velocidad de procesamiento visual.
 */
function generateConteoSimbolos(dificultad: Dificultad): PsicotecnicoQuestion {
  const longitud = dificultad === 1 ? 20 : dificultad === 2 ? 30 : 40
  const numSimbolos = dificultad === 1 ? 4 : dificultad === 2 ? 6 : 8
  const pool = [...SIMBOLOS_BASICOS.slice(0, numSimbolos)]

  // Generar cadena aleatoria
  const cadena: string[] = Array.from({ length: longitud }, () => pick(pool))

  // Elegir símbolo objetivo
  const objetivo = pick(pool)
  const count = cadena.filter((s) => s === objetivo).length

  // Si count es 0, forzar al menos 2 apariciones
  if (count < 2) {
    const indices = [rnd(0, longitud - 1), rnd(0, longitud - 1)]
    for (const idx of indices) cadena[idx] = objetivo
  }
  const finalCount = cadena.filter((s) => s === objetivo).length

  // Agrupar en bloques para legibilidad
  const bloqueSize = 5
  const bloques: string[] = []
  for (let i = 0; i < cadena.length; i += bloqueSize) {
    bloques.push(cadena.slice(i, i + bloqueSize).join(''))
  }
  const display = bloques.join(' ')

  const distractors = makeDistractors(finalCount, [
    finalCount + 1,
    finalCount - 1,
    finalCount + 2,
  ])

  const { opciones, correcta } = shuffleOptions(String(finalCount), distractors)

  return {
    id: randomUUID(),
    categoria: 'percepcion',
    subtipo: 'conteo_simbolos',
    enunciado: `¿Cuántas veces aparece el símbolo ${objetivo} en la siguiente cadena?\n\n${display}`,
    opciones,
    correcta,
    explicacion: `Contando cada aparición de ${objetivo}: aparece ${finalCount} veces en la cadena de ${longitud} símbolos.`,
    dificultad,
  }
}

/**
 * Diferencias: se muestran N elementos parecidos, uno difiere en un detalle.
 * Identificar cuál es el diferente.
 *
 * Variantes:
 *   - Secuencia de símbolos donde uno tiene un símbolo cambiado
 *   - Secuencia alfanumérica con un carácter invertido
 */
function generateDiferencias(dificultad: Dificultad): PsicotecnicoQuestion {
  const numElementos = dificultad === 1 ? 4 : dificultad === 2 ? 5 : 6
  const largoElemento = dificultad === 1 ? 4 : dificultad === 2 ? 5 : 6

  // Generar el patrón base (mezcla de letras y dígitos)
  const pool = [...LETRAS.slice(0, 10), ...DIGITOS.slice(0, 5)]
  const base = Array.from({ length: largoElemento }, () => pick(pool))
  const baseStr = base.join('')

  // Crear N copias, una con un cambio sutil
  const posicionDiferente = rnd(0, numElementos - 1)
  const charCambiado = rnd(0, largoElemento - 1)

  const elementos: string[] = []
  for (let i = 0; i < numElementos; i++) {
    if (i === posicionDiferente) {
      const copia = [...base]
      // Cambiar un carácter por uno similar
      let nuevoChar: string
      do {
        nuevoChar = pick(pool)
      } while (nuevoChar === copia[charCambiado])
      copia[charCambiado] = nuevoChar
      elementos.push(copia.join(''))
    } else {
      elementos.push(baseStr)
    }
  }

  // Labels: A, B, C, D...
  const labels = elementos.map((e, i) => `${String.fromCharCode(65 + i)}) ${e}`)
  const correctLabel = String.fromCharCode(65 + posicionDiferente)

  // Distractores: otras letras
  const distLabels: string[] = []
  for (let i = 0; i < numElementos; i++) {
    const l = String.fromCharCode(65 + i)
    if (l !== correctLabel) distLabels.push(l)
  }
  // Tomar solo 3
  while (distLabels.length > 3) distLabels.pop()
  while (distLabels.length < 3) distLabels.push(String.fromCharCode(65 + numElementos))

  const { opciones, correcta } = shuffleOptions(correctLabel, distLabels as [string, string, string])

  return {
    id: randomUUID(),
    categoria: 'percepcion',
    subtipo: 'diferencias',
    enunciado:
      `Uno de estos elementos es diferente a los demás. ¿Cuál es?\n\n` +
      labels.join('  '),
    opciones,
    correcta,
    explicacion:
      `El elemento ${correctLabel} (${elementos[posicionDiferente]}) difiere del patrón ${baseStr}: ` +
      `en la posición ${charCambiado + 1}, tiene "${elementos[posicionDiferente][charCambiado]}" ` +
      `en lugar de "${base[charCambiado]}".`,
    dificultad,
  }
}

/**
 * Patrón visual: secuencia de símbolos con un patrón de repetición.
 * ¿Cuál es el siguiente grupo de símbolos?
 *
 * Patrones: repetición cíclica, alternancia, progresión.
 */
function generatePatronVisual(dificultad: Dificultad): PsicotecnicoQuestion {
  const pool = dificultad === 1
    ? SIMBOLOS_BASICOS.slice(0, 3)
    : dificultad === 2
      ? SIMBOLOS_BASICOS.slice(0, 5)
      : [...SIMBOLOS_BASICOS.slice(0, 4), ...SIMBOLOS_EXTRA.slice(0, 2)]

  type PatronDef = {
    name: string
    gen: () => { secuencia: string[][]; respuesta: string[]; explicacion: string }
  }

  const patrones: PatronDef[] = [
    // Repetición cíclica: ABC ABC ABC → ?
    {
      name: 'cíclico',
      gen: () => {
        const cicloLen = dificultad === 1 ? 2 : dificultad === 2 ? 3 : 4
        const ciclo = Array.from({ length: cicloLen }, () => pick(pool))
        const repeticiones = dificultad === 1 ? 3 : 4
        const secuencia = Array.from({ length: repeticiones }, () => [...ciclo])
        return {
          secuencia,
          respuesta: [...ciclo],
          explicacion: `Patrón cíclico: el grupo [${ciclo.join(' ')}] se repite.`,
        }
      },
    },
    // Rotación: cada grupo rota 1 posición → siguiente rotación
    {
      name: 'rotación',
      gen: () => {
        const len = dificultad === 1 ? 3 : 4
        const base = Array.from({ length: len }, () => pick(pool))
        const secuencia: string[][] = [base]
        for (let i = 1; i <= 3; i++) {
          const prev = secuencia[i - 1]
          secuencia.push([prev[prev.length - 1], ...prev.slice(0, prev.length - 1)])
        }
        const last = secuencia[secuencia.length - 1]
        const respuesta = [last[last.length - 1], ...last.slice(0, last.length - 1)]
        return {
          secuencia,
          respuesta,
          explicacion: `Patrón de rotación: en cada paso, el último símbolo pasa al principio.`,
        }
      },
    },
    // Acumulación: A, AB, ABC, ABCD → ?
    {
      name: 'acumulación',
      gen: () => {
        const totalLen = dificultad === 1 ? 4 : 5
        const simbolos = Array.from({ length: totalLen }, () => pick(pool))
        const secuencia = simbolos.map((_, i) => simbolos.slice(0, i + 1))
        const respuestaArr = [...simbolos]
        // El último grupo mostrado tiene totalLen-1 elementos, la respuesta tiene totalLen
        return {
          secuencia: secuencia.slice(0, totalLen - 1),
          respuesta: respuestaArr,
          explicacion: `Patrón acumulativo: cada grupo añade un símbolo más.`,
        }
      },
    },
  ]

  const patron = pick(patrones)
  const { secuencia, respuesta, explicacion } = patron.gen()

  const display = secuencia.map((g) => `[${g.join(' ')}]`).join('  ')
  const respuestaStr = respuesta.join(' ')

  // Distractores
  const distArr: string[] = []
  // Distractor 1: mezclar la respuesta
  const shuffled = [...respuesta]
  const i1 = rnd(0, shuffled.length - 1)
  const i2 = (i1 + 1) % shuffled.length
  ;[shuffled[i1], shuffled[i2]] = [shuffled[i2], shuffled[i1]]
  distArr.push(shuffled.join(' '))

  // Distractor 2: reemplazar un símbolo
  const replaced = [...respuesta]
  replaced[rnd(0, replaced.length - 1)] = pick(pool)
  distArr.push(replaced.join(' '))

  // Distractor 3: último grupo mostrado (repetir sin cambio)
  const lastShown = secuencia[secuencia.length - 1].join(' ')
  distArr.push(lastShown)

  // Deduplicar
  const uniqueDist = distArr.filter((d, idx, arr) => d !== respuestaStr && arr.indexOf(d) === idx)
  while (uniqueDist.length < 3) {
    const extra = Array.from({ length: respuesta.length }, () => pick(pool)).join(' ')
    if (extra !== respuestaStr && !uniqueDist.includes(extra)) uniqueDist.push(extra)
  }

  const { opciones, correcta } = shuffleOptions(respuestaStr, [
    uniqueDist[0],
    uniqueDist[1],
    uniqueDist[2],
  ])

  return {
    id: randomUUID(),
    categoria: 'percepcion',
    subtipo: 'patron_visual',
    enunciado: `¿Cuál es el siguiente grupo en esta secuencia?\n\n${display}  [?]`,
    opciones,
    correcta,
    explicacion,
    dificultad,
  }
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

const SUBTIPOS_PERCEPCION = [
  generateConteoSimbolos,
  generateDiferencias,
  generatePatronVisual,
] as const

/**
 * Genera N preguntas de percepción con subtipo aleatorio.
 */
export function generatePerception(
  count: number,
  dificultad: Dificultad
): PsicotecnicoQuestion[] {
  return Array.from({ length: count }, () => pick(SUBTIPOS_PERCEPCION)(dificultad))
}

export { generateConteoSimbolos, generateDiferencias, generatePatronVisual }
