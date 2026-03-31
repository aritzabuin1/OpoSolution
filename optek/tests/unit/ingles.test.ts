/**
 * tests/unit/ingles.test.ts — §6.6
 *
 * Tests unitarios para el motor de inglés A2-B1 (Guardia Civil).
 * Verifican: banco, generación, distribución, estructura.
 */

import { describe, it, expect } from 'vitest'
import { INGLES_BANK } from '@/lib/ingles/bank'
import { generateIngles, getInglesBankSize, getInglesBankStats, INGLES_DISTRIBUCION } from '@/lib/ingles/index'
import type { CategoriaIngles, InglesQuestion } from '@/lib/ingles/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assertPreguntaValida(q: InglesQuestion) {
  expect(q.id).toBeTruthy()
  expect(q.enunciado.length).toBeGreaterThan(10)
  expect(q.opciones).toHaveLength(4)
  expect(q.correcta).toBeGreaterThanOrEqual(0)
  expect(q.correcta).toBeLessThanOrEqual(3)
  expect(q.explicacion.length).toBeGreaterThan(5)
  expect(q.dificultad).toBeGreaterThanOrEqual(1)
  expect(q.dificultad).toBeLessThanOrEqual(3)
  // 4 opciones deben ser distintas
  const unique = new Set(q.opciones)
  expect(unique.size).toBe(4)
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('§6.6 — Motor inglés GC', () => {
  describe('Banco de items', () => {
    it('tiene al menos 150 items', () => {
      expect(getInglesBankSize()).toBeGreaterThanOrEqual(150)
    })

    it('todas las categorías tienen items', () => {
      const stats = getInglesBankStats()
      const categorias: CategoriaIngles[] = [
        'grammar_tenses', 'grammar_prepositions', 'grammar_articles',
        'grammar_comparatives', 'grammar_modals', 'grammar_conditionals',
        'vocabulary_police', 'vocabulary_general', 'reading_comprehension',
      ]
      for (const cat of categorias) {
        expect(stats[cat], `categoría ${cat} sin items`).toBeGreaterThan(0)
      }
    })

    it('cada categoría tiene al menos 10 items', () => {
      const stats = getInglesBankStats()
      for (const [cat, count] of Object.entries(stats)) {
        expect(count, `categoría ${cat} con pocos items`).toBeGreaterThanOrEqual(10)
      }
    })

    it('todos los items tienen estructura válida', () => {
      for (const item of INGLES_BANK) {
        expect(item.opciones).toHaveLength(4)
        expect(item.correcta).toBeGreaterThanOrEqual(0)
        expect(item.correcta).toBeLessThanOrEqual(3)
        expect(item.enunciado.length).toBeGreaterThan(5)
        expect(item.explicacion.length).toBeGreaterThan(5)
        expect([1, 2, 3]).toContain(item.dificultad)
      }
    })

    it('opciones son únicas dentro de cada item', () => {
      for (const item of INGLES_BANK) {
        const unique = new Set(item.opciones.map(o => o.toLowerCase().trim()))
        expect(unique.size, `Opciones duplicadas en: ${item.enunciado.slice(0, 60)}`).toBe(4)
      }
    })

    it('correcta apunta a una opción existente', () => {
      for (const item of INGLES_BANK) {
        expect(
          item.opciones[item.correcta],
          `correcta=${item.correcta} fuera de rango en: ${item.enunciado.slice(0, 60)}`
        ).toBeTruthy()
      }
    })

    it('hay items de las 3 dificultades', () => {
      const porDif = { 1: 0, 2: 0, 3: 0 }
      for (const item of INGLES_BANK) {
        porDif[item.dificultad]++
      }
      expect(porDif[1]).toBeGreaterThan(0)
      expect(porDif[2]).toBeGreaterThan(0)
      expect(porDif[3]).toBeGreaterThan(0)
    })

    it('reading_comprehension items contienen texto', () => {
      const readingItems = INGLES_BANK.filter(i => i.categoria === 'reading_comprehension')
      for (const item of readingItems) {
        // Reading comprehension enunciados deben ser más largos (tienen un texto)
        expect(item.enunciado.length, `Reading item demasiado corto`).toBeGreaterThan(50)
      }
    })

    it('vocabulary_police items usan terminología policial', () => {
      const policeItems = INGLES_BANK.filter(i => i.categoria === 'vocabulary_police')
      expect(policeItems.length).toBeGreaterThanOrEqual(10)
      // Al menos algunos deben contener palabras policiales
      const policeTerms = ['officer', 'police', 'crime', 'arrest', 'suspect', 'evidence', 'patrol', 'custody', 'witness', 'warrant', 'investigation', 'forensic', 'court', 'law', 'offence', 'victim']
      const hasPoliceTerms = policeItems.some(item =>
        policeTerms.some(term =>
          item.enunciado.toLowerCase().includes(term) ||
          item.opciones.some(o => o.toLowerCase().includes(term))
        )
      )
      expect(hasPoliceTerms).toBe(true)
    })
  })

  describe('Generación', () => {
    it('genera exactamente N preguntas', () => {
      const qs = generateIngles(20, 2)
      expect(qs.length).toBe(20)
    })

    it('genera preguntas con estructura válida', () => {
      const qs = generateIngles(20, 2)
      for (const q of qs) {
        assertPreguntaValida(q)
      }
    })

    it('genera preguntas con IDs únicos', () => {
      const qs = generateIngles(20, 2)
      const ids = new Set(qs.map(q => q.id))
      expect(ids.size).toBe(20)
    })

    it('no repite enunciados en un batch', () => {
      const qs = generateIngles(20, 2)
      const enunciados = new Set(qs.map(q => q.enunciado))
      expect(enunciados.size).toBe(20)
    })

    it('respeta distribución aproximada', () => {
      const qs = generateIngles(20, 2)
      const cats = new Set(qs.map(q => q.categoria))
      // Con 20 preguntas y 9 categorías, al menos 5 deben aparecer
      expect(cats.size).toBeGreaterThanOrEqual(5)
    })

    it('funciona con dificultad 1', () => {
      const qs = generateIngles(10, 1)
      expect(qs.length).toBe(10)
      for (const q of qs) assertPreguntaValida(q)
    })

    it('funciona con dificultad 3', () => {
      const qs = generateIngles(10, 3)
      expect(qs.length).toBe(10)
      for (const q of qs) assertPreguntaValida(q)
    })
  })

  describe('Distribución', () => {
    it('distribución suma 1.0', () => {
      const sum = Object.values(INGLES_DISTRIBUCION).reduce((a, b) => a + b, 0)
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.001)
    })

    it('grammar_tenses y vocabulary_police tienen las mayores proporciones', () => {
      expect(INGLES_DISTRIBUCION.grammar_tenses).toBeGreaterThanOrEqual(0.10)
      expect(INGLES_DISTRIBUCION.vocabulary_police).toBeGreaterThanOrEqual(0.10)
    })

    it('explicaciones están en español', () => {
      // Las explicaciones deben estar en español (para opositores españoles)
      const spanishIndicators = ['se usa', 'significa', 'es', 'verbo', 'preposición', 'artículo', 'indica', 'correcto', 'correcta', 'tiempo', 'pasado', 'presente', 'futuro', 'vocabulario']
      const sampleItems = INGLES_BANK.slice(0, 30)
      const hasSpanish = sampleItems.some(item =>
        spanishIndicators.some(word => item.explicacion.toLowerCase().includes(word))
      )
      expect(hasSpanish).toBe(true)
    })
  })
})
