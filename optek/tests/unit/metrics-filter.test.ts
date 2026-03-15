/**
 * tests/unit/metrics-filter.test.ts
 *
 * Tests unitarios para lib/admin/metrics-filter.ts.
 *
 * Cobertura:
 *   METRICS_START_DATE  — valid ISO date
 *   getAdminUserIds     — returns admin IDs / empty array
 *   adminIdFilter       — formats IDs or returns null
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}))

// ─── Import under test ──────────────────────────────────────────────────────

import {
  METRICS_START_DATE,
  getAdminUserIds,
  adminIdFilter,
} from '@/lib/admin/metrics-filter'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSelectBuilder(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('METRICS_START_DATE', () => {
  it('is a valid ISO date string', () => {
    const parsed = new Date(METRICS_START_DATE)
    expect(isNaN(parsed.getTime())).toBe(false)
    // toISOString adds .000 milliseconds — check equivalence, not exact string
    expect(parsed.getTime()).toBe(new Date('2026-03-15T00:00:00Z').getTime())
  })
})

describe('getAdminUserIds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns admin user IDs from profiles', async () => {
    mockFrom.mockReturnValueOnce(
      makeSelectBuilder([{ id: 'admin-1' }, { id: 'admin-2' }])
    )

    const ids = await getAdminUserIds()

    expect(ids).toEqual(['admin-1', 'admin-2'])
    expect(mockFrom).toHaveBeenCalledWith('profiles')
  })

  it('returns empty array when no admins exist', async () => {
    mockFrom.mockReturnValueOnce(makeSelectBuilder([]))

    const ids = await getAdminUserIds()

    expect(ids).toEqual([])
  })

  it('returns empty array when data is null', async () => {
    mockFrom.mockReturnValueOnce(makeSelectBuilder(null))

    const ids = await getAdminUserIds()

    expect(ids).toEqual([])
  })
})

describe('adminIdFilter', () => {
  it('returns null for empty array', () => {
    expect(adminIdFilter([])).toBeNull()
  })

  it('returns parenthesized single ID', () => {
    expect(adminIdFilter(['id1'])).toBe('(id1)')
  })

  it('returns parenthesized comma-separated IDs', () => {
    expect(adminIdFilter(['id1', 'id2'])).toBe('(id1,id2)')
  })

  it('returns parenthesized format for multiple IDs', () => {
    expect(adminIdFilter(['a', 'b', 'c'])).toBe('(a,b,c)')
  })
})
