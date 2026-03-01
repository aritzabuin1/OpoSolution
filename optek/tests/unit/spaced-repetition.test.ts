/**
 * tests/unit/spaced-repetition.test.ts — §2.1.4
 *
 * Verifica el algoritmo de repaso espaciado con intervalos fijos MVP.
 */

import { describe, it, expect } from 'vitest'
import { getNextInterval, getNextReviewDate, INTERVALOS_DIAS } from '@/lib/utils/spaced-repetition'

describe('getNextInterval', () => {
  it('§2.1.4 — "mal" siempre resetea a 1 día', () => {
    expect(getNextInterval(1, 'mal')).toBe(1)
    expect(getNextInterval(7, 'mal')).toBe(1)
    expect(getNextInterval(30, 'mal')).toBe(1)
  })

  it('"dificil" mantiene el intervalo actual (no avanza)', () => {
    expect(getNextInterval(1, 'dificil')).toBe(1)
    expect(getNextInterval(7, 'dificil')).toBe(7)
    expect(getNextInterval(14, 'dificil')).toBe(14)
  })

  it('"bien" avanza un intervalo', () => {
    expect(getNextInterval(1, 'bien')).toBe(3)    // 1 → 3
    expect(getNextInterval(3, 'bien')).toBe(7)    // 3 → 7
    expect(getNextInterval(7, 'bien')).toBe(14)   // 7 → 14
    expect(getNextInterval(14, 'bien')).toBe(30)  // 14 → 30
  })

  it('"bien" en el último intervalo permanece en 30', () => {
    expect(getNextInterval(30, 'bien')).toBe(30)
  })

  it('"facil" avanza dos intervalos', () => {
    expect(getNextInterval(1, 'facil')).toBe(7)    // 1 → 7 (salta 3)
    expect(getNextInterval(3, 'facil')).toBe(14)   // 3 → 14 (salta 7)
    expect(getNextInterval(7, 'facil')).toBe(30)   // 7 → 30 (salta 14)
  })

  it('"facil" en los últimos intervalos permanece en 30', () => {
    expect(getNextInterval(14, 'facil')).toBe(30)
    expect(getNextInterval(30, 'facil')).toBe(30)
  })

  it('§2.1.4 — acertar 3 veces desde 1 → llega a 14 días', () => {
    let intervalo = 1
    intervalo = getNextInterval(intervalo, 'bien')  // → 3
    intervalo = getNextInterval(intervalo, 'bien')  // → 7
    intervalo = getNextInterval(intervalo, 'bien')  // → 14
    expect(intervalo).toBe(14)
  })

  it('§2.1.4 — fallar resetea a 1 día desde cualquier nivel', () => {
    let intervalo = 14
    intervalo = getNextInterval(intervalo, 'mal')
    expect(intervalo).toBe(1)
  })

  it('los intervalos siguen la secuencia definida', () => {
    expect(INTERVALOS_DIAS).toEqual([1, 3, 7, 14, 30])
  })
})

describe('getNextReviewDate', () => {
  it('añade el número de días correctamente', () => {
    const base = new Date('2026-01-10')
    expect(getNextReviewDate(1, base)).toBe('2026-01-11')
    expect(getNextReviewDate(7, base)).toBe('2026-01-17')
    expect(getNextReviewDate(30, base)).toBe('2026-02-09')
  })

  it('usa hoy si no se proporciona fecha base', () => {
    const today = new Date().toISOString().split('T')[0]!
    const tomorrow = getNextReviewDate(1)
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    expect(tomorrow).toBe(d.toISOString().split('T')[0])
  })

  it('retorna formato YYYY-MM-DD', () => {
    const result = getNextReviewDate(7, new Date('2026-06-01'))
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
