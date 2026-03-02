/**
 * tests/unit/build-radar-tribunal.test.ts — OPTEK §2.14.11
 *
 * Tests unitarios de la lógica central del script build-radar-tribunal.
 *
 * Testea las funciones puras sin tocar Supabase:
 *   1. extractCitations + resolveLeyCodigo → citas en enunciados de examen
 *   2. Lógica de acumulación de frecuencias (contador + set de años)
 *   3. Cálculo de pct_total correcto
 *   4. Idempotencia: mismas entradas → mismo resultado
 */

import { describe, it, expect } from 'vitest'
import { extractCitations } from '@/lib/ai/verification'
import { CITATION_ALIASES } from '@/lib/ai/citation-aliases'

// ─── Helper: simula la lógica de resolveLeyCodigo del script ─────────────────

function resolveLeyCodigo(rawLey: string): string | null {
  const lower = rawLey.toLowerCase().trim()
  if (CITATION_ALIASES[lower]) return CITATION_ALIASES[lower]
  for (const [alias, codigo] of Object.entries(CITATION_ALIASES)) {
    if (lower.includes(alias)) return codigo
  }
  return null
}

// ─── Helper: simula el pipeline de frecuencia del script ──────────────────────

interface Acumulador {
  count: number
  anios: Set<number>
}

interface PreguntaFixture {
  enunciado: string
  anio: number
}

interface LegIndexEntry {
  id: string
  ley_nombre: string  // ley_codigo (e.g. "LPAC")
  articulo_numero: string
}

function buildLegIndex(entries: LegIndexEntry[]): Map<string, string> {
  const index = new Map<string, string>()
  for (const row of entries) {
    const key = `${row.ley_nombre}:${row.articulo_numero.trim()}`
    index.set(key, row.id)
    const numeroBase = row.articulo_numero.split('.')[0].trim()
    const keyBase = `${row.ley_nombre}:${numeroBase}`
    if (!index.has(keyBase)) index.set(keyBase, row.id)
  }
  return index
}

