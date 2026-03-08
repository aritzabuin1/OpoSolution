/**
 * tests/unit/admin-metrics.test.ts — §2.18.5
 *
 * Tests unitarios para lib/admin/metrics.ts
 * Mock de Supabase para aislar la lógica de cálculo.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock de createServiceClient ──────────────────────────────────────────────

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}))

// ─── Helpers de mock ──────────────────────────────────────────────────────────

function mockTableQuery(data: unknown[], count?: number) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] ?? null, error: null }),
    then: undefined as unknown,
  }
  // Hacer el chain awaitable para queries sin .single()
  const result = { data, error: null, count: count ?? null }
  Object.assign(chain, { then: (resolve: (v: typeof result) => void) => resolve(result) })
  chain.select.mockReturnValue(chain)
  chain.gte.mockReturnValue(chain)
  chain.like.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  return chain
}

// ─── Imports bajo test (después del mock) ─────────────────────────────────────

const { getFuelTank, getCostPerUser, getAlerts } = await import('@/lib/admin/metrics')

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getFuelTank', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calcula margen correctamente con ingresos y costes reales', async () => {
    mockFrom
      .mockReturnValueOnce(mockTableQuery([
        { amount_paid: 3499 },   // €34.99
        { amount_paid: 499 },    // €4.99
      ]))
      .mockReturnValueOnce(mockTableQuery([
        { cost_estimated_cents: 50 },  // €0.50
        { cost_estimated_cents: 30 },  // €0.30
      ]))

    const result = await getFuelTank()

    expect(result.ingresos).toBeCloseTo(39.98, 2)  // (3499+499)/100
    expect(result.costes).toBeCloseTo(0.80, 2)      // (50+30)/100
    expect(result.margen).toBeCloseTo(39.18, 2)
    expect(result.margenPct).toBeGreaterThan(90)    // ~98%
  })

  it('retorna margen 0 cuando no hay ingresos', async () => {
    mockFrom
      .mockReturnValueOnce(mockTableQuery([]))
      .mockReturnValueOnce(mockTableQuery([{ cost_estimated_cents: 100 }]))

    const result = await getFuelTank()

    expect(result.ingresos).toBe(0)
    expect(result.costes).toBeCloseTo(1.0, 2)
    expect(result.margen).toBeCloseTo(-1.0, 2)
    expect(result.margenPct).toBe(-100) // -100% cuando ingresos = 0 y costes > 0
  })

  it('retorna zeros cuando no hay datos en ninguna tabla', async () => {
    mockFrom
      .mockReturnValueOnce(mockTableQuery([]))
      .mockReturnValueOnce(mockTableQuery([]))

    const result = await getFuelTank()

    expect(result.ingresos).toBe(0)
    expect(result.costes).toBe(0)
    expect(result.margen).toBe(0)
    expect(result.margenPct).toBe(0)
  })
})

describe('getAlerts', () => {
  it('genera alerta error cuando margen < 20%', () => {
    const fuelTank = { ingresos: 100, costes: 85, margen: 15, margenPct: 15 }
    const costPerUser = { costeMedioTest: 0.005, costeMedioUsuario: 0.10, usuariosActivos30d: 10, testsUltimos30d: 20 }

    const alerts = getAlerts(fuelTank, costPerUser)

    expect(alerts.some((a) => a.nivel === 'error')).toBe(true)
    expect(alerts.some((a) => a.mensaje.includes('Margen bruto crítico'))).toBe(true)
  })

  it('genera alerta error cuando coste por usuario > €0.50', () => {
    const fuelTank = { ingresos: 500, costes: 100, margen: 400, margenPct: 80 }
    const costPerUser = { costeMedioTest: 0.05, costeMedioUsuario: 0.75, usuariosActivos30d: 5, testsUltimos30d: 10 }

    const alerts = getAlerts(fuelTank, costPerUser)

    expect(alerts.some((a) => a.nivel === 'error')).toBe(true)
    expect(alerts.some((a) => a.mensaje.includes('Coste IA por usuario'))).toBe(true)
  })

  it('retorna info OK cuando todo está dentro de rango saludable', () => {
    const fuelTank = { ingresos: 500, costes: 50, margen: 450, margenPct: 90 }
    const costPerUser = { costeMedioTest: 0.005, costeMedioUsuario: 0.10, usuariosActivos30d: 50, testsUltimos30d: 500 }

    const alerts = getAlerts(fuelTank, costPerUser)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].nivel).toBe('info')
    expect(alerts[0].mensaje).toContain('saludable')
  })

  it('genera alerta warning cuando hay costes pero no ingresos', () => {
    const fuelTank = { ingresos: 0, costes: 5.50, margen: -5.50, margenPct: -100 }
    const costPerUser = { costeMedioTest: 0.005, costeMedioUsuario: 0.05, usuariosActivos30d: 10, testsUltimos30d: 100 }

    const alerts = getAlerts(fuelTank, costPerUser)

    expect(alerts.some((a) => a.nivel === 'warning')).toBe(true)
    expect(alerts.some((a) => a.mensaje.includes('sin ingresos'))).toBe(true)
  })
})

describe('getCostPerUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna zeros cuando no hay datos de logs ni tests', async () => {
    mockFrom
      .mockReturnValueOnce(mockTableQuery([]))
      .mockReturnValueOnce(mockTableQuery([]))

    const result = await getCostPerUser()

    expect(result.costeMedioTest).toBe(0)
    expect(result.costeMedioUsuario).toBe(0)
    expect(result.usuariosActivos30d).toBe(0)
    expect(result.testsUltimos30d).toBe(0)
  })
})
