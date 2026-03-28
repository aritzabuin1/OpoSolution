/**
 * lib/push/send.ts — Web Push Notification sender
 *
 * Uses web-push library with VAPID keys to send notifications
 * to subscribed users. Called from cron jobs (reto diario, racha alert).
 *
 * ENV vars required:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  — public key (also used client-side)
 *   VAPID_PRIVATE_KEY             — private key (server-only)
 */

import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_SUBJECT = 'mailto:aritzabuin1@gmail.com'

let initialized = false

function ensureInit() {
  if (initialized || !VAPID_PUBLIC || !VAPID_PRIVATE) return
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  initialized = true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

/**
 * Send a push notification to a single subscription.
 * Returns true if sent, false if subscription is invalid (should be deleted).
 */
async function sendToSubscription(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return true
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode
    // 404 or 410 = subscription expired/invalid → delete it
    if (statusCode === 404 || statusCode === 410) {
      return false
    }
    logger.warn({ err, statusCode }, '[push] failed to send notification')
    return true // don't delete on transient errors
  }
}

/**
 * Send a push notification to ALL subscribed users.
 * Automatically cleans up expired subscriptions.
 */
export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; cleaned: number }> {
  ensureInit()
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    logger.warn('[push] VAPID keys not configured, skipping push')
    return { sent: 0, cleaned: 0 }
  }

  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptions } = await (supabase as any)
    .from('push_subscriptions')
    .select('id, subscription')

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, cleaned: 0 }
  }

  let sent = 0
  let cleaned = 0
  const toDelete: string[] = []

  await Promise.all(
    (subscriptions as Array<{ id: string; subscription: webpush.PushSubscription }>).map(async (row) => {
      const ok = await sendToSubscription(row.subscription, payload)
      if (ok) {
        sent++
      } else {
        toDelete.push(row.id)
        cleaned++
      }
    })
  )

  // Clean up expired subscriptions
  if (toDelete.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('push_subscriptions')
      .delete()
      .in('id', toDelete)
    logger.info({ cleaned }, '[push] cleaned expired subscriptions')
  }

  logger.info({ sent, cleaned, total: subscriptions.length }, '[push] notifications sent')
  return { sent, cleaned }
}

/**
 * Send push to a specific user (by user_id).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<boolean> {
  ensureInit()
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false

  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptions } = await (supabase as any)
    .from('push_subscriptions')
    .select('id, subscription')
    .eq('user_id', userId)

  if (!subscriptions || subscriptions.length === 0) return false

  for (const row of subscriptions as Array<{ id: string; subscription: webpush.PushSubscription }>) {
    const ok = await sendToSubscription(row.subscription, payload)
    if (!ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('push_subscriptions')
        .delete()
        .eq('id', row.id)
    }
  }

  return true
}