function computeFrecuencias(
  preguntas: PreguntaFixture[],
  legIndex: Map<string, string>
): Map<string, Acumulador> {
  const frecuencias = new Map<string, Acumulador>()

  for (const pregunta of preguntas) {
    const citas = extractCitations(pregunta.enunciado)
    for (const cita of citas) {
      const leyCodigo = resolveLeyCodigo(cita.ley)
      if (!leyCodigo) continue

      const artNumero = cita.articulo.replace(/\s+/g, '').trim()
      const key = `${leyCodigo}:${artNumero}`
      const keyBase = `${leyCodigo}:${artNumero.split('.')[0]}`

      const legislacionId = legIndex.get(key) ?? legIndex.get(keyBase)
      if (!legislacionId) continue

      if (!frecuencias.has(legislacionId)) {
        frecuencias.set(legislacionId, { count: 0, anios: new Set() })
      }
      const acc = frecuencias.get(legislacionId)!
      acc.count++
      acc.anios.add(pregunta.anio)
    }
  }

  return frecuencias
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const LEG_INDEX_ENTRIES: LegIndexEntry[] = [
  { id: 'leg-lpac-21', ley_nombre: 'LPAC', articulo_numero: '21' },
  { id: 'leg-lpac-23', ley_nombre: 'LPAC', articulo_numero: '23' },
  { id: 'leg-ce-14',   ley_nombre: 'CE',   articulo_numero: '14' },
  { id: 'leg-trebep-10', ley_nombre: 'TREBEP', articulo_numero: '10' },
]

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('build-radar-tribunal — resolveLeyCodigo', () => {
  it('resuelve LPAC desde alias directo', () => {
    expect(resolveLeyCodigo('ley 39/2015')).toBe('LPAC')
  })

  it('resuelve CE desde alias directo', () => {
    expect(resolveLeyCodigo('constitución española')).toBe('CE')
  })

  it('resuelve TREBEP desde substring', () => {
    expect(resolveLeyCodigo('Real Decreto Legislativo 5/2015 trebep')).not.toBeNull()
  })

  it('retorna null para ley desconocida', () => {
    expect(resolveLeyCodigo('Ley Orgánica 99/2099 de ficción')).toBeNull()
  })

  it('es case-insensitive', () => {
    expect(resolveLeyCodigo('LEY 39/2015')).toBe(resolveLeyCodigo('ley 39/2015'))
  })
})

describe('build-radar-tribunal — computeFrecuencias con fixture', () => {
  const legIndex = buildLegIndex(LEG_INDEX_ENTRIES)

  it('acumula 1 aparición correctamente para Art. 21 LPAC', () => {
    const preguntas: PreguntaFixture[] = [
      { enunciado: 'Según el artículo 21 de la Ley 39/2015, el plazo máximo...', anio: 2022 },
    ]
    const result = computeFrecuencias(preguntas, legIndex)
    const acc = result.get('leg-lpac-21')
    expect(acc).toBeDefined()
    expect(acc!.count).toBe(1)
    expect([...acc!.anios]).toEqual([2022])
  })

  it('acumula múltiples apariciones en distintos años', () => {
    const preguntas: PreguntaFixture[] = [
      { enunciado: 'Conforme al art. 21 LPAC el órgano...', anio: 2019 },
      { enunciado: 'El artículo 21 de la Ley 39/2015 establece...', anio: 2022 },
      { enunciado: 'El artículo 21 LPAC obliga al órgano...', anio: 2024 },
    ]
    const result = computeFrecuencias(preguntas, legIndex)
    const acc = result.get('leg-lpac-21')
    expect(acc).toBeDefined()
    expect(acc!.count).toBe(3)
    expect([...acc!.anios].sort()).toEqual([2019, 2022, 2024])
  })

  it('no duplica el año si el mismo artículo aparece 2 veces en el mismo año', () => {
    const preguntas: PreguntaFixture[] = [
      { enunciado: 'El artículo 21 de la Ley 39/2015 en el primer caso...', anio: 2022 },
      { enunciado: 'Según el art. 21 LPAC en el segundo caso...', anio: 2022 },
    ]
    const result = computeFrecuencias(preguntas, legIndex)
    const acc = result.get('leg-lpac-21')
    expect(acc!.count).toBe(2)          // 2 apariciones
    expect([...acc!.anios]).toEqual([2022]) // solo 1 año
  })

  it('procesa múltiples artículos distintos en distintas preguntas del mismo examen', () => {
    const preguntas: PreguntaFixture[] = [
      {
        enunciado: 'El artículo 14 de la Constitución Española garantiza la igualdad...',
        anio: 2022,
      },
      {
        enunciado: 'Según el art. 23 de la Ley 39/2015, la instrucción del procedimiento...',
        anio: 2022,
      },
    ]
    const result = computeFrecuencias(preguntas, legIndex)
    // CE art.14
    expect(result.get('leg-ce-14')).toBeDefined()
    // LPAC art.23
    expect(result.get('leg-lpac-23')).toBeDefined()
  })

  it('ignora citas de leyes no indexadas en legislacion', () => {
    const preguntas: PreguntaFixture[] = [
      { enunciado: 'El artículo 99 de la Ley 99/2099 establece...', anio: 2022 },
    ]
    const result = computeFrecuencias(preguntas, legIndex)
    expect(result.size).toBe(0)
  })

  it('calcula pct_total correctamente', () => {
    const preguntas: PreguntaFixture[] = [
      { enunciado: 'El artículo 21 LPAC establece el plazo...', anio: 2022 },
      { enunciado: 'La Constitución regula en su artículo 14...', anio: 2022 },
      { enunciado: 'El artículo 21 de la Ley 39/2015 obliga...', anio: 2022 },
      { enunciado: 'Una pregunta sin cita legal reconocible.', anio: 2022 },
    ]
    const totalPreguntas = preguntas.length
    const result = computeFrecuencias(preguntas, legIndex)

    const lpac21 = result.get('leg-lpac-21')!
    const pct = parseFloat(((lpac21.count / totalPreguntas) * 100).toFixed(2))
    expect(pct).toBe(50.00) // 2 de 4 preguntas
  })

  it('es idempotente — dos ejecuciones con los mismos datos producen el mismo resultado', () => {
    const preguntas: PreguntaFixture[] = [
      { enunciado: 'El artículo 21 LPAC establece...', anio: 2022 },
      { enunciado: 'El art. 14 CE garantiza...', anio: 2019 },
    ]
    const result1 = computeFrecuencias(preguntas, legIndex)
    const result2 = computeFrecuencias(preguntas, legIndex)

    for (const [id, acc1] of result1) {
      const acc2 = result2.get(id)!
      expect(acc2.count).toBe(acc1.count)
      expect([...acc2.anios].sort()).toEqual([...acc1.anios].sort())
    }
  })
})

describe('build-radar-tribunal — buildLegIndex', () => {
  it('indexa con clave "CODIGO:numero" exacta', () => {
    const idx = buildLegIndex([{ id: 'x', ley_nombre: 'LPAC', articulo_numero: '21' }])
    expect(idx.get('LPAC:21')).toBe('x')
  })

  it('también indexa el número base para artículos con apartado (ej: "21.3")', () => {
    const idx = buildLegIndex([{ id: 'y', ley_nombre: 'LPAC', articulo_numero: '21.3' }])
    expect(idx.get('LPAC:21.3')).toBe('y')
    expect(idx.get('LPAC:21')).toBe('y') // fallback base
  })

  it('no sobreescribe la clave base si ya existe un artículo base', () => {
    const idx = buildLegIndex([
      { id: 'art21', ley_nombre: 'LPAC', articulo_numero: '21' },
      { id: 'art21bis', ley_nombre: 'LPAC', articulo_numero: '21.3' },
    ])
    // El primero llegó como "21" → base es "21" → no se sobreescribe
    expect(idx.get('LPAC:21')).toBe('art21')
    expect(idx.get('LPAC:21.3')).toBe('art21bis')
  })
})
