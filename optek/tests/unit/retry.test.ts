/**
 * tests/unit/retry.test.ts
 *
 * Tests unitarios para withRetry() en lib/utils/retry.ts.
 *
 * Cobertura:
 *   - Happy path: primera llamada exitosa
 *   - Retry en error transiente → éxito en intento 2
 *   - No retry en error no-transiente
 *   - Agotar intentos → lanza último error
 *   - Custom retryOn predicate
 *   - Backoff exponencial
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}))

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna resultado en primera llamada exitosa', async () => {
    const { withRetry } = await import('@/lib/utils/retry')
    const fn = vi.fn().mockResolvedValue('ok')

    const result = await withRetry(fn, 'test')
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('reintenta en ECONNRESET y luego éxito', async () => {
    const { withRetry } = await import('@/lib/utils/retry')

    const econnError = Object.assign(new Error('Connection reset'), { code: 'ECONNRESET' })
    const fn = vi.fn()
      .mockRejectedValueOnce(econnError)
      .mockResolvedValueOnce('recovered')

    const promise = withRetry(fn, 'test', { baseDelayMs: 10 })
    // Advance timers to allow retry delay
    await vi.advanceTimersByTimeAsync(100)
    const result = await promise

    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('reintenta en "fetch failed" message', async () => {
    const { withRetry } = await import('@/lib/utils/retry')

    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce('ok')

    const promise = withRetry(fn, 'test', { baseDelayMs: 10 })
    await vi.advanceTimersByTimeAsync(100)
    const result = await promise

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('reintenta en PGRST301 (Supabase connection error)', async () => {
    const { withRetry } = await import('@/lib/utils/retry')

    const pgError = Object.assign(new Error('Supabase down'), { code: 'PGRST301' })
    const fn = vi.fn()
      .mockRejectedValueOnce(pgError)
      .mockResolvedValueOnce('db-ok')

    const promise = withRetry(fn, 'test', { baseDelayMs: 10 })
    await vi.advanceTimersByTimeAsync(100)
    const result = await promise

    expect(result).toBe('db-ok')
  })

  it('NO reintenta en error no-transiente (TypeError)', async () => {
    const { withRetry } = await import('@/lib/utils/retry')

    const fn = vi.fn().mockRejectedValue(new TypeError('Cannot read properties'))

    await expect(withRetry(fn, 'test')).rejects.toThrow('Cannot read properties')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('agota maxAttempts y lanza último error', async () => {
    vi.useRealTimers() // Use real timers to avoid unhandled rejection with fake timers
    const { withRetry } = await import('@/lib/utils/retry')

    let callCount = 0
    const fn = vi.fn(() => {
      callCount++
      return Promise.reject(Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' }))
    })

    await expect(
      withRetry(fn, 'test', { maxAttempts: 3, baseDelayMs: 1 })
    ).rejects.toThrow('ECONNRESET')
    expect(callCount).toBe(3)

    vi.useFakeTimers() // Restore for afterEach
  })

  it('custom retryOn predicate', async () => {
    const { withRetry } = await import('@/lib/utils/retry')

    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('custom-retriable'))
      .mockResolvedValueOnce('ok')

    const promise = withRetry(fn, 'test', {
      baseDelayMs: 10,
      retryOn: (err) => err instanceof Error && err.message === 'custom-retriable',
    })
    await vi.advanceTimersByTimeAsync(100)
    const result = await promise

    expect(result).toBe('ok')
  })

  it('backoff exponencial: delay crece', async () => {
    const { withRetry } = await import('@/lib/utils/retry')
    const { logger } = await import('@/lib/logger')

    const econnError = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' })
    const fn = vi.fn()
      .mockRejectedValueOnce(econnError)
      .mockRejectedValueOnce(econnError)
      .mockResolvedValueOnce('ok')

    const promise = withRetry(fn, 'test', { maxAttempts: 3, baseDelayMs: 200 })
    // First retry: 200ms, second retry: 400ms
    await vi.advanceTimersByTimeAsync(1000)
    await promise

    // Check logger was called with increasing delays
    const warnCalls = vi.mocked(logger.warn).mock.calls
    expect(warnCalls.length).toBe(2)
    // First attempt delay = 200
    expect(warnCalls[0][0]).toHaveProperty('delay', 200)
    // Second attempt delay = 400
    expect(warnCalls[1][0]).toHaveProperty('delay', 400)
  })

  it('maxDelayMs limita el backoff', async () => {
    const { withRetry } = await import('@/lib/utils/retry')
    const { logger } = await import('@/lib/logger')

    const econnError = Object.assign(new Error('network'), { code: 'ECONNRESET' })
    const fn = vi.fn()
      .mockRejectedValueOnce(econnError)
      .mockRejectedValueOnce(econnError)
      .mockRejectedValueOnce(econnError)
      .mockRejectedValueOnce(econnError)
      .mockResolvedValueOnce('ok')

    const promise = withRetry(fn, 'test', { maxAttempts: 5, baseDelayMs: 200, maxDelayMs: 500 })
    await vi.advanceTimersByTimeAsync(10000)
    await promise

    // Delays: 200, 400, 500 (capped), 500 (capped)
    const warnCalls = vi.mocked(logger.warn).mock.calls
    expect(warnCalls[2][0]).toHaveProperty('delay', 500) // Capped
    expect(warnCalls[3][0]).toHaveProperty('delay', 500) // Capped
  })
})
