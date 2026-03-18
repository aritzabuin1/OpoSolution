/**
 * tests/unit/infrastructure.test.ts — §2.23
 *
 * Tests unitarios para lib/admin/infrastructure.ts y lib/admin/cost-check.ts.
 * Mock de Supabase y next/cache para aislar la lógica de umbrales.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock de next/cache (bypass unstable_cache en tests) ──────────────────────

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

// ─── Mock de metrics-filter (admin exclusion) ────────────────────────────────

vi.mock('@/lib/admin/metrics-filter', () => ({
  METRICS_START_DATE: '2026-03-15T00:00:00Z',
  getAdminUserIds: vi.fn().mockResolvedValue([]),
  adminIdFilter: vi.fn().mockReturnValue(null),
}))

// ─── Mock de createServiceClient ──────────────────────────────────────────────

const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockResolvedValue({
    rpc: mockRpc,
    from: mockFrom,
  }),
}))

// ─── Helpers de mock ──────────────────────────────────────────────────────────

/** Query que devuelve count (profiles, compras, api_usage_log count) */
function mockCountQuery(count: number) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
  }
  const result = { count, data: null, error: null }
  Object.assign(chain, {
    then: (resolve: (v: typeof result) => void) => resolve(result),
  })
  return chain
}

/** Query que devuelve filas (api_usage_log, tests_generados) */
function mockRowsQuery(rows: Record<string, unknown>[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
  }
  const result = { data: rows, error: null }
  Object.assign(chain, {
    then: (resolve: (v: typeof result) => void) => resolve(result),
  })
  chain.select.mockReturnValue(chain)
  chain.gte.mockReturnValue(chain)
  chain.lt.mockReturnValue(chain)
  chain.lte.mockReturnValue(chain)
  return chain
}

// ─── Setup: configura mocks por defecto para un estado "todo ok" ──────────────

function setupHappyPath({
  dbBytes = 50 * 1024 * 1024,        // 50 MB → 10% de 500 MB → 'ok'
  registrados = 100,
  mauUsers = ['u1', 'u2'],           // 2 MAU → 0.004% de 50k → 'ok'
  dauUsers = ['u1'],                  // 1 DAU → 3 cmds → 'ok'
  costTodayCents = 100,              // €1 hoy
  costWeekCents = 500,               // €5 semana
  costMonthCents = 2000,             // €20 mes → 'ok'
  apiCallsMonth = 500,               // Vercel: 500 * 3 = 1.500 → 'ok'
  newUsersToday = 2,
  newUsersWeek = 10,
  newUsersPrevWeek = 8,
  purchasesToday = 0,
  purchasesWeek: purchasesWeekData = [] as { amount_paid: number }[],
  paidUsers = [] as { user_id: string }[],
} = {}) {
  mockRpc.mockResolvedValue({ data: dbBytes, error: null })
  mockFrom
    .mockReturnValueOnce(mockCountQuery(registrados))                             // 1. profiles count
    .mockReturnValueOnce(mockRowsQuery(mauUsers.map(u => ({ user_id: u }))))     // 2. mau 30d
    .mockReturnValueOnce(mockRowsQuery(dauUsers.map(u => ({ user_id: u }))))     // 3. dau 24h
    .mockReturnValueOnce(mockRowsQuery([{ cost_estimated_cents: costTodayCents }])) // 4. ai today
    .mockReturnValueOnce(mockRowsQuery([{ cost_estimated_cents: costWeekCents }]))  // 5. ai week
    .mockReturnValueOnce(mockRowsQuery([{ cost_estimated_cents: costMonthCents }])) // 6. ai month
    .mockReturnValueOnce(mockCountQuery(apiCallsMonth))                           // 7. api calls month (vercel)
    .mockReturnValueOnce(mockCountQuery(newUsersToday))                           // 8. new users today
    .mockReturnValueOnce(mockCountQuery(newUsersWeek))                            // 9. new users week
    .mockReturnValueOnce(mockCountQuery(newUsersPrevWeek))                        // 10. new users prev week
    .mockReturnValueOnce(mockCountQuery(purchasesToday))                          // 11. purchases today
    .mockReturnValueOnce(mockRowsQuery(purchasesWeekData))                        // 12. purchases week
    .mockReturnValueOnce(mockRowsQuery(paidUsers))                                // 13. paid users
}

