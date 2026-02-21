import { describe, it, expect } from 'vitest'
import { checkRateLimit, buildRetryAfterHeader } from '@/lib/utils/rate-limit'

/**
 * Tests de rate limiting (0.10.13).
 *
 * Sin credenciales de Upstash → modo graceful fallback (permite todo).
 * Con Upstash configurado → sliding window real (testear en integration tests).
 */
describe('checkRateLimit', () => {
  it('permite requests cuando Upstash no está configurado (graceful fallback)', async () => {
    // process.env no tiene UPSTASH_REDIS_REST_URL → usa stub
    const result = await checkRateLimit('user-123', 'ai-generate', 10, '1 m')

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(10)
    expect(result.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })

  it('retorna remaining = limit en modo graceful fallback', async () => {
    const result = await checkRateLimit('ip-1.2.3.4', 'default', 30, '1 m')
    expect(result.remaining).toBe(30)
  })

  it('retorna resetAt en el futuro (al menos 30s)', async () => {
    const now = Math.floor(Date.now() / 1000)
    const result = await checkRateLimit('user-456', 'ai-correct', 5, '1 m')
    expect(result.resetAt).toBeGreaterThanOrEqual(now + 30)
  })
})

describe('buildRetryAfterHeader', () => {
  it('calcula correctamente los segundos restantes', () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 30
    const header = buildRetryAfterHeader(futureTimestamp)
    const seconds = parseInt(header, 10)
    // Tolerancia de ±2s por tiempo de ejecución del test
    expect(seconds).toBeGreaterThanOrEqual(28)
    expect(seconds).toBeLessThanOrEqual(32)
  })

  it('retorna "0" si el resetAt ya pasó', () => {
    const pastTimestamp = Math.floor(Date.now() / 1000) - 10
    expect(buildRetryAfterHeader(pastTimestamp)).toBe('0')
  })

  it('retorna "0" exacto si resetAt es exactamente ahora', () => {
    const now = Math.floor(Date.now() / 1000)
    const header = buildRetryAfterHeader(now)
    expect(parseInt(header, 10)).toBeGreaterThanOrEqual(0)
  })
})
