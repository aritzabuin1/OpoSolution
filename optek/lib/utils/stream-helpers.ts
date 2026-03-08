import { logger } from '@/lib/logger'

/**
 * lib/utils/stream-helpers.ts
 *
 * Shared helpers for AI streaming endpoints.
 * Ensures: credit only deducted on full completion, errors logged,
 * stream properly closed on failure.
 */

interface StreamPipeOptions {
  aiStream: ReadableStream<string>
  userId: string
  /** Called on successful completion to deduct credit */
  onComplete: () => Promise<void>
  /** Label for logging */
  endpoint: string
  /** Additional context for logs */
  context?: Record<string, unknown>
}

/**
 * Creates a safe ReadableStream that pipes AI text to the client.
 *
 * - Encodes string chunks to bytes
 * - Deducts credit ONLY on successful completion (BUG-010 pattern)
 * - Logs errors without crashing
 * - Properly cleans up reader on cancel
 */
export function createSafeStreamResponse(opts: StreamPipeOptions): Response {
  const { aiStream, userId, onComplete, endpoint, context } = opts
  const log = logger.child({ endpoint, userId, ...context })
  const reader = aiStream.getReader()
  const encoder = new TextEncoder()
  let bytesSent = 0

  const responseStream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) {
          // Stream completed successfully — safe to deduct credit
          try {
            await onComplete()
          } catch (creditErr) {
            log.error({ err: creditErr, userId, bytesSent }, 'Failed to deduct credit after stream completion')
          }
          log.info({ userId, bytesSent }, 'stream completed')
          controller.close()
          return
        }
        const encoded = encoder.encode(value)
        bytesSent += encoded.length
        controller.enqueue(encoded)
      } catch (err) {
        log.error({ err, bytesSent }, 'error during stream — closing without credit deduction')
        // If we already sent data, close gracefully (client has partial content)
        // If no data sent, propagate error
        if (bytesSent > 0) {
          controller.close()
        } else {
          controller.error(err)
        }
      }
    },
    cancel() {
      log.info({ userId, bytesSent }, 'stream cancelled by client')
      reader.cancel()
    },
  })

  return new Response(responseStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
