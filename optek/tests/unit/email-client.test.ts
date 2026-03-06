/**
 * tests/unit/email-client.test.ts
 *
 * Tests unitarios para lib/email/client.ts.
 *
 * Cobertura:
 *   - sendWelcomeEmail: happy path, sin Resend, error API
 *   - sendDeletionConfirmEmail: URL construction, token in URL
 *   - sendFeedbackNotification: plain text, admin email
 *   - Graceful degradation sin RESEND_API_KEY
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock resend — must be a class constructor
const mockSend = vi.fn()
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSend }
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    child: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
    warn: vi.fn(),
  },
}))

describe('email client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-key'
    process.env.NEXT_PUBLIC_APP_URL = 'https://oporuta.es'
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  // ─── sendWelcomeEmail ──────────────────────────────────────────────────────

  describe('sendWelcomeEmail', () => {
    it('envía email de bienvenida correctamente', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'msg-123' }, error: null })

      const { sendWelcomeEmail } = await import('@/lib/email/client')
      const result = await sendWelcomeEmail({ to: 'test@example.com', nombre: 'Juan' })

      expect(result.success).toBe(true)
      expect(result.id).toBe('msg-123')
      expect(mockSend).toHaveBeenCalledTimes(1)

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.to).toEqual(['test@example.com'])
      expect(callArgs.subject).toContain('Bienvenido')
      expect(callArgs.html).toContain('Juan')
    })

    it('envía sin nombre', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'msg-456' }, error: null })

      const { sendWelcomeEmail } = await import('@/lib/email/client')
      const result = await sendWelcomeEmail({ to: 'test@example.com' })

      expect(result.success).toBe(true)
    })

    it('retorna error cuando Resend no está configurado', async () => {
      delete process.env.RESEND_API_KEY

      const { sendWelcomeEmail } = await import('@/lib/email/client')
      const result = await sendWelcomeEmail({ to: 'test@example.com' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Resend no configurado')
    })

    it('maneja error de API de Resend', async () => {
      mockSend.mockResolvedValueOnce({ data: null, error: { message: 'Rate limit' } })

      const { sendWelcomeEmail } = await import('@/lib/email/client')
      const result = await sendWelcomeEmail({ to: 'test@example.com' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Rate limit')
    })

    it('maneja excepción inesperada', async () => {
      mockSend.mockRejectedValueOnce(new Error('Network error'))

      const { sendWelcomeEmail } = await import('@/lib/email/client')
      const result = await sendWelcomeEmail({ to: 'test@example.com' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  // ─── sendDeletionConfirmEmail ──────────────────────────────────────────────

  describe('sendDeletionConfirmEmail', () => {
    it('construye URL de confirmación con token', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'del-1' }, error: null })

      const { sendDeletionConfirmEmail } = await import('@/lib/email/client')
      await sendDeletionConfirmEmail({
        to: 'test@example.com',
        nombre: 'Ana',
        confirmToken: 'abc-123-xyz',
      })

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain('https://oporuta.es/api/user/delete/confirm?token=abc-123-xyz')
      expect(callArgs.html).toContain('Ana')
      expect(callArgs.subject).toContain('eliminación')
    })

    it('HTML contiene aviso de irreversibilidad', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'del-2' }, error: null })

      const { sendDeletionConfirmEmail } = await import('@/lib/email/client')
      await sendDeletionConfirmEmail({
        to: 'test@example.com',
        confirmToken: 'token-xyz',
      })

      const html = mockSend.mock.calls[0][0].html
      expect(html).toContain('irreversible')
      expect(html).toContain('4 años')
      expect(html).toContain('Ley 58/2003')
    })
  })

  // ─── sendFeedbackNotification ──────────────────────────────────────────────

  describe('sendFeedbackNotification', () => {
    it('envía notificación de feedback al admin', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'fb-1' }, error: null })

      const { sendFeedbackNotification } = await import('@/lib/email/client')
      const result = await sendFeedbackNotification({
        tipo: 'bug',
        mensaje: 'El test no carga',
        paginaOrigen: '/tests',
      })

      expect(result.success).toBe(true)
      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.subject).toContain('bug')
      expect(callArgs.text).toContain('El test no carga')
      expect(callArgs.text).toContain('/tests')
    })

    it('usa "(desconocida)" cuando no hay paginaOrigen', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'fb-2' }, error: null })

      const { sendFeedbackNotification } = await import('@/lib/email/client')
      await sendFeedbackNotification({ tipo: 'sugerencia', mensaje: 'Más temas' })

      const text = mockSend.mock.calls[0][0].text
      expect(text).toContain('(desconocida)')
    })
  })
})
