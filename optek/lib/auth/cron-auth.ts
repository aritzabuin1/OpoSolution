import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verifica CRON_SECRET con comparación timing-safe.
 * Retorna NextResponse 401 si falla, o null si auth es válido.
 */
export function verifyCronSecret(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const expected = `Bearer ${cronSecret}`

  if (authHeader.length !== expected.length) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isValid = timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null // Auth OK
}