// ─── Imports bajo test (después de los mocks) ──────────────────────────────────

const { getInfraMetrics } = await import('@/lib/admin/infrastructure')

// ─── Tests de getInfraMetrics ─────────────────────────────────────────────────

describe('getInfraMetrics — DB size', () => {
  beforeEach(() => vi.clearAllMocks())

  it('status ok cuando BD < 70% (350 MB)', async () => {
    setupHappyPath({ dbBytes: 200 * 1024 * 1024 }) // 200 MB = 40%
    const m = await getInfraMetrics()
    expect(m.db.status).toBe('ok')
    expect(m.db.pct).toBeCloseTo(40, 0)
  })

  it('status warning cuando BD ≥ 70% (350 MB)', async () => {
    setupHappyPath({ dbBytes: 360 * 1024 * 1024 }) // 360 MB = 72%
    const m = await getInfraMetrics()
    expect(m.db.status).toBe('warning')
    expect(m.db.pct).toBeGreaterThanOrEqual(70)
    expect(m.db.pct).toBeLessThan(90)
  })

  it('status error cuando BD ≥ 90% (450 MB)', async () => {
    setupHappyPath({ dbBytes: 455 * 1024 * 1024 }) // 455 MB = 91%
    const m = await getInfraMetrics()
    expect(m.db.status).toBe('error')
    expect(m.db.pct).toBeGreaterThanOrEqual(90)
  })

  it('expone sizeMB y limitMB correctamente', async () => {
    setupHappyPath({ dbBytes: 100 * 1024 * 1024 }) // 100 MB
    const m = await getInfraMetrics()
    expect(m.db.sizeMB).toBeCloseTo(100, 0)
    expect(m.db.limitMB).toBe(500)
    expect(m.db.sizeBytes).toBe(100 * 1024 * 1024)
  })
})

describe('getInfraMetrics — Auth MAU', () => {
  beforeEach(() => vi.clearAllMocks())

  it('status ok cuando MAU < 35.000', async () => {
    setupHappyPath({ mauUsers: Array.from({ length: 1000 }, (_, i) => `u${i}`) })
    const m = await getInfraMetrics()
    expect(m.auth.status).toBe('ok')
    expect(m.auth.mau30d).toBe(1000)
  })

  it('status warning cuando MAU ≥ 35.000', async () => {
    setupHappyPath({ mauUsers: Array.from({ length: 36000 }, (_, i) => `u${i}`) })
    const m = await getInfraMetrics()
    expect(m.auth.status).toBe('warning')
    expect(m.auth.mau30d).toBe(36000)
  })

  it('status error cuando MAU ≥ 45.000', async () => {
    setupHappyPath({ mauUsers: Array.from({ length: 46000 }, (_, i) => `u${i}`) })
    const m = await getInfraMetrics()
    expect(m.auth.status).toBe('error')
    expect(m.auth.mau30d).toBe(46000)
  })

  it('deduplica user_ids para MAU real', async () => {
    // Mismo user_id repetido 5 veces → solo 1 MAU único
    setupHappyPath({ mauUsers: ['u1', 'u1', 'u1', 'u1', 'u1'] })
    const m = await getInfraMetrics()
    expect(m.auth.mau30d).toBe(1)
  })

  it('expone totalRegistrados y limitMAU', async () => {
    setupHappyPath({ registrados: 250 })
    const m = await getInfraMetrics()
    expect(m.auth.totalRegistrados).toBe(250)
    expect(m.auth.limitMAU).toBe(50_000)
  })
})

