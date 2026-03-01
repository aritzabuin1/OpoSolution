/**
 * lib/email/client.ts — §1.16
 *
 * Wrapper de Resend para envío de emails transaccionales de OPTEK.
 *
 * Uso:
 *   import { sendWelcomeEmail, sendDeletionConfirmEmail } from '@/lib/email/client'
 *
 * Condicional: si RESEND_API_KEY no está configurado → log warning + no-op.
 * Esto permite desplegar sin email y activarlo cuando Resend esté listo.
 *
 * Ref: §1.16 PLAN.md
 */

import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const FROM_ADDRESS = 'OPTEK <noreply@optek.es>'
const REPLY_TO = 'hola@optek.es'

// ─── Cliente (lazy — solo si RESEND_API_KEY está configurado) ─────────────────

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('Resend no configurado — email desactivado (RESEND_API_KEY no encontrado)')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

// ─── Templates HTML ───────────────────────────────────────────────────────────

function welcomeHtml(nombre: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a OPTEK</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <!-- Header -->
        <tr>
          <td style="background:#1B4F72;padding:32px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">OPTEK</span>
            <p style="color:#A9CCE3;margin:4px 0 0;font-size:13px;">Tu Entrenador Personal de Oposiciones</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
              ¡Bienvenido${nombre ? `, ${nombre}` : ''}! 👋
            </h1>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
              Tu cuenta en OPTEK ya está activa. Tienes <strong>5 tests gratuitos</strong> y
              <strong>2 correcciones gratuitas</strong> para empezar a preparar tu oposición hoy mismo.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              Así funciona OPTEK:
            </p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
              <tr>
                <td style="padding:12px;background:#EFF6FF;border-radius:8px;margin-bottom:8px;">
                  <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">1. Genera tests personalizados</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#3b82f6;">Elige un tema del temario → la IA genera preguntas tipo test con citas legales verificadas</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:12px;background:#F0FDF4;border-radius:8px;">
                  <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">2. Corrige tus desarrollos</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#16a34a;">Escribe sobre un tema → el corrector evalúa tu texto y te da feedback jurídico detallado</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:12px;background:#FFF7ED;border-radius:8px;">
                  <p style="margin:0;font-size:14px;color:#9a3412;font-weight:600;">3. Sigue tu progreso</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#ea580c;">Tu dashboard muestra evolución, rachas y los temas donde más necesitas practicar</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://optek.es'}/dashboard"
                     style="display:inline-block;padding:14px 32px;background:#1B4F72;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                    Empezar mi primer test →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;line-height:1.5;">
              OPTEK · Tu entrenador de oposiciones con IA<br/>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://optek.es'}/legal/privacidad" style="color:#6b7280;">Política de privacidad</a> ·
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://optek.es'}/cuenta" style="color:#6b7280;">Gestionar cuenta</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`.trim()
}

function deletionConfirmHtml(nombre: string, confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de eliminación de cuenta — OPTEK</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr>
          <td style="background:#7f1d1d;padding:32px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:24px;font-weight:700;">OPTEK</span>
            <p style="color:#fca5a5;margin:4px 0 0;font-size:13px;">Solicitud de eliminación de cuenta</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:700;">
              Confirmación requerida
            </h1>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
              Hola${nombre ? ` ${nombre}` : ''}, hemos recibido una solicitud para eliminar tu cuenta de OPTEK.
            </p>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
              <strong>Esta acción es irreversible.</strong> Se borrarán todos tus tests, correcciones, progreso y logros.
              Los registros de compra se conservarán durante 4 años por obligación legal (Ley 58/2003 General Tributaria).
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              Si fuiste tú quien solicitó esta eliminación, confirma haciendo clic en el botón:
            </p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
              <tr>
                <td align="center">
                  <a href="${confirmUrl}"
                     style="display:inline-block;padding:14px 32px;background:#dc2626;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                    Confirmar eliminación de cuenta
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
              Este enlace expira en 24 horas. Si no solicitaste la eliminación, puedes ignorar este email —
              tu cuenta está segura.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;">
              OPTEK · Si tienes problemas, responde a este email o escríbenos a ${REPLY_TO}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`.trim()
}

// ─── Funciones públicas ───────────────────────────────────────────────────────

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Envía el email de bienvenida tras el registro del usuario.
 * §1.16.5
 */
export async function sendWelcomeEmail(params: {
  to: string
  nombre?: string
}): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) return { success: false, error: 'Resend no configurado' }

  const log = logger.child({ route: 'email:welcome' })

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: [params.to],
      subject: '¡Bienvenido a OPTEK! Tus 5 tests gratuitos te esperan',
      html: welcomeHtml(params.nombre ?? ''),
    })

    if (error) {
      log.error({ err: error, to: params.to }, 'Error enviando email de bienvenida')
      return { success: false, error: error.message }
    }

    log.info({ id: data?.id, to: params.to }, 'Email de bienvenida enviado')
    return { success: true, id: data?.id }
  } catch (err) {
    log.error({ err }, 'Excepción enviando email de bienvenida')
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Envía el email de confirmación de eliminación de cuenta.
 * §1.16.6 + §1.17.2 (flujo post-Resend)
 */
export async function sendDeletionConfirmEmail(params: {
  to: string
  nombre?: string
  confirmToken: string
}): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) return { success: false, error: 'Resend no configurado' }

  const log = logger.child({ route: 'email:deletion-confirm' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://optek.es'
  const confirmUrl = `${appUrl}/api/user/delete/confirm?token=${params.confirmToken}`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: [params.to],
      subject: 'Confirma la eliminación de tu cuenta de OPTEK',
      html: deletionConfirmHtml(params.nombre ?? '', confirmUrl),
    })

    if (error) {
      log.error({ err: error, to: params.to }, 'Error enviando email de confirmación de borrado')
      return { success: false, error: error.message }
    }

    log.info({ id: data?.id }, 'Email de confirmación de borrado enviado')
    return { success: true, id: data?.id }
  } catch (err) {
    log.error({ err }, 'Excepción enviando email de confirmación de borrado')
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Envía notificación a Aritz cuando se recibe una sugerencia nueva.
 * §2.7.6
 */
export async function sendFeedbackNotification(params: {
  tipo: string
  mensaje: string
  paginaOrigen?: string
}): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) return { success: false, error: 'Resend no configurado' }

  const adminEmail = process.env.ADMIN_EMAIL ?? REPLY_TO

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: [adminEmail],
      subject: `[OPTEK] Nueva sugerencia: ${params.tipo}`,
      text: [
        `Tipo: ${params.tipo}`,
        `Página: ${params.paginaOrigen ?? '(desconocida)'}`,
        '',
        params.mensaje,
      ].join('\n'),
    })

    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
