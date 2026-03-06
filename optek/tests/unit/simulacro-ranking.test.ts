/**
 * tests/unit/simulacro-ranking.test.ts
 *
 * Tests unitarios para calcularNotaSimulacro() en lib/utils/simulacro-ranking.ts.
 *
 * Cobertura:
 *   - Happy path: año con datos, aprueba y suspende
 *   - Edge cases: null año, año sin datos, todos aciertos, todos errores
 *   - Penalización: -1/3 correcta
 *   - Redondeo y precisión numérica
 */

import { describe, it, expect } from 'vitest'
import { calcularNotaSimulacro } from '@/lib/utils/simulacro-ranking'

describe('calcularNotaSimulacro', () => {
  // ─── Null / sin datos ───────────────────────────────────────────────────────

  it('retorna null cuando anio es null', () => {
    expect(calcularNotaSimulacro(50, 10, 100, null)).toBeNull()
  })

  it('retorna null cuando anio es 0', () => {
    expect(calcularNotaSimulacro(50, 10, 100, 0)).toBeNull()
  })

  it('retorna null para año sin datos de corte (2021)', () => {
    expect(calcularNotaSimulacro(50, 10, 100, 2021)).toBeNull()
  })

  it('retorna null para año futuro (2030)', () => {
    expect(calcularNotaSimulacro(50, 10, 100, 2030)).toBeNull()
  })

  // ─── Happy path 2024 (corte 6.50) ──────────────────────────────────────────

  it('aprueba 2024 — nota por encima del corte', () => {
    // 80 aciertos, 10 errores, 100 preguntas
    // notaRaw = 80 - 10/3 = 76.667 → sobre10 = 7.67
    const r = calcularNotaSimulacro(80, 10, 100, 2024)!
    expect(r).not.toBeNull()
    expect(r.habriaProbado).toBe(true)
    expect(r.tuNota).toBeGreaterThan(6.5)
    expect(r.corteOficial).toBe(6.5)
    expect(r.anio).toBe('2024')
    expect(r.plazas).toBe(1800)
    expect(r.aspirantes).toBe(142000)
    expect(r.diferencia).toBeGreaterThan(0)
  })

  it('suspende 2024 — nota por debajo del corte', () => {
    // 50 aciertos, 30 errores, 100 preguntas
    // notaRaw = 50 - 30/3 = 40 → sobre10 = 4.00
    const r = calcularNotaSimulacro(50, 30, 100, 2024)!
    expect(r.habriaProbado).toBe(false)
    expect(r.tuNota).toBe(4)
    expect(r.diferencia).toBe(-2.5)
  })

  // ─── Happy path 2022 (corte 6.00) ──────────────────────────────────────────

  it('aprueba justo en el corte 2022', () => {
    // Necesitamos nota exacta 6.00 → notaRaw/total * 10 = 6.00
    // notaRaw = 60 (con 100 preguntas, 0 errores) → 60/100*10 = 6.00
    const r = calcularNotaSimulacro(60, 0, 100, 2022)!
    expect(r.habriaProbado).toBe(true)
    expect(r.tuNota).toBe(6)
    expect(r.diferencia).toBe(0)
  })

  // ─── Happy path 2019 (corte 5.75) ──────────────────────────────────────────

  it('aprueba 2019 con margen', () => {
    const r = calcularNotaSimulacro(70, 5, 100, 2019)!
    expect(r.habriaProbado).toBe(true)
    expect(r.corteOficial).toBe(5.75)
    expect(r.plazas).toBe(3000)
  })

  // ─── Edge cases numéricos ──────────────────────────────────────────────────

  it('todos aciertos, cero errores → nota 10', () => {
    const r = calcularNotaSimulacro(100, 0, 100, 2024)!
    expect(r.tuNota).toBe(10)
    expect(r.habriaProbado).toBe(true)
  })

  it('cero aciertos, todos errores → nota negativa redondeada', () => {
    // 0 aciertos, 100 errores, 100 preguntas
    // notaRaw = 0 - 100/3 = -33.33 → sobre10 = -3.33
    const r = calcularNotaSimulacro(0, 100, 100, 2024)!
    expect(r.tuNota).toBeLessThan(0)
    expect(r.habriaProbado).toBe(false)
  })

  it('cero aciertos, cero errores → nota 0', () => {
    const r = calcularNotaSimulacro(0, 0, 100, 2024)!
    expect(r.tuNota).toBe(0)
    expect(r.habriaProbado).toBe(false)
  })

  // ─── Penalización -1/3 correcta ────────────────────────────────────────────

  it('penalización se aplica correctamente (3 errores = -1 punto)', () => {
    // 73 aciertos, 3 errores, 100 preguntas
    // notaRaw = 73 - 3/3 = 72 → sobre10 = 7.20
    const r = calcularNotaSimulacro(73, 3, 100, 2024)!
    expect(r.tuNota).toBe(7.2)
  })

  // ─── Redondeo 2 decimales ──────────────────────────────────────────────────

  it('redondea a 2 decimales', () => {
    // 65 aciertos, 7 errores, 100 preguntas
    // notaRaw = 65 - 7/3 = 62.6667 → sobre10 = 6.2667 → round = 6.27
    const r = calcularNotaSimulacro(65, 7, 100, 2024)!
    expect(r.tuNota).toBe(6.27)
    expect(r.diferencia).toBe(-0.23)
  })

  // ─── Diferencia correcta ───────────────────────────────────────────────────

  it('diferencia positiva cuando aprueba', () => {
    const r = calcularNotaSimulacro(80, 0, 100, 2019)!
    // nota = 8.0, corte = 5.75, dif = 2.25
    expect(r.diferencia).toBe(2.25)
  })

  it('diferencia negativa cuando suspende', () => {
    const r = calcularNotaSimulacro(40, 20, 100, 2024)!
    expect(r.diferencia).toBeLessThan(0)
  })

  // ─── Total preguntas distinto de 100 ───────────────────────────────────────

  it('funciona con 110 preguntas (examen real)', () => {
    // 90 aciertos, 10 errores, 110 preguntas
    // notaRaw = 90 - 10/3 = 86.667 → sobre10 = 86.667/110*10 = 7.88
    const r = calcularNotaSimulacro(90, 10, 110, 2024)!
    expect(r.tuNota).toBeCloseTo(7.88, 1)
    expect(r.habriaProbado).toBe(true)
  })
})
