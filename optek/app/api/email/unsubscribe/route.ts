import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyUnsubscribeToken } from '@/lib/email/nurture-templates'
import { logger } from '@/lib/logger'

/**
 * GET /api/email/unsubscribe?uid=XXX&token=XXX
 *
 * One-click unsubscribe from nurture emails (GDPR Art. 7.3).
 * Token is HMAC-signed with CRON_SECRET to prevent abuse.
 * Sets profiles.email_nurture_opt_out = true.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const uid = searchParams.get('uid')
  const token = searchParams.get('token')

  if (!uid || !token) {
    return new NextResponse(htmlPage('Enlace inválido', 'Falta información en el enlace.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (!verifyUnsubscribeToken(uid, token)) {
    return new NextResponse(htmlPage('Enlace inválido', 'El enlace no es válido o ha expirado.'), {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('profiles')
      .update({ email_nurture_opt_out: true })
      .eq('id', uid)

    logger.info({ userId: uid }, '[unsubscribe] User opted out of nurture emails')

    return new NextResponse(
      htmlPage(
        'Has cancelado la suscripción',
        'No recibirás más emails de seguimiento de OpoRuta. Tu cuenta sigue activa y puedes seguir usando la plataforma normalmente.'
      ),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (err) {
    logger.error({ err, userId: uid }, '[unsubscribe] Error')
    return new NextResponse(htmlPage('Error', 'Ha ocurrido un error. Inténtalo de nuevo.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — OpoRuta</title></head>
<body style="margin:0;padding:40px 20px;background:#f4f4f5;font-family:system-ui,sans-serif;text-align:center;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <h1 style="color:#1B4F72;margin:0 0 16px;font-size:22px;">${title}</h1>
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">${message}</p>
    <a href="https://oporuta.es" style="color:#1B4F72;font-size:14px;">Volver a OpoRuta</a>
  </div>
</body>
</html>`
}
