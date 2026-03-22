import { NextRequest, NextResponse } from 'next/server'
import { sendNewUserNotification } from '@/lib/email/client'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { logger } from '@/lib/logger'

/**
 * POST /api/auth/notify-registration
 *
 * Notifica al admin inmediatamente cuando alguien se registra,
 * SIN esperar a la confirmación de email.
 *
 * Llamado desde el register page tras signUp() exitoso.
 * Rate limited: 5 req/min by IP to prevent abuse.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (no auth available — this is pre-registration)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rl = await checkRateLimit(ip, 'notify-reg', 5, '1 m')
    if (!rl.success) {
      return NextResponse.json({ ok: false }, { status: 429 })
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : undefined
    const oposicion = typeof body.oposicion === 'string' ? body.oposicion : undefined

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    void sendNewUserNotification({ email, nombre, oposicion, confirmed: false })

    return NextResponse.json({ ok: true })
  } catch {
    logger.error('[notify-registration] unexpected error')
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
