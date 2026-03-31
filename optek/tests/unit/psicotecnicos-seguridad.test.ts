/**
 * tests/unit/psicotecnicos-seguridad.test.ts
 *
 * Tests unitarios de los 3 módulos nuevos de psicotécnicos para seguridad:
 *   - Espacial (rotación, espejo, coordenadas, secuencia)
 *   - Lógica deductiva (silogismo, condicional, conjuntos, negación)
 *   - Percepción (conteo, diferencias, patrón visual)
 *
 * + Test de distribución SEGURIDAD_DISTRIBUCION via generatePsicotecnicos.
 */

import { describe, it, expect } from 'vitest'
import {
  generateRotacionMental,
  generateEspejo,
  generateCoordenadas,
  generateSecuenciaEspacial,
} from '@/lib/psicotecnicos/spatial'
import {
  generateSilogismo,
  generateCondicional,
  generateConjuntos,
  generateNegacion,
} from '@/lib/psicotecnicos/logic'
import {
  generateConteoSimbolos,
  generateDiferencias,
  generatePatronVisual,
} from '@/lib/psicotecnicos/perception'
import { generatePsicotecnicos, getDistribucionPsicotecnicos } from '@/lib/psicotecnicos/index'
import type { PsicotecnicoQuestion, Dificultad } from '@/lib/psicotecnicos/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFICULTADES: Dificultad[] = [1, 2, 3]

function assertPreguntaValida(q: PsicotecnicoQuestion): void {
  expect(q.id).toBeTruthy()
  expect(q.enunciado.length).toBeGreaterThan(5)
  expect(q.opciones.length).toBeGreaterThanOrEqual(3)
  expect(q.opciones.length).toBeLessThanOrEqual(4)
  expect([0, 1, 2, 3]).toContain(q.correcta)
  expect(q.explicacion.length).toBeGreaterThan(5)
  expect(q.dificultad).toBeOneOf([1, 2, 3])
  // Todas las opciones deben ser distintas
  const unique = new Set(q.opciones)
  expect(unique.size).toBe(q.opciones.length)
}

// ─── Espacial ─────────────────────────────────────────────────────────────────

describe('Espacial — rotacion_mental', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generateRotacionMental(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('espacial')
      expect(q.subtipo).toBe('rotacion_mental')
      expect(q.enunciado).toContain('rotamos')
    }
  })
})

describe('Espacial — espejo', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generateEspejo(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('espacial')
      expect(q.subtipo).toBe('espejo')
      expect(q.enunciado).toContain('reflejo')
    }
  })
})

describe('Espacial — coordenadas', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generateCoordenadas(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('espacial')
      expect(q.subtipo).toBe('coordenadas')
      expect(q.enunciado).toContain('cuadrícula')
    }
  })
})

describe('Espacial — secuencia_espacial', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generateSecuenciaEspacial(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('espacial')
      expect(q.subtipo).toBe('secuencia_espacial')
      expect(q.enunciado).toContain('rejilla')
    }
  })
})

// ─── Lógica deductiva ─────────────────────────────────────────────────────────

describe('Lógica — silogismo', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generateSilogismo(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('logica')
      expect(q.subtipo).toBe('silogismo')
      expect(q.enunciado).toContain('Premisa')
    }
  })

  it('dificultad 1 (Barbara): la respuesta correcta confirma la conclusión', () => {
    for (let i = 0; i < 5; i++) {
      const q = generateSilogismo(1)
      const respuesta = q.opciones[q.correcta]
      // En Barbara, la conclusión es positiva (el ejemplo cumple la propiedad)
      expect(respuesta).not.toContain('No se puede')
      expect(respuesta).not.toContain('no ')
    }
  })

  it('dificultad 2 (Algunos): respuesta correcta indica incertidumbre', () => {
    for (let i = 0; i < 5; i++) {
      const q = generateSilogismo(2)
      const respuesta = q.opciones[q.correcta]
      expect(respuesta).toContain('No se puede concluir')
    }
  })
})

describe('Lógica — condicional', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generateCondicional(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('logica')
      expect(q.subtipo).toBe('condicional')
    }
  })

  it('dificultad 3 (falacia): respuesta indica que no se puede concluir', () => {
    for (let i = 0; i < 5; i++) {
      const q = generateCondicional(3)
      const respuesta = q.opciones[q.correcta]
      expect(respuesta).toContain('No se puede concluir')
    }
  })
})