describe('getInfraMetrics — Upstash (estimación)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('status ok cuando DAU × 3 < 7.000', async () => {
    setupHappyPath({ dauUsers: Array.from({ length: 500 }, (_, i) => `u${i}`) }) // 500 DAU × 3 = 1.500
    const m = await getInfraMetrics()
    expect(m.upstash.status).toBe('ok')
    expect(m.upstash.estimatedCmdsDay).toBe(1500)
    expect(m.upstash.dau).toBe(500)
  })

  it('status warning cuando DAU × 3 ≥ 7.000', async () => {
    setupHappyPath({ dauUsers: Array.from({ length: 2400 }, (_, i) => `u${i}`) }) // 2.400 × 3 = 7.200
    const m = await getInfraMetrics()
    expect(m.upstash.status).toBe('warning')
    expect(m.upstash.estimatedCmdsDay).toBe(7200)
  })

  it('status error cuando DAU × 3 ≥ 9.000', async () => {
    setupHappyPath({ dauUsers: Array.from({ length: 3100 }, (_, i) => `u${i}`) }) // 3.100 × 3 = 9.300
    const m = await getInfraMetrics()
    expect(m.upstash.status).toBe('error')
    expect(m.upstash.estimatedCmdsDay).toBeGreaterThanOrEqual(9000)
  })

  it('deduplica DAU correctamente', async () => {
    setupHappyPath({ dauUsers: ['u1', 'u2', 'u1', 'u3', 'u2'] }) // 3 únicos
    const m = await getInfraMetrics()
    expect(m.upstash.dau).toBe(3)
    expect(m.upstash.estimatedCmdsDay).toBe(9)
  })

  it('expone limitCmdsDay', async () => {
    setupHappyPath()
    const m = await getInfraMetrics()
    expect(m.upstash.limitCmdsDay).toBe(10_000)
  })
})

describe('getInfraMetrics — AI costs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('status ok cuando costes del mes < €50', async () => {
    setupHappyPath({ costMonthCents: 4000 }) // €40
    const m = await getInfraMetrics()
    expect(m.ai.status).toBe('ok')
    expect(m.ai.costsMonth).toBeCloseTo(40, 1)
  })

  it('status warning cuando costes del mes ≥ €50', async () => {
    setupHappyPath({ costMonthCents: 5500 }) // €55
    const m = await getInfraMetrics()
    expect(m.ai.status).toBe('warning')
    expect(m.ai.costsMonth).toBeCloseTo(55, 1)
  })

  it('status error cuando costes del mes ≥ €100', async () => {
    setupHappyPath({ costMonthCents: 10500 }) // €105
    const m = await getInfraMetrics()
    expect(m.ai.status).toBe('error')
    expect(m.ai.costsMonth).toBeCloseTo(105, 1)
  })

  it('calcula costes de hoy y semana correctamente', async () => {
    setupHappyPath({ costTodayCents: 200, costWeekCents: 800 }) // €2 hoy, €8 semana
    const m = await getInfraMetrics()
    expect(m.ai.costsToday).toBeCloseTo(2, 2)
    expect(m.ai.costsWeek).toBeCloseTo(8, 2)
  })

  it('retorna cero cuando no hay logs de IA', async () => {
    setupHappyPath({ costTodayCents: 0, costWeekCents: 0, costMonthCents: 0 })
    const m = await getInfraMetrics()
    expect(m.ai.costsToday).toBe(0)
    expect(m.ai.costsWeek).toBe(0)
    expect(m.ai.costsMonth).toBe(0)
    expect(m.ai.status).toBe('ok')
  })
})

