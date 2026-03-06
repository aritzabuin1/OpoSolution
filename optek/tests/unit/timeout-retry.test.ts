/**
 * tests/unit/timeout-retry.test.ts
 *
 * Tests for lib/utils/timeout.ts and lib/utils/retry.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withTimeout, TimeoutError } from '@/lib/utils/timeout'
import { withRetry } from '@/lib/utils/retry'

// ─── withTimeout ─────────────────────────────────────────────────────────────

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('resolves if operation completes before timeout', async () => {
    const result = await withTimeout(Promise.resolve(42), 5000)
    expect(result).toBe(42)
  })

  it('throws TimeoutError if operation exceeds timeout', async () => {
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve('late'), 10_000)
    })

    const promise = withTimeout(slow, 100)
    vi.advanceTimersByTime(200)

    await expect(promise).rejects.toThrow(TimeoutError)
    await expect(promise).rejects.toThrow('timed out after 100ms')
  })

  it('TimeoutError has correct name', () => {
    const err = new TimeoutError(5000)
    expect(err.name).toBe('TimeoutError')
    expect(err.message).toContain('5000ms')
  })

  it('clears timer on successful completion', async () => {
    const clearSpy = vi.spyOn(global, 'clearTimeout')
    await withTimeout(Promise.resolve('ok'), 5000)
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})

// ─── withRetry ───────────────────────────────────────────────────────────────

describe('withRetry', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('returns result on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const result = await withRetry(fn, 'test-op', { maxAttempts: 3 })
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on transient errors and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValue('recovered')

    const result = await withRetry(fn, 'test-op', {
      maxAttempts: 3,
      baseDelayMs: 10,
    })

    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws immediately on non-transient errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Invalid input'))

    await expect(
      withRetry(fn, 'test-op', { maxAttempts: 3, baseDelayMs: 10 })
    ).rejects.toThrow('Invalid input')

    expect(fn).toHaveBeenCalledTimes(1) // no retry
  })

  it('respects maxAttempts limit', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fetch failed'))

    await expect(
      withRetry(fn, 'test-op', { maxAttempts: 2, baseDelayMs: 10 })
    ).rejects.toThrow('fetch failed')

    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('uses custom retryOn predicate', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('custom error'))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, 'test-op', {
      maxAttempts: 3,
      baseDelayMs: 10,
      retryOn: (err) => (err as Error).message === 'custom error',
    })

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on ECONNRESET', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, 'test-op', {
      maxAttempts: 3,
      baseDelayMs: 10,
    })

    expect(result).toBe('ok')
  })

  it('retries on socket hang up', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, 'test-op', {
      maxAttempts: 3,
      baseDelayMs: 10,
    })

    expect(result).toBe('ok')
  })
})