describe('Lógica — conjuntos', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generateConjuntos(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('logica')
      expect(q.subtipo).toBe('conjuntos')
      expect(q.enunciado).toContain('grupo de')
    }
  })

  it('la respuesta correcta es un número válido', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateConjuntos(2)
      const resp = parseInt(q.opciones[q.correcta]!, 10)
      expect(resp).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('Lógica — negacion', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 5; i++) {
      const q = generateNegacion(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('logica')
      expect(q.subtipo).toBe('negacion')
      expect(q.enunciado).toContain('negación lógica')
    }
  })
})

// ─── Percepción ───────────────────────────────────────────────────────────────

describe('Percepción — conteo_simbolos', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generateConteoSimbolos(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('percepcion')
      expect(q.subtipo).toBe('conteo_simbolos')
      expect(q.enunciado).toContain('veces aparece')
    }
  })

  it('la respuesta correcta coincide con conteo real', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateConteoSimbolos(1)
      // Extraer el símbolo objetivo del enunciado
      const matchSimbolo = q.enunciado.match(/símbolo (.+?) en/)
      if (!matchSimbolo) continue
      const simbolo = matchSimbolo[1]
      // Extraer la cadena (todo después del doble salto de línea)
      const cadenaMatch = q.enunciado.split('\n\n')[1]
      if (!cadenaMatch) continue
      // Contar ocurrencias reales (quitar espacios)
      const sinEspacios = cadenaMatch.replace(/ /g, '')
      const conteoReal = [...sinEspacios].filter((c) => c === simbolo).length
      const respuesta = parseInt(q.opciones[q.correcta]!, 10)
      expect(respuesta).toBe(conteoReal)
    }
  })
})

describe('Percepción — diferencias', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generateDiferencias(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('percepcion')
      expect(q.subtipo).toBe('diferencias')
      expect(q.enunciado).toContain('diferente')
    }
  })
})

describe('Percepción — patron_visual', () => {
  it.each(DIFICULTADES)('genera pregunta válida (dif %i)', (d) => {
    for (let i = 0; i < 10; i++) {
      const q = generatePatronVisual(d)
      assertPreguntaValida(q)
      expect(q.categoria).toBe('percepcion')
      expect(q.subtipo).toBe('patron_visual')
      expect(q.enunciado).toContain('siguiente grupo')
    }
  })
})

// ─── Distribución SEGURIDAD ───────────────────────────────────────────────────

describe('getDistribucionPsicotecnicos — seguridad', () => {
  it('devuelve SEGURIDAD_DISTRIBUCION para slugs de seguridad', () => {
    for (const slug of ['ertzaintza', 'guardia-civil', 'policia-nacional']) {
      const dist = getDistribucionPsicotecnicos(slug)
      expect(dist).toHaveProperty('espacial')
      expect(dist).toHaveProperty('logica')
      expect(dist).toHaveProperty('percepcion')
      expect(dist.espacial).toBe(0.20)
      expect(dist.logica).toBe(0.10)
      expect(dist.percepcion).toBe(0.15)
      // Suma = 1.0
      const total = Object.values(dist).reduce((a, b) => a + b, 0)
      expect(total).toBeCloseTo(1.0, 5)
    }
  })

  it('no devuelve seguridad para otros slugs', () => {
    const dist = getDistribucionPsicotecnicos('aux-admin-estado')
    expect(dist).not.toHaveProperty('espacial')
  })
})

describe('generatePsicotecnicos — batch seguridad (30 preguntas)', () => {
  it('genera 30 preguntas con distribución de seguridad', () => {
    const dist = getDistribucionPsicotecnicos('ertzaintza')
    const preguntas = generatePsicotecnicos(30, 2, dist)

    expect(preguntas).toHaveLength(30)

    // Verificar que hay categorías de seguridad presentes
    const categorias = new Set(preguntas.map((p) => p.categoria))
    expect(categorias.has('espacial')).toBe(true)
    expect(categorias.has('percepcion')).toBe(true)

    // Todas las preguntas deben ser válidas
    for (const q of preguntas) {
      assertPreguntaValida(q)
    }

    // Verificar IDs únicos
    const ids = new Set(preguntas.map((p) => p.id))
    expect(ids.size).toBe(30)
  })

  it('genera 30 preguntas sin duplicados', () => {
    const dist = getDistribucionPsicotecnicos('guardia-civil')
    const preguntas = generatePsicotecnicos(30, 2, dist)
    const enunciados = new Set(preguntas.map((p) => p.enunciado))
    expect(enunciados.size).toBe(30)
  })
})
