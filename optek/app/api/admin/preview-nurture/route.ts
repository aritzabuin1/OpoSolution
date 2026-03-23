import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin/auth'
import { previewNurtureEmail } from '@/lib/email/nurture'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/preview-nurture?email_key=activation_d2
 *
 * Renders a nurture email with fake data and sends it to the admin email.
 * Use this to review emails before activating the system.
 *
 * Valid keys: activation_d2, value_radar_d5, progress_d10, wall_hit, urgency_d21, final_30d
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin('preview-nurture')
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const emailKey = new URL(request.url).searchParams.get('email_key')
  if (!emailKey) {
    return NextResponse.json({
      error: 'Missing email_key parameter',
      valid_keys: ['activation_d2', 'value_radar_d5', 'progress_d10', 'wall_hit', 'urgency_d21', 'final_30d'],
    }, { status: 400 })
  }

  try {
    const result = await previewNurtureEmail(emailKey)
    if (!result) {
      return NextResponse.json({ error: `Invalid email_key: ${emailKey}` }, { status: 400 })
    }

    // Send to admin email
    const adminEmail = process.env.ADMIN_EMAIL ?? 'aritzmore1@gmail.com'

    try {
      const { Resend } = await import('resend')
      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
      }
      const resend = new Resend(resendKey)
      const { data, error } = await resend.emails.send({
        from: 'OpoRuta <noreply@oporuta.es>',
        to: [adminEmail],
        subject: `[PREVIEW] ${result.subject}`,
        html: result.html,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      logger.info({ emailKey, to: adminEmail, id: data?.id }, '[preview-nurture] Preview sent')
      return NextResponse.json({
        ok: true,
        emailKey,
        subject: result.subject,
        sentTo: adminEmail,
        resendId: data?.id,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error({ err, emailKey }, '[preview-nurture] Error')
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
