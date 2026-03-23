/**
 * lib/email/client.ts — §1.16
 *
 * Wrapper de Resend para envío de emails transaccionales de OpoRuta.
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

const FROM_ADDRESS = 'OpoRuta <noreply@oporuta.es>'
const REPLY_TO = 'hola@oporuta.es'

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
  <title>Bienvenido a OpoRuta</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <!-- Header -->
        <tr>
          <td style="background:#1B4F72;padding:32px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">OpoRuta</span>
            <p style="color:#A9CCE3;margin:4px 0 0;font-size:13px;">El camino más corto hacia el aprobado</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
              ¡Bienvenido${nombre ? `, ${nombre}` : ''} a tu ruta! 👋
            </h1>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
              Tu cuenta en OpoRuta ya está activa. Tienes <strong>5 tests gratuitos</strong> en 3 temas de muestra,
              <strong>1 simulacro oficial</strong> y <strong>2 análisis detallados</strong> para empezar a avanzar hacia el aprobado hoy mismo.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              Tu ruta tiene tres etapas clave:
            </p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
              <tr>
                <td style="padding:12px;background:#EFF6FF;border-radius:8px;margin-bottom:8px;">
                  <p style="margin:0;font-size:14px;color:#1e40af;font-weight:600;">1. Descubre qué pregunta el tribunal</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#3b82f6;">El Radar del Tribunal analiza exámenes INAP reales y te muestra los artículos más frecuentes. No estudies a ciegas.</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:12px;background:#F0FDF4;border-radius:8px;">
                  <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">2. Practica con citas verificadas</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#16a34a;">OpoRuta genera tests desde la legislación oficial. Cada artículo comprobado antes de llegar a ti. Sin alucinaciones, sin inventos.</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="padding:12px;background:#FFF7ED;border-radius:8px;">
                  <p style="margin:0;font-size:14px;color:#9a3412;font-weight:600;">3. Mide tu avance real</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#ea580c;">Tu dashboard muestra evolución por tema, rachas y dónde necesitas reforzar para llegar al aprobado.</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'}/dashboard"
                     style="display:inline-block;padding:14px 32px;background:#1B4F72;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
                    Iniciar mi primera etapa →
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
              OpoRuta · El camino más corto hacia el aprobado<br/>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'}/legal/privacidad" style="color:#6b7280;">Política de privacidad</a> ·
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'}/cuenta" style="color:#6b7280;">Gestionar cuenta</a>
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
  <title>Confirmación de eliminación de cuenta — OpoRuta</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr>
          <td style="background:#7f1d1d;padding:32px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:24px;font-weight:700;">OpoRuta</span>
            <p style="color:#fca5a5;margin:4px 0 0;font-size:13px;">Solicitud de eliminación de cuenta</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 16px;font-size:20px;color:#111827;font-weight:700;">
              Confirmación requerida
            </h1>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
              Hola${nombre ? ` ${nombre}` : ''}, hemos recibido una solicitud para eliminar tu cuenta de OpoRuta.
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
              OpoRuta · Si tienes problemas, responde a este email o escríbenos a ${REPLY_TO}
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
      subject: '¡Bienvenido a OpoRuta! Tu ruta al aprobado empieza ahora',
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
  const confirmUrl = `${appUrl}/api/user/delete/confirm?token=${params.confirmToken}`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: [params.to],
      subject: 'Confirma la eliminación de tu cuenta de OpoRuta',
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
 * Notifica al admin cuando un nuevo usuario se registra.
 * Permite saber en tiempo real cuándo entra un cliente real.
 *
 * Se envía en DOS momentos:
 * 1. Al registrarse (confirmed=false) — para que sepas al instante
 * 2. Al confirmar email (confirmed=true) — para que sepas que activó la cuenta
 */
export async function sendNewUserNotification(params: {
  email: string
  nombre?: string
  oposicion?: string
  confirmed?: boolean
}): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) return { success: false, error: 'Resend no configurado' }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'aritzmore1@gmail.com'
  const log = logger.child({ route: 'email:new-user-alert' })
  const confirmed = params.confirmed ?? true

  const statusEmoji = confirmed ? '✅' : '🆕'
  const statusLabel = confirmed ? 'EMAIL CONFIRMADO' : 'PENDIENTE DE CONFIRMAR'

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [adminEmail],
      subject: `${statusEmoji} ${confirmed ? 'Usuario confirmado' : 'Nuevo registro'} en OpoRuta: ${params.email}`,
      text: [
        confirmed ? '¡Usuario ha confirmado su email!' : '¡Nuevo registro en OpoRuta!',
        '',
        `Email: ${params.email}`,
        `Nombre: ${params.nombre ?? '(no proporcionado)'}`,
        `Oposición: ${params.oposicion ?? '(no especificada)'}`,
        `Estado: ${statusLabel}`,
        `Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`,
        '',
        '─── Acciones ───',
        `Ver en Supabase: Authentication → Users`,
        `Dashboard admin: https://oporuta.es/admin`,
      ].join('\n'),
    })

    if (error) {
      log.error({ error: error.message }, 'Error enviando alerta de nuevo usuario')
      return { success: false, error: error.message }
    }
    log.info({ id: data?.id, userEmail: params.email, confirmed }, 'Alerta de nuevo usuario enviada')
    return { success: true, id: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error({ error: msg }, 'Excepción enviando alerta de nuevo usuario')
    return { success: false, error: msg }
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
  userEmail?: string
}): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) {
    logger.error('[feedback-email] RESEND_API_KEY no configurado — email NO enviado')
    return { success: false, error: 'Resend no configurado' }
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'aritzmore1@gmail.com'

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: params.userEmail ?? REPLY_TO,
      to: [adminEmail],
      subject: `[OpoRuta Feedback] ${params.tipo}: ${params.mensaje.slice(0, 60)}`,
      text: [
        `Tipo: ${params.tipo}`,
        `Usuario: ${params.userEmail ?? '(desconocido)'}`,
        `Página: ${params.paginaOrigen ?? '(desconocida)'}`,
        '',
        '─── Mensaje ───',
        params.mensaje,
        '',
        '─── Acciones ───',
        `Responder: mailto:${params.userEmail ?? REPLY_TO}`,
        `Ver en BD: tabla sugerencias`,
      ].join('\n'),
    })

    if (error) {
      logger.error({ error: error.message, to: adminEmail }, '[feedback-email] Resend API error')
      return { success: false, error: error.message }
    }
    return { success: true, id: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error({ error: msg, to: adminEmail }, '[feedback-email] exception')
    return { success: false, error: msg }
  }
}

