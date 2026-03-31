/**
 * tests/unit/ortografia.test.ts — §6.5
 *
 * Tests unitarios para el motor de ortografía (Guardia Civil).
 * Verifican: banco, generación, distribución, estructura.
 */

import { describe, it, expect } from 'vitest'
import { ORTOGRAFIA_BANK } from '@/lib/ortografia/bank'
import { generateOrtografia, getOrtografiaBankSize, getOrtografiaBankStats, ORTOGRAFIA_DISTRIBUCION } from '@/lib/ortografia/index'
import type { CategoriaOrtografia, OrtografiaQuestion } from '@/lib/ortografia/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assertPreguntaValida(q: OrtografiaQuestion) {
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

describe('§6.5 — Motor ortografía GC', () => {
  describe('Banco de items', () => {
    it('tiene al menos 200 items', () => {
      expect(getOrtografiaBankSize()).toBeGreaterThanOrEqual(200)
    })

    it('todas las categorías tienen items', () => {
      const stats = getOrtografiaBankStats()
      const categorias: CategoriaOrtografia[] = [
        'acentuacion', 'b_v', 'h', 'g_j', 'll_y',
        'c_z_s', 'mayusculas', 'puntuacion', 'homofonos',
      ]
      for (const cat of categorias) {
        expect(stats[cat], `categoría ${cat} sin items`).toBeGreaterThan(0)
      }
    })

    it('cada categoría tiene al menos 15 items', () => {
      const stats = getOrtografiaBankStats()
      for (const [cat, count] of Object.entries(stats)) {
        expect(count, `categoría ${cat} con pocos items`).toBeGreaterThanOrEqual(15)
      }
    })

    it('todos los items tienen estructura válida', () => {
      for (const item of ORTOGRAFIA_BANK) {
        expect(item.opciones).toHaveLength(4)
        expect(item.correcta).toBeGreaterThanOrEqual(0)
        expect(item.correcta).toBeLessThanOrEqual(3)
        expect(item.enunciado.length).toBeGreaterThan(5)
        expect(item.explicacion.length).toBeGreaterThan(5)
        expect([1, 2, 3]).toContain(item.dificultad)
      }
    })

    it('opciones son únicas dentro de cada item', () => {
      for (const item of ORTOGRAFIA_BANK) {
        // Para mayúsculas y puntuación, las opciones solo difieren en capitalización/signos
        // → comparar case-sensitive (sin toLowerCase)
        const caseSensitive = item.categoria === 'mayusculas' || item.categoria === 'puntuacion'
        const unique = new Set(item.opciones.map(o => caseSensitive ? o.trim() : o.toLowerCase().trim()))
        expect(unique.size, `Opciones duplicadas en: ${item.enunciado.slice(0, 60)}`).toBe(4)
      }
    })

    it('correcta apunta a una opción existente', () => {
      for (const item of ORTOGRAFIA_BANK) {
        expect(
          item.opciones[item.correcta],
          `correcta=${item.correcta} fuera de rango en: ${item.enunciado.slice(0, 60)}`
        ).toBeTruthy()
      }
    })

    it('hay items de las 3 dificultades', () => {
      const porDif = { 1: 0, 2: 0, 3: 0 }
      for (const item of ORTOGRAFIA_BANK) {
        porDif[item.dificultad]++
      }
      expect(porDif[1]).toBeGreaterThan(0)
      expect(porDif[2]).toBeGreaterThan(0)
      expect(porDif[3]).toBeGreaterThan(0)
    })
  })

  describe('Generación', () => {
    it('genera exactamente N preguntas', () => {
      const qs = generateOrtografia(25, 2)
      expect(qs.length).toBe(25)
    })

    it('genera preguntas con estructura válida', () => {
      const qs = generateOrtografia(25, 2)
      for (const q of qs) {
        assertPreguntaValida(q)
      }
    })

    it('genera preguntas con IDs únicos', () => {
      const qs = generateOrtografia(25, 2)
      const ids = new Set(qs.map(q => q.id))
      expect(ids.size).toBe(25)
    })

    it('no repite enunciados en un batch', () => {
      const qs = generateOrtografia(25, 2)
      const enunciados = new Set(qs.map(q => q.enunciado))
      expect(enunciados.size).toBe(25)
    })

    it('respeta distribución aproximada por categoría', () => {
      const qs = generateOrtografia(25, 2)
      const cats = new Set(qs.map(q => q.categoria))
      // Con 25 preguntas y 9 categorías, al menos 5 categorías deben aparecer
      expect(cats.size).toBeGreaterThanOrEqual(5)
    })

    it('funciona con dificultad 1', () => {
      const qs = generateOrtografia(15, 1)
      expect(qs.length).toBe(15)
      for (const q of qs) assertPreguntaValida(q)
    })

    it('funciona con dificultad 3', () => {
      const qs = generateOrtografia(15, 3)
      expect(qs.length).toBe(15)
      for (const q of qs) assertPreguntaValida(q)
    })

    it('genera pocos sin exceder el banco', () => {
      const qs = generateOrtografia(5, 1)
      expect(qs.length).toBe(5)
    })
  })

  describe('Distribución', () => {
    it('distribución suma 1.0', () => {
      const sum = Object.values(ORTOGRAFIA_DISTRIBUCION).reduce((a, b) => a + b, 0)
      expect(Math.abs(sum - 1.0)).toBeLessThan(0.001)
    })

    it('acentuación tiene la mayor proporción', () => {
      expect(ORTOGRAFIA_DISTRIBUCION.acentuacion).toBeGreaterThanOrEqual(0.15)
    })
  })
})
