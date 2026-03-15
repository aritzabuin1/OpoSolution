/**
 * tests/unit/provider.test.ts
 *
 * Tests unitarios para lib/ai/provider.ts — capa unificada con fallback.
 *
 * Cobertura:
 *   callAI     — primary OK, primary fail → fallback, primary unavailable, circuit open, both fail
 *   callAIMini — same patterns
 *   callAIJSON — same patterns
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// ─── Hoisted mocks ──────────────────────────────────────────────────────────

const {
  mockCallClaude,
  mockCallClaudeHaiku,
  mockCallClaudeJSON,
  mockCallClaudeStream,
  mockClaudeCircuit,
  mockCallGPT,
  mockCallGPTMini,
  mockCallGPTJSON,
  mockCallGPTStream,
  mockOpenaiCircuit,
} = vi.hoisted(() => ({
  mockCallClaude: vi.fn(),
  mockCallClaudeHaiku: vi.fn(),
  mockCallClaudeJSON: vi.fn(),
  mockCallClaudeStream: vi.fn(),
  mockClaudeCircuit: { state: 'CLOSED' as string, failures: 0, lastFailureAt: 0 },
  mockCallGPT: vi.fn(),
  mockCallGPTMini: vi.fn(),
  mockCallGPTJSON: vi.fn(),
  mockCallGPTStream: vi.fn(),
  mockOpenaiCircuit: { state: 'CLOSED' as string, failures: 0, lastFailureAt: 0 },
}))

vi.mock('@/lib/ai/claude', () => ({
  callClaude: mockCallClaude,
  callClaudeHaiku: mockCallClaudeHaiku,
  callClaudeJSON: mockCallClaudeJSON,
  callClaudeStream: mockCallClaudeStream,
  circuit: mockClaudeCircuit,
  TEMPERATURES: { DETERMINISTIC: 0, BALANCED: 0.5, CREATIVE: 0.8 },
}))

vi.mock('@/lib/ai/openai', () => ({
  callGPT: mockCallGPT,
  callGPTMini: mockCallGPTMini,
  callGPTJSON: mockCallGPTJSON,
  callGPTStream: mockCallGPTStream,
  openaiCircuit: mockOpenaiCircuit,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
    child: vi.fn().mockReturnValue({
      debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    }),
  },
}))

// ─── Set env vars BEFORE importing provider (resolvePrimary runs at import) ──

// Force anthropic as primary for deterministic tests
process.env.AI_PRIMARY_PROVIDER = 'anthropic'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.OPENAI_API_KEY = 'test-openai-key'

// ─── Import under test ──────────────────────────────────────────────────────

import {
  callAI,
  callAIMini,
  callAIJSON,
  AI_PRIMARY_PROVIDER,
  AI_FALLBACK_PROVIDER,
} from '@/lib/ai/provider'

// ─── Test schema ─────────────────────────────────────────────────────────────

const TestSchema = z.object({ value: z.number() })

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resetCircuits() {
  mockClaudeCircuit.state = 'CLOSED'
  mockClaudeCircuit.failures = 0
  mockClaudeCircuit.lastFailureAt = 0
  mockOpenaiCircuit.state = 'CLOSED'
  mockOpenaiCircuit.failures = 0
  mockOpenaiCircuit.lastFailureAt = 0
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Provider layer — configuration', () => {
  it('resolves anthropic as primary when AI_PRIMARY_PROVIDER=anthropic', () => {
    expect(AI_PRIMARY_PROVIDER).toBe('anthropic')
    expect(AI_FALLBACK_PROVIDER).toBe('openai')
  })
})

// ─── callAI ──────────────────────────────────────────────────────────────────

describe('callAI (heavy model)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCircuits()
  })

  it('returns result when primary succeeds', async () => {
    mockCallClaude.mockResolvedValueOnce('Claude response')

    const result = await callAI('test prompt')

    expect(result).toBe('Claude response')
    expect(mockCallClaude).toHaveBeenCalledTimes(1)
    expect(mockCallGPT).not.toHaveBeenCalled()
  })

  it('falls back to secondary when primary throws', async () => {
    mockCallClaude.mockRejectedValueOnce(new Error('Claude API error'))
    mockCallGPT.mockResolvedValueOnce('GPT fallback response')

    const result = await callAI('test prompt')

    expect(result).toBe('GPT fallback response')
    expect(mockCallClaude).toHaveBeenCalledTimes(1)
    expect(mockCallGPT).toHaveBeenCalledTimes(1)
  })

  it('goes directly to secondary when primary has no API key', async () => {
    const origKey = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY

    mockCallGPT.mockResolvedValueOnce('GPT direct response')

    const result = await callAI('test prompt')

    expect(result).toBe('GPT direct response')
    expect(mockCallClaude).not.toHaveBeenCalled()
    expect(mockCallGPT).toHaveBeenCalledTimes(1)

    process.env.ANTHROPIC_API_KEY = origKey
  })

  it('goes directly to secondary when primary circuit is OPEN', async () => {
    mockClaudeCircuit.state = 'OPEN'
    mockCallGPT.mockResolvedValueOnce('GPT circuit-bypass response')

    const result = await callAI('test prompt')

    expect(result).toBe('GPT circuit-bypass response')
    expect(mockCallClaude).not.toHaveBeenCalled()
    expect(mockCallGPT).toHaveBeenCalledTimes(1)
  })

  it('throws fallback error when both providers fail', async () => {
    mockCallClaude.mockRejectedValueOnce(new Error('Claude down'))
    mockCallGPT.mockRejectedValueOnce(new Error('GPT also down'))

    await expect(callAI('test prompt')).rejects.toThrow('GPT also down')
  })
})

// ─── callAIMini ──────────────────────────────────────────────────────────────

describe('callAIMini (light model)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCircuits()
  })

  it('returns result when primary succeeds', async () => {
    mockCallClaudeHaiku.mockResolvedValueOnce('Haiku response')

    const result = await callAIMini('test prompt')

    expect(result).toBe('Haiku response')
    expect(mockCallClaudeHaiku).toHaveBeenCalledTimes(1)
    expect(mockCallGPTMini).not.toHaveBeenCalled()
  })

  it('falls back to secondary when primary throws', async () => {
    mockCallClaudeHaiku.mockRejectedValueOnce(new Error('Haiku error'))
    mockCallGPTMini.mockResolvedValueOnce('GPT-mini fallback')

    const result = await callAIMini('test prompt')

    expect(result).toBe('GPT-mini fallback')
    expect(mockCallClaudeHaiku).toHaveBeenCalledTimes(1)
    expect(mockCallGPTMini).toHaveBeenCalledTimes(1)
  })

  it('goes directly to secondary when primary has no API key', async () => {
    const origKey = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY

    mockCallGPTMini.mockResolvedValueOnce('GPT-mini direct')

    const result = await callAIMini('test prompt')

    expect(result).toBe('GPT-mini direct')
    expect(mockCallClaudeHaiku).not.toHaveBeenCalled()

    process.env.ANTHROPIC_API_KEY = origKey
  })

  it('goes directly to secondary when primary circuit is OPEN', async () => {
    mockClaudeCircuit.state = 'OPEN'
    mockCallGPTMini.mockResolvedValueOnce('GPT-mini circuit-bypass')

    const result = await callAIMini('test prompt')

    expect(result).toBe('GPT-mini circuit-bypass')
    expect(mockCallClaudeHaiku).not.toHaveBeenCalled()
  })

  it('throws fallback error when both providers fail', async () => {
    mockCallClaudeHaiku.mockRejectedValueOnce(new Error('Haiku down'))
    mockCallGPTMini.mockRejectedValueOnce(new Error('GPT-mini down'))

    await expect(callAIMini('test prompt')).rejects.toThrow('GPT-mini down')
  })
})

// ─── callAIJSON ──────────────────────────────────────────────────────────────

describe('callAIJSON (JSON + Zod validation)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCircuits()
  })

  it('returns validated result when primary succeeds', async () => {
    mockCallClaudeJSON.mockResolvedValueOnce({ value: 42 })

    const result = await callAIJSON('system', 'user', TestSchema)

    expect(result).toEqual({ value: 42 })
    expect(mockCallClaudeJSON).toHaveBeenCalledTimes(1)
    expect(mockCallGPTJSON).not.toHaveBeenCalled()
  })

  it('falls back to secondary when primary throws', async () => {
    mockCallClaudeJSON.mockRejectedValueOnce(new Error('Claude JSON error'))
    mockCallGPTJSON.mockResolvedValueOnce({ value: 99 })

    const result = await callAIJSON('system', 'user', TestSchema)

    expect(result).toEqual({ value: 99 })
    expect(mockCallClaudeJSON).toHaveBeenCalledTimes(1)
    expect(mockCallGPTJSON).toHaveBeenCalledTimes(1)
  })

  it('goes directly to secondary when primary has no API key', async () => {
    const origKey = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY

    mockCallGPTJSON.mockResolvedValueOnce({ value: 7 })

    const result = await callAIJSON('system', 'user', TestSchema)

    expect(result).toEqual({ value: 7 })
    expect(mockCallClaudeJSON).not.toHaveBeenCalled()

    process.env.ANTHROPIC_API_KEY = origKey
  })

  it('goes directly to secondary when primary circuit is OPEN', async () => {
    mockClaudeCircuit.state = 'OPEN'
    mockCallGPTJSON.mockResolvedValueOnce({ value: 55 })

    const result = await callAIJSON('system', 'user', TestSchema)

    expect(result).toEqual({ value: 55 })
    expect(mockCallClaudeJSON).not.toHaveBeenCalled()
  })

  it('throws fallback error when both providers fail', async () => {
    mockCallClaudeJSON.mockRejectedValueOnce(new Error('Claude JSON fail'))
    mockCallGPTJSON.mockRejectedValueOnce(new Error('GPT JSON fail'))

    await expect(callAIJSON('system', 'user', TestSchema)).rejects.toThrow('GPT JSON fail')
  })

  it('passes useHeavyModel option through to provider', async () => {
    mockCallClaudeJSON.mockResolvedValueOnce({ value: 1 })

    await callAIJSON('system', 'user', TestSchema, { useHeavyModel: true })

    expect(mockCallClaudeJSON).toHaveBeenCalledWith(
      'system',
      'user',
      TestSchema,
      expect.objectContaining({ model: 'claude-sonnet-4-6' })
    )
  })
})
