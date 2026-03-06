/**
 * lib/utils/retry.ts
 *
 * Exponential backoff retry decorator for transient errors.
 * Use for Supabase queries, external API calls, and network operations.
 */

import { logger } from '@/lib/logger'

interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  retryOn?: (error: unknown) => boolean
}

const TRANSIENT_CODES = new Set([
  'PGRST301',  // Supabase connection error
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'FETCH_ERROR',
])

function isTransient(error: unknown): boolean {
  if (error instanceof Error) {
    if (TRANSIENT_CODES.has((error as { code?: string }).code ?? '')) return true
    if (error.message.includes('fetch failed')) return true
    if (error.message.includes('network')) return true
    if (error.message.includes('ECONNRESET')) return true
    if (error.message.includes('socket hang up')) return true
  }
  return false
}

/**
 * Retries an async operation with exponential backoff.
 * Only retries on transient errors by default (network, connection reset).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 200,
    maxDelayMs = 5000,
    retryOn = isTransient,
  } = options

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const shouldRetry = attempt < maxAttempts && retryOn(error)

      if (!shouldRetry) throw error

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs)
      logger.warn(
        { attempt, maxAttempts, delay, label, error: (error as Error).message },
        'Retrying after transient error'
      )
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error(`${label}: max attempts reached`)
}
