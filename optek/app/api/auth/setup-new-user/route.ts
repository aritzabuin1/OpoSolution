import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendNewUserNotification } from '@/lib/email/client'
import { logger } from '@/lib/logger'

/**
 * POST /api/auth/setup-new-user
 *
 * Called by /auth/confirm (client-side) after successful email verification.
 * Sets oposicion_id from user_metadata and sends welcome email.
 *
 * Only runs for new users (created within last 10 minutes).
 * Idempotent — safe to call multiple times.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    // Only for new users (created within last 10 minutes)
    const createdAt = new Date(user.created_at).getTime()
    const isNewUser = Date.now() - createdAt < 10 * 60 * 1000
    if (!isNewUser) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Set oposicion_id from registration metadata (idempotent)
    const oposicionId = user.user_metadata?.oposicion_id as string | undefined
    if (oposicionId) {
      const serviceClient = await createServiceClient()
      await serviceClient
        .from('profiles')
        .update({ oposicion_id: oposicionId })
        .eq('id', user.id)
      logger.info({ userId: user.id, oposicionId }, '[setup-new-user] oposicion_id set')
    }

    // Send welcome email (sendWelcomeEmail is idempotent — Resend deduplicates)
    if (user.email) {
      const nombre = user.user_metadata?.full_name as string | undefined
      void sendWelcomeEmail({ to: user.email, nombre })
      void sendNewUserNotification({ email: user.email, nombre, confirmed: true })

      // Persistent registration log — survives account deletion
      const svc = await createServiceClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (svc as any).from('registration_log').insert({
        user_email: user.email,
        user_id: user.id,
        event: 'register_confirmed',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, '[setup-new-user] unexpected error')
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
