/**
 * tests/unit/request-metrics.test.ts
 *
 * Tests unitarios para el tracker de latencia in-memory.
 *
 * Cobertura:
 *   - recordLatency + getMetrics: p50, p95, p99
 *   - FIFO eviction cuando alcanza MAX_SAMPLES
 *   - getMetrics retorna null si no hay datos
 *   - getAllMetrics agrega endpoints
 *   - Reset por tiempo (hourly)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { recordLatency, getMetrics, getAllMetrics } from '@/lib/utils/request-metrics'

describe('request-metrics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('getMetrics retorna null para endpoint sin datos', () => {
    expect(getMetrics('nonexistent-endpoint-xyz')).toBeNull()
  })

  it('registra y devuelve métricas correctas', () => {
    const ep = 'test-ep-1'
    recordLatency(ep, 100)
    recordLatency(ep, 200)
    recordLatency(ep, 300)

    const m = getMetrics(ep)
    expect(m).not.toBeNull()
    expect(m!.count).toBe(3)
    expect(m!.min).toBe(100)
    expect(m!.max).toBe(300)
    expect(m!.p50).toBe(200)
  })

  it('p50/p95/p99 correctos con 100 samples', () => {
    const ep = 'test-ep-percentiles'
    for (let i = 1; i <= 100; i++) {
      recordLatency(ep, i)
    }

    const m = getMetrics(ep)!
    expect(m.count).toBe(100)
    expect(m.p50).toBe(50)
    expect(m.p95).toBe(95)
    expect(m.p99).toBe(99)
    expect(m.min).toBe(1)
    expect(m.max).toBe(100)
  })

  it('single sample: todos los percentiles iguales', () => {
    const ep = 'test-ep-single'
    recordLatency(ep, 42)

    const m = getMetrics(ep)!
    expect(m.p50).toBe(42)
    expect(m.p95).toBe(42)
    expect(m.p99).toBe(42)
  })

  it('getAllMetrics agrega múltiples endpoints', () => {
    const ep1 = 'all-ep-1'
    const ep2 = 'all-ep-2'
    recordLatency(ep1, 10)
    recordLatency(ep2, 20)

    const all = getAllMetrics()
    expect(all[ep1]).not.toBeNull()
    expect(all[ep2]).not.toBeNull()
  })

  it('resetea datos después de 1 hora', () => {
    const ep = 'test-ep-reset'
    recordLatency(ep, 100)
    expect(getMetrics(ep)!.count).toBe(1)

    // Avanzar >1 hora
    vi.advanceTimersByTime(61 * 60 * 1000)

    // Nuevo registro después del reset
    recordLatency(ep, 200)
    const m = getMetrics(ep)!
    expect(m.count).toBe(1)
    expect(m.p50).toBe(200) // Solo tiene el nuevo valor
  })

  it('FIFO eviction cuando excede MAX_SAMPLES (1000)', () => {
    const ep = 'test-ep-eviction'
    // Llenar con 1000 samples de valor 50
    for (let i = 0; i < 1000; i++) {
      recordLatency(ep, 50)
    }
    expect(getMetrics(ep)!.count).toBe(1000)

    // Añadir uno más → debe evictar el primero
    recordLatency(ep, 999)
    expect(getMetrics(ep)!.count).toBe(1000) // No crece beyond 1000
    expect(getMetrics(ep)!.max).toBe(999) // El nuevo valor está presente
  })
})
