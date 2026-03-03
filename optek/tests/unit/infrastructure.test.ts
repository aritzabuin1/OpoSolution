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

/** Query que devuelve count (profiles) */
function mockCountQuery(count: number) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }
  const result = { count, data: null, error: null }
  Object.assign(chain, {
    then: (resolve: (v: typeof result) => void) => resolve(result),
  })
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
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
} = {}) {
  mockRpc.mockResolvedValue({ data: dbBytes, error: null })
  mockFrom
    .mockReturnValueOnce(mockCountQuery(registrados))                 // profiles count
    .mockReturnValueOnce(mockRowsQuery(mauUsers.map(u => ({ user_id: u }))))   // mau 30d
    .mockReturnValueOnce(mockRowsQuery(dauUsers.map(u => ({ user_id: u }))))   // dau 24h
    .mockReturnValueOnce(mockRowsQuery([{ cost_estimated_cents: costTodayCents }]))  // ai today
    .mockReturnValueOnce(mockRowsQuery([{ cost_estimated_cents: costWeekCents }]))   // ai week
    .mockReturnValueOnce(mockRowsQuery([{ cost_estimated_cents: costMonthCents }]))  // ai month
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
    // Sobreescribir mockFrom para costes vacíos
    mockRpc.mockResolvedValue({ data: 50 * 1024 * 1024, error: null })
    mockFrom
      .mockReturnValueOnce(mockCountQuery(10))
      .mockReturnValueOnce(mockRowsQuery([{ user_id: 'u1' }]))
      .mockReturnValueOnce(mockRowsQuery([{ user_id: 'u1' }]))
      .mockReturnValueOnce(mockRowsQuery([]))   // today: vacío
      .mockReturnValueOnce(mockRowsQuery([]))   // week: vacío
      .mockReturnValueOnce(mockRowsQuery([]))   // month: vacío

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