describe('getInfraMetrics — semaphore (worst status)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('semaphore ok cuando todos en ok', async () => {
    setupHappyPath()
    const m = await getInfraMetrics()
    expect(m.semaphore).toBe('ok')
  })

  it('semaphore warning cuando hay un warning (upstash)', async () => {
    setupHappyPath({
      dauUsers: Array.from({ length: 2500 }, (_, i) => `u${i}`), // 7.500 cmds → warning
    })
    const m = await getInfraMetrics()
    expect(m.upstash.status).toBe('warning')
    expect(m.semaphore).toBe('warning')
  })

  it('semaphore error cuando hay un error (BD), aunque otros sean ok', async () => {
    setupHappyPath({ dbBytes: 460 * 1024 * 1024 }) // 92% → error
    const m = await getInfraMetrics()
    expect(m.db.status).toBe('error')
    expect(m.semaphore).toBe('error')
  })

  it('semaphore error cuando hay mix error + warning', async () => {
    setupHappyPath({
      dbBytes: 460 * 1024 * 1024,                                   // DB: error
      dauUsers: Array.from({ length: 2500 }, (_, i) => `u${i}`),   // Upstash: warning
    })
    const m = await getInfraMetrics()
    expect(m.semaphore).toBe('error')  // error > warning
  })

  it('expone cachedAt como ISO string', async () => {
    setupHappyPath()
    const m = await getInfraMetrics()
    expect(m.cachedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

describe('getInfraMetrics — Vercel invocations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('status ok cuando invocaciones estimadas < 70k', async () => {
    setupHappyPath({ apiCallsMonth: 10_000 }) // 10k * 3 = 30k
    const m = await getInfraMetrics()
    expect(m.vercel.status).toBe('ok')
    expect(m.vercel.estimatedInvocationsMonth).toBe(30_000)
  })

  it('status warning cuando invocaciones estimadas >= 70k', async () => {
    setupHappyPath({ apiCallsMonth: 25_000 }) // 25k * 3 = 75k
    const m = await getInfraMetrics()
    expect(m.vercel.status).toBe('warning')
  })

  it('status error cuando invocaciones estimadas >= 90k', async () => {
    setupHappyPath({ apiCallsMonth: 31_000 }) // 31k * 3 = 93k
    const m = await getInfraMetrics()
    expect(m.vercel.status).toBe('error')
  })
})

describe('getInfraMetrics — Growth', () => {
  beforeEach(() => vi.clearAllMocks())

  it('expone metricas de crecimiento', async () => {
    setupHappyPath({ newUsersToday: 5, newUsersWeek: 20, registrados: 200 })
    const m = await getInfraMetrics()
    expect(m.growth.newUsersToday).toBe(5)
    expect(m.growth.newUsersWeek).toBe(20)
    expect(m.growth.totalUsers).toBe(200)
  })

  it('calcula daysToMauLimit cuando hay crecimiento', async () => {
    setupHappyPath({ newUsersWeek: 70, mauUsers: ['u1', 'u2'] }) // 10/day, 49998 remaining
    const m = await getInfraMetrics()
    expect(m.growth.daysToMauLimit).toBeGreaterThan(0)
    expect(m.growth.daysToMauLimit).toBeLessThan(6000)
  })
})

describe('getInfraMetrics — Business', () => {
  beforeEach(() => vi.clearAllMocks())

  it('expone metricas de negocio', async () => {
    setupHappyPath({
      purchasesToday: 2,
      purchasesWeek: [{ amount_paid: 4999 }, { amount_paid: 899 }],
      paidUsers: [{ user_id: 'u1' }],
      registrados: 50,
    })
    const m = await getInfraMetrics()
    expect(m.business.purchasesToday).toBe(2)
    expect(m.business.purchasesWeek).toBe(2)
    expect(m.business.revenueWeekEur).toBeCloseTo(58.98, 1)
    expect(m.business.conversionRatePct).toBe(2) // 1/50 = 2%
  })

  it('conversion 0% cuando no hay compras', async () => {
    setupHappyPath({ registrados: 30 })
    const m = await getInfraMetrics()
    expect(m.business.conversionRatePct).toBe(0)
    expect(m.business.revenueWeekEur).toBe(0)
  })
})
