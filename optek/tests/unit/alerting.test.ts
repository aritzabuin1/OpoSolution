/**
 * tests/unit/alerting.test.ts
 *
 * Tests unitarios para sendAlert() en lib/admin/alerting.ts.
 *
 * Cobertura:
 *   - Logging: critical → error, warning → warn, info → info
 *   - Email: solo critical + RESEND_API_KEY
 *   - Graceful: email falla → no crashea
 *
 * Nota: alerting.ts usa dynamic import('resend'), por eso se mockea
 * como módulo global con clase constructora.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockLogError = vi.fn()
const mockLogWarn = vi.fn()
const mockLogInfo = vi.fn()
const mockSend = vi.fn()

vi.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLogError(...args),
    warn: (...args: unknown[]) => mockLogWarn(...args),
    info: (...args: unknown[]) => mockLogInfo(...args),
  },
}))

// alerting.ts uses dynamic import('resend') — mock at module level with class
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSend }
  },
}))

describe('sendAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.RESEND_API_KEY
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
  })

  it('critical alert → logger.error', async () => {
    const { sendAlert } = await import('@/lib/admin/alerting')
    await sendAlert({ severity: 'critical', title: 'DB Down', message: 'Supabase unreachable' })

    expect(mockLogError).toHaveBeenCalled()
    expect(mockLogError.mock.calls[0][1]).toContain('Supabase unreachable')
  })

  it('warning alert → logger.warn', async () => {
    const { sendAlert } = await import('@/lib/admin/alerting')
    await sendAlert({ severity: 'warning', title: 'High cost', message: '$15 today' })

    expect(mockLogWarn).toHaveBeenCalled()
  })

  it('info alert → logger.info', async () => {
    const { sendAlert } = await import('@/lib/admin/alerting')
    await sendAlert({ severity: 'info', title: 'Deploy', message: 'New version live' })

    expect(mockLogInfo).toHaveBeenCalled()
  })

  it('critical + RESEND_API_KEY → envía email', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    mockSend.mockResolvedValueOnce({ data: { id: 'a-1' } })

    const { sendAlert } = await import('@/lib/admin/alerting')
    await sendAlert({ severity: 'critical', title: 'Outage', message: 'Service down' })

    expect(mockSend).toHaveBeenCalledTimes(1)
    const emailArgs = mockSend.mock.calls[0][0]
    expect(emailArgs.subject).toContain('Outage')
    expect(emailArgs.text).toContain('Service down')
  })

  it('critical sin RESEND_API_KEY → NO envía email', async () => {
    const { sendAlert } = await import('@/lib/admin/alerting')
    await sendAlert({ severity: 'critical', title: 'Outage', message: 'Service down' })

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('warning con RESEND_API_KEY → NO envía email (solo critical)', async () => {
    process.env.RESEND_API_KEY = 'test-key'

    const { sendAlert } = await import('@/lib/admin/alerting')
    await sendAlert({ severity: 'warning', title: 'Slow', message: 'p95 > 2s' })

    expect(mockSend).not.toHaveBeenCalled()
  })

  it('email falla → no crashea (graceful degradation)', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    mockSend.mockRejectedValueOnce(new Error('Resend down'))

    const { sendAlert } = await import('@/lib/admin/alerting')
    // Should not throw
    await expect(
      sendAlert({ severity: 'critical', title: 'Test', message: 'Test' })
    ).resolves.not.toThrow()
  })

  it('metadata se incluye en el log', async () => {
    const { sendAlert } = await import('@/lib/admin/alerting')
    await sendAlert({
      severity: 'warning',
      title: 'Cost',
      message: 'Over budget',
      metadata: { amount: 15.50, currency: 'USD' },
    })

    const logArg = mockLogWarn.mock.calls[0][0]
    expect(logArg.amount).toBe(15.50)
    expect(logArg.currency).toBe('USD')
  })
})
