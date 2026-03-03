/**
 * tests/unit/ipr.test.ts — §2.5
 *
 * Tests unitarios para calcularIPR() en lib/utils/ipr.ts.
 *
 * Cobertura:
 *   - Sin tests → null
 *   - Score alto: rendimiento alto + racha alta + progresión positiva
 *   - Score bajo: rendimiento bajo + sin racha + regresión
 *   - Nivel cualitativo: iniciando / aprendiendo / avanzado / preparado
 *   - Tendencia: subiendo / estable / bajando
 *   - Constancia limitada a 100 cuando racha >= 7
 *   - Progresión neutra (50) cuando hay menos de 6 tests
 *   - Score limitado a 0-100
 */

import { describe, it, expect } from 'vitest'
import { calcularIPR } from '@/lib/utils/ipr'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTests(scores: number[]): Array<{ puntuacion: number; created_at: string }> {
  return scores.map((puntuacion, i) => ({
    puntuacion,
    created_at: new Date(Date.now() - i * 86400000).toISOString(), // i días atrás
  }))
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('calcularIPR()', () => {
  it('devuelve null si no hay tests', () => {
    expect(calcularIPR([], 0)).toBeNull()
  })

  it('calcula score para un solo test', () => {
    const result = calcularIPR(makeTests([80]), 0)
    expect(result).not.toBeNull()
    expect(result!.score).toBeGreaterThan(0)
    expect(result!.score).toBeLessThanOrEqual(100)
  })

  it('score alto con rendimiento 90%, racha 7+, progresión positiva', () => {
    const tests = makeTests([90, 88, 85, 87, 89, 80, 78, 75, 72, 70])
    const result = calcularIPR(tests, 10)
    expect(result).not.toBeNull()
    expect(result!.score).toBeGreaterThanOrEqual(70)
    expect(result!.nivel).toBe('preparado')
    expect(result!.tendencia).toBe('subiendo') // recientes(89avg) > anteriores(75avg)
  })

  it('score bajo con rendimiento 30%, sin racha, regresión', () => {
    const tests = makeTests([20, 25, 30, 28, 22, 40, 45, 50, 48, 42])
    const result = calcularIPR(tests, 0)
    expect(result).not.toBeNull()
    expect(result!.score).toBeLessThan(50)
    expect(result!.nivel).toMatch(/iniciando|aprendiendo/)
    expect(result!.tendencia).toBe('bajando') // recientes(25avg) < anteriores(45avg)
  })

  it('nivel iniciando cuando score < 35', () => {
    const tests = makeTests([20, 20, 20])
    const result = calcularIPR(tests, 0)
    expect(result!.nivel).toBe('iniciando')
  })

  it('nivel aprendiendo cuando score 35-59', () => {
    const tests = makeTests([50, 50, 50, 50, 50, 50, 50])
    const result = calcularIPR(tests, 3)
    expect(result!.nivel).toBe('aprendiendo')
  })

  it('nivel avanzado cuando score 60-79', () => {
    const tests = makeTests([75, 75, 75, 75, 75, 75, 75])
    const result = calcularIPR(tests, 5)
    expect(result!.nivel).toBe('avanzado')
  })

  it('nivel preparado cuando score >= 80', () => {
    const tests = makeTests([90, 90, 90, 90, 90, 90, 90, 90, 90, 90])
    const result = calcularIPR(tests, 7)
    expect(result!.nivel).toBe('preparado')
    expect(result!.score).toBeGreaterThanOrEqual(80)
  })

  it('tendencia estable cuando progresión ≈ 50', () => {
    // Misma nota en todos los tests → progresión = 50 → estable
    const tests = makeTests([70, 70, 70, 70, 70, 70, 70, 70, 70, 70])
    const result = calcularIPR(tests, 5)
    expect(result!.tendencia).toBe('estable')
  })

  it('constancia limitada a 100 con racha >= 7', () => {
    const tests = makeTests([80, 80, 80, 80, 80, 80, 80, 80, 80, 80])
    const r7 = calcularIPR(tests, 7)
    const r100 = calcularIPR(tests, 100)
    // Ambas rachas >=7 deberían producir constancia=100
    expect(r7!.components.constancia).toBe(100)
    expect(r100!.components.constancia).toBe(100)
    // Y por lo tanto el score debería ser igual
    expect(r7!.score).toBe(r100!.score)
  })

  it('progresión neutra (50) con menos de 6 tests', () => {
    const tests = makeTests([40, 40, 40])
    const result = calcularIPR(tests, 0)
    expect(result!.components.progresion).toBe(50)
  })

  it('score nunca supera 100 ni baja de 0', () => {
    const maxTests = makeTests([100, 100, 100, 100, 100, 100, 100, 100, 100, 100])
    const minTests = makeTests([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    const maxResult = calcularIPR(maxTests, 100)
    const minResult = calcularIPR(minTests, 0)
    expect(maxResult!.score).toBeLessThanOrEqual(100)
    expect(minResult!.score).toBeGreaterThanOrEqual(0)
  })

  it('solo usa los últimos 10 tests para rendimiento', () => {
    // Tests 1-10: 50pts, test 11-20: 90pts. Solo se usan los primeros 10.
    const tests = makeTests([50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 90, 90, 90, 90, 90])
    const result = calcularIPR(tests, 0)
    expect(result!.components.rendimiento).toBe(50)
  })

  it('incluye mensaje no vacío', () => {
    const result = calcularIPR(makeTests([70, 70, 70, 70, 70]), 3)
    expect(result!.mensaje).toBeTruthy()
    expect(result!.mensaje.length).toBeGreaterThan(5)
  })
})
