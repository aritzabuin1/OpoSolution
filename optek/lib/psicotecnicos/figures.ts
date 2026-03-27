/**
 * lib/psicotecnicos/figures.ts
 *
 * Generador de series de figuras/patrones para psicotécnicos de Correos.
 * Usa símbolos Unicode para representar patrones visuales sin necesidad de imágenes.
 *
 * Tipos:
 *   - patron_simbolos: secuencia de símbolos con un patrón lógico (rotación, alternancia)
 *   - patron_secuencia: secuencia numérica o alfanumérica con patrón visual
 *
 * Estos replican el tipo de razonamiento de las "series de figuras" del examen real.
 */

import { randomUUID } from 'node:crypto'
import { rnd, shuffleOptions } from './numeric'
import type { Dificultad, PsicotecnicoQuestion } from './types'

// ─── Patrones predefinidos ──────────────────────────────────────────────────

interface PatronEntry {
  secuencia: string
  pregunta: string
  correcta: string
  distractores: [string, string, string]
  explicacion: string
  subtipo: 'patron_simbolos' | 'patron_secuencia'
  dificultad: 1 | 2 | 3
}

const BANCO_PATRONES: PatronEntry[] = [
  // ── Dificultad 1: patrones simples ──────────────────────────────────────
  {
    secuencia: '▲  ■  ●  ▲  ■  ●  ▲  ■  ?',
    pregunta: '¿Qué figura completa la secuencia?',
    correcta: '●', distractores: ['▲', '■', '◆'],
    explicacion: 'El patrón se repite cada 3 figuras: ▲ ■ ● (ciclo de 3).',
    subtipo: 'patron_simbolos', dificultad: 1,
  },
  {
    secuencia: '→  ↑  ←  ↓  →  ↑  ←  ?',
    pregunta: '¿Qué dirección sigue en la secuencia?',
    correcta: '↓', distractores: ['→', '↑', '←'],
    explicacion: 'La flecha gira 90° en sentido horario: → ↑ ← ↓ (ciclo de 4).',
    subtipo: 'patron_simbolos', dificultad: 1,
  },
  {
    secuencia: '★  ☆  ★  ★  ☆  ★  ★  ★  ?',
    pregunta: '¿Qué símbolo continúa la secuencia?',
    correcta: '☆', distractores: ['★', '●', '◆'],
    explicacion: 'El patrón es: 1 estrella llena, 1 vacía, 2 llenas, 1 vacía, 3 llenas, 1 vacía... Después de 3 estrellas llenas viene 1 vacía.',
    subtipo: 'patron_simbolos', dificultad: 1,
  },
  {
    secuencia: 'A1  B2  C3  D4  E5  ?',
    pregunta: '¿Qué elemento sigue en la secuencia?',
    correcta: 'F6', distractores: ['E6', 'F5', 'G7'],
    explicacion: 'Letra avanza +1 (A→B→C...) y número avanza +1 (1→2→3...).',
    subtipo: 'patron_secuencia', dificultad: 1,
  },
  // ── Dificultad 2: patrones intermedios ──────────────────────────────────
  {
    secuencia: '◆  ◇  ◆◆  ◇◇  ◆◆◆  ?',
    pregunta: '¿Qué elemento sigue en la secuencia?',
    correcta: '◇◇◇', distractores: ['◆◆◆', '◇◇', '◆◆◆◆'],
    explicacion: 'Alterna lleno/vacío y cada vez hay uno más: 1 lleno, 1 vacío, 2 llenos, 2 vacíos, 3 llenos → 3 vacíos.',
    subtipo: 'patron_simbolos', dificultad: 2,
  },
  {
    secuencia: '2  6  18  54  ?',
    pregunta: '¿Qué número sigue en la secuencia?',
    correcta: '162', distractores: ['108', '150', '216'],
    explicacion: 'Cada número se multiplica por 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162.',
    subtipo: 'patron_secuencia', dificultad: 2,
  },
  {
    secuencia: '●○  ○●  ●○●  ○●○  ●○●○  ?',
    pregunta: '¿Qué grupo sigue en la secuencia?',
    correcta: '○●○●', distractores: ['●○●○●', '○●○', '●●○○'],
    explicacion: 'El grupo alterna inicio con ● u ○, y crece de 2→2→3→3→4→4 elementos.',
    subtipo: 'patron_simbolos', dificultad: 2,
  },
  {
    secuencia: 'Z1  Y2  X4  W8  ?',
    pregunta: '¿Qué elemento sigue en la secuencia?',
    correcta: 'V16', distractores: ['V10', 'U16', 'V12'],
    explicacion: 'Las letras retroceden -1 (Z→Y→X→W→V) y los números se duplican (1→2→4→8→16).',
    subtipo: 'patron_secuencia', dificultad: 2,
  },
  // ── Dificultad 3: patrones complejos ────────────────────────────────────
  {
    secuencia: '▲▽  ▽▲▽  ▲▽▲▽  ?',
    pregunta: '¿Qué grupo sigue en la secuencia?',
    correcta: '▽▲▽▲▽', distractores: ['▲▽▲▽▲', '▽▲▽▲', '▲▽▲▽▲▽'],
    explicacion: 'Cada grupo tiene 1 elemento más que el anterior (2→3→4→5). Cada grupo empieza con el símbolo opuesto al anterior y alterna.',
    subtipo: 'patron_simbolos', dificultad: 3,
  },
  {
    secuencia: '1  1  2  3  5  8  13  ?',
    pregunta: '¿Qué número sigue en la secuencia?',
    correcta: '21', distractores: ['18', '20', '26'],
    explicacion: 'Es la secuencia de Fibonacci: cada número es la suma de los dos anteriores (8+13=21).',
    subtipo: 'patron_secuencia', dificultad: 3,
  },
  {
    secuencia: '■□□  □■□  □□■  ■□□  □■□  ?',
    pregunta: '¿Qué grupo sigue en la secuencia?',
    correcta: '□□■', distractores: ['■□□', '□■□', '■■□'],
    explicacion: 'El cuadrado negro se desplaza una posición a la derecha en cada paso (izquierda→centro→derecha) y luego vuelve a empezar.',
    subtipo: 'patron_simbolos', dificultad: 3,
  },
  {
    secuencia: '3  5  9  15  23  ?',
    pregunta: '¿Qué número sigue en la secuencia?',
    correcta: '33', distractores: ['31', '35', '29'],
    explicacion: 'Las diferencias son +2, +4, +6, +8, +10... (incrementos pares). Siguiente: 23+10=33.',
    subtipo: 'patron_secuencia', dificultad: 3,
  },
]

// ─── Generador ──────────────────────────────────────────────────────────────

export function generateFigures(count: number, dificultad: Dificultad): PsicotecnicoQuestion[] {
  const available = BANCO_PATRONES.filter(e =>
    dificultad === 1 ? e.dificultad <= 2 :
    dificultad === 2 ? true :
    e.dificultad >= 2
  )

  if (available.length === 0) return []

  const result: PsicotecnicoQuestion[] = []
  const used = new Set<number>()

  while (result.length < count) {
    if (used.size >= available.length) used.clear()
    let idx: number
    do { idx = rnd(0, available.length - 1) } while (used.has(idx))
    used.add(idx)

    const p = available[idx]
    const { opciones, correcta } = shuffleOptions(p.correcta, p.distractores)

    result.push({
      id: randomUUID(),
      categoria: 'figuras',
      subtipo: p.subtipo,
      enunciado: `🔷 Observa la secuencia:\n\n${p.secuencia}\n\n${p.pregunta}`,
      opciones,
      correcta,
      explicacion: p.explicacion,
      dificultad,
    })
  }

  return result.slice(0, count)
}
