import { describe, it, expect } from 'vitest'
import { getDashboardPhase } from '../../lib/utils/dashboard-phase'

describe('getDashboardPhase', () => {
  it('returns "new" when 0 tests', () => {
    expect(getDashboardPhase(0, 0, null)).toBe('new')
  })

  it('returns "starting" when 1-2 tests', () => {
    expect(getDashboardPhase(1, 1, '2026-03-18')).toBe('starting')
    expect(getDashboardPhase(2, 2, '2026-03-18')).toBe('starting')
  })

  it('returns "active" when 3+ tests with active racha', () => {
    expect(getDashboardPhase(3, 3, '2026-03-18')).toBe('active')
    expect(getDashboardPhase(5, 3, '2026-03-18')).toBe('active')
    expect(getDashboardPhase(50, 10, '2026-03-18')).toBe('active')
  })

  it('returns "active" when 3+ tests, racha=0 but last test < 7 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
    expect(getDashboardPhase(10, 0, threeDaysAgo)).toBe('active')
  })

  it('returns "lapsed" when 3+ tests, racha=0, last test >= 7 days ago', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10)
    expect(getDashboardPhase(10, 0, eightDaysAgo)).toBe('lapsed')
  })

  it('returns "active" when 3+ tests, racha=0, no ultimo_test_dia', () => {
    expect(getDashboardPhase(3, 0, null)).toBe('active')
  })

  it('returns "lapsed" at exactly 7 days boundary', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    expect(getDashboardPhase(5, 0, sevenDaysAgo)).toBe('lapsed')
  })

  it('returns "active" at 6 days (not yet lapsed)', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
    expect(getDashboardPhase(5, 0, sixDaysAgo)).toBe('active')
  })

  it('returns "starting" when exactly 2 tests regardless of racha', () => {
    expect(getDashboardPhase(2, 0, null)).toBe('starting')
    expect(getDashboardPhase(2, 2, '2026-03-18')).toBe('starting')
  })

  it('returns "active" when exactly 3 tests with racha > 0', () => {
    expect(getDashboardPhase(3, 1, '2026-03-18')).toBe('active')
  })
})
