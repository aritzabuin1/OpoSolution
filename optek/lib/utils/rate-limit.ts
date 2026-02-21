import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiting para OPTEK — @upstash/ratelimit con Sliding Window.
 *
 * DDIA Reliability: graceful degradation cuando Upstash no está configurado
 *   → permite todas las requests (sin bloqueo) en dev local o si Redis no disponible.
 *
 * Límites (ref: directives/OPTEK_security.md §5):
 *   /api/ai/generate-test      → 10 req / 1 m  por usuario
 *   /api/ai/correct-desarrollo → 5 req / 1 m   por usuario
 *   /api/stripe/*              → 20 req / 1 m  por usuario
 *   Default (por IP)           → 30 req / 1 m
 *
 * Configurar en .env.local:
 *   UPSTASH_REDIS_REST_URL=https://...upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=...
 */

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number // Unix timestamp en segundos
}

// ─── Inicialización lazy de Redis ─────────────────────────────────────────────

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null // Upstash no configurado — modo graceful degradation
  }
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return redis
}

// Cache de limiters por (limit, window) para evitar instancias duplicadas
type Duration = `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`
const limiters = new Map<string, Ratelimit>()

function getLimiter(limit: number, window: Duration): Ratelimit | null {
  const r = getRedis()
  if (!r) return null

  const key = `${limit}:${window}`
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: false, // Desactivar analytics para ahorrar comandos Redis
      })
    )
  }
  return limiters.get(key)!
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Verifica el rate limit para un identificador dado.
 *
 * @param identifier - user_id o IP del cliente
 * @param _endpoint  - nombre del endpoint (para logging)
 * @param limit      - número máximo de requests en la ventana
 * @param window     - ventana de tiempo en formato Upstash: "1 m", "5 s", "1 h"
 */
export async function checkRateLimit(
  identifier: string,
  _endpoint: string,
  limit: number,
  window: Duration
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, window)

  if (!limiter) {
    // Graceful fallback: Upstash no configurado → permitir todo
    return {
      success: true,
      remaining: limit,
      resetAt: Math.floor(Date.now() / 1000) + 60,
    }
  }

  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    resetAt: Math.floor(result.reset / 1000), // ms → seconds
  }
}

/**
 * Construye el valor del header Retry-After en segundos.
 */
export function buildRetryAfterHeader(resetAt: number): string {
  return String(Math.max(0, resetAt - Math.floor(Date.now() / 1000)))
}
