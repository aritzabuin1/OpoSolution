/**
 * lib/utils/timeout.ts
 *
 * Request-level timeout utility for wrapping long-running operations.
 * Prevents hanging requests in serverless environments.
 */

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

/**
 * Wraps an async operation with a timeout.
 * If the operation doesn't complete within `ms`, throws TimeoutError.
 */
export async function withTimeout<T>(
  operation: Promise<T>,
  ms: number
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms)
  })

  try {
    return await Promise.race([operation, timeout])
  } finally {
    clearTimeout(timer!)
  }
}
