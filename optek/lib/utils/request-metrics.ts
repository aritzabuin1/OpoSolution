/**
 * In-memory request latency tracker for observability.
 * Tracks p50/p95/p99 latencies per endpoint.
 * Resets every hour to prevent memory growth.
 */

const MAX_SAMPLES = 1000
const RESET_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

interface EndpointMetrics {
  samples: number[]
  lastReset: number
}

const metrics = new Map<string, EndpointMetrics>()

export function recordLatency(endpoint: string, latencyMs: number): void {
  let m = metrics.get(endpoint)
  if (!m || Date.now() - m.lastReset > RESET_INTERVAL_MS) {
    m = { samples: [], lastReset: Date.now() }
    metrics.set(endpoint, m)
  }
  if (m.samples.length >= MAX_SAMPLES) {
    m.samples.shift() // FIFO eviction
  }
  m.samples.push(latencyMs)
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

export function getMetrics(endpoint: string) {
  const m = metrics.get(endpoint)
  if (!m || m.samples.length === 0) return null

  const sorted = [...m.samples].sort((a, b) => a - b)
  return {
    count: sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

export function getAllMetrics() {
  const result: Record<string, ReturnType<typeof getMetrics>> = {}
  for (const [endpoint] of metrics) {
    result[endpoint] = getMetrics(endpoint)
  }
  return result
}
