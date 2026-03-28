import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/push/subscribe
 * Saves a Web Push subscription for the authenticated user.
 * Body: { subscription: PushSubscription }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  let body: { subscription?: unknown }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 })
  }

  const sub = body.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: 'Subscription inválida.' }, { status: 400 })
  }

  // Upsert: if same endpoint exists for this user, update it
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, subscription: sub },
      { onConflict: 'user_id,(subscription->>\'endpoint\')' }
    )

  if (error) {
    // Fallback: try delete + insert if upsert fails (jsonb unique constraint)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('subscription->>endpoint', sub.endpoint)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('push_subscriptions')
      .insert({ user_id: user.id, subscription: sub })
  }

  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/push/subscribe
 * Removes all push subscriptions for the authenticated user.
 */
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
