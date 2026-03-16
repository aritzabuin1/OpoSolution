import { NextRequest, NextResponse } from 'next/server'
import { sendNewUserNotification } from '@/lib/email/client'
import { logger } from '@/lib/logger'

/**
 * POST /api/auth/notify-registration
 *
 * Notifica al admin inmediatamente cuando alguien se registra,
 * SIN esperar a la confirmación de email.
 *
 * Llamado desde el register page tras signUp() exitoso.
 */
export async function POST(request: NextRequest) {
  try {
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