/**
 * Envía un email de nurturing y registra el envío en nurture_emails_sent.
 * Usado por runNurtureEmails() — no llamar directamente.
 */
export async function sendNurtureEmail(params: {
  to: string
  subject: string
  html: string
  userId: string
  emailKey: string
}): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) return { success: false, error: 'Resend no configurado' }

  const log = logger.child({ route: 'email:nurture' })

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    })

    if (error) {
      log.error({ error: error.message, emailKey: params.emailKey }, 'Resend API error')
      return { success: false, error: error.message }
    }

    // Log to nurture_emails_sent (fire-and-forget)
    try {
      const { createServiceClient } = await import('@/lib/supabase/server')
      const svc = await createServiceClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (svc as any).from('nurture_emails_sent').insert({
        user_id: params.userId,
        email_key: params.emailKey,
        resend_id: data?.id ?? null,
      })
    } catch {
      // Non-blocking — UNIQUE constraint will prevent duplicates
    }

    log.info({ id: data?.id, to: params.to, emailKey: params.emailKey }, 'Nurture email enviado')
    return { success: true, id: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error({ error: msg, emailKey: params.emailKey }, 'Excepción enviando nurture email')
    return { success: false, error: msg }
  }
}

/**
 * Email post-compra: agradecimiento + solicitud de reseña Google.
 * Enviado inmediatamente tras checkout.session.completed.
 * Cialdini's Reciprocity: acaban de recibir valor → más dispuestos a devolver.
 */
export async function sendPostPurchaseEmail(params: {
  to: string
  nombre?: string
}): Promise<EmailResult> {
  const resend = getResend()
  if (!resend) return { success: false, error: 'Resend no configurado' }

  const log = logger.child({ route: 'email:post-purchase' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://oporuta.es'
  const greeting = params.nombre ? `¡${params.nombre}, gracias` : '¡Gracias'

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gracias por confiar en OpoRuta</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
        <tr>
          <td style="background:#1B4F72;padding:24px 40px;text-align:center;">
            <span style="color:#ffffff;font-size:24px;font-weight:700;">OpoRuta</span>
            <p style="color:#A9CCE3;margin:4px 0 0;font-size:13px;">El camino más corto hacia el aprobado</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 24px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#111827;font-weight:700;">
              ${greeting} por unirte!
            </h1>
            <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
              Tu Pack ya está activo. A partir de ahora tienes acceso completo a todos los temas,
              simulacros sin límite, Radar del Tribunal y análisis con IA.
            </p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
              <tr><td style="padding:16px;background:#F0FDF4;border-radius:8px;border:1px solid #BBF7D0;">
                <p style="margin:0 0 8px;font-size:14px;color:#166534;font-weight:600;">Tu plan de acción:</p>
                <p style="margin:0;font-size:13px;color:#16a34a;line-height:1.8;">
                  1. Haz un test en tu tema más débil<br/>
                  2. Revisa el Radar del Tribunal — céntrate en lo que más preguntan<br/>
                  3. Programa 1 simulacro semanal en condiciones reales
                </p>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td align="center">
                <a href="${appUrl}/dashboard" style="display:inline-block;padding:14px 32px;background:#1B4F72;color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:700;">
                  Ir a mi dashboard →
                </a>
              </td></tr>
            </table>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
              <tr><td style="padding:16px;background:#FFF7ED;border-radius:8px;border:1px solid #FED7AA;">
                <p style="margin:0 0 8px;font-size:14px;color:#9a3412;font-weight:600;">¿Nos ayudas a llegar a más opositores?</p>
                <p style="margin:0 0 12px;font-size:13px;color:#ea580c;line-height:1.6;">
                  OpoRuta es un proyecto joven y cada reseña nos ayuda a que más personas nos encuentren.
                  Si crees que la plataforma aporta valor, nos encantaría que dejaras una reseña en Google.
                  Tarda 1 minuto.
                </p>
                <a href="https://www.google.com/search?q=OpoRuta+oposiciones" style="display:inline-block;padding:10px 24px;background:#F39C12;color:#ffffff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
                  Dejar reseña en Google →
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;line-height:1.5;">
              OpoRuta · Bilbao<br/>
              <a href="${appUrl}/legal/privacidad" style="color:#6b7280;">Privacidad</a> ·
              <a href="${appUrl}/cuenta" style="color:#6b7280;">Mi cuenta</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: [params.to],
      subject: '¡Gracias por unirte a OpoRuta! Tu Pack ya está activo',
      html,
    })

    if (error) {
      log.error({ error: error.message }, 'Post-purchase email error')
      return { success: false, error: error.message }
    }
    log.info({ id: data?.id, to: params.to }, 'Post-purchase email enviado')
    return { success: true, id: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error({ error: msg }, 'Post-purchase email exception')
    return { success: false, error: msg }
  }
}
