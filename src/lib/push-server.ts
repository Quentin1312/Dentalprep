/**
 * Web Push — server side helper
 * Usage : import { sendPushTo } from '@/lib/push-server'
 */

import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

let configured = false
function ensureConfigured() {
  if (configured) return
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:hello@dentalprep.app'
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys manquantes (NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY)')
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export type NotificationPayload = {
  title: string
  body: string
  url?: string
  icon?: string
  tag?: string
  renotify?: boolean
  requireInteraction?: boolean
}

export function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

/**
 * Envoie une notification à tous les appareils d'un utilisateur.
 * Retire automatiquement les subscriptions expirées (410 Gone).
 */
export async function sendPushTo(userId: string, payload: NotificationPayload): Promise<{ sent: number; pruned: number }> {
  ensureConfigured()
  const supabase = getServiceRoleClient()

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error) throw error
  if (!subs || subs.length === 0) return { sent: 0, pruned: 0 }

  let sent = 0
  let pruned = 0
  const payloadStr = JSON.stringify(payload)

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payloadStr,
        { TTL: 86400 },
      )
      sent++
      await supabase.from('push_subscriptions').update({ last_seen_at: new Date().toISOString(), failure_count: 0, last_error: null }).eq('id', sub.id)
    } catch (e: any) {
      const status = e?.statusCode ?? 0
      if (status === 404 || status === 410) {
        // Expirée → on supprime
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        pruned++
      } else {
        await supabase.from('push_subscriptions').update({
          failure_count: (sub as any).failure_count + 1 || 1,
          last_error: e?.message ?? 'unknown',
        }).eq('id', sub.id)
      }
    }
  }))

  return { sent, pruned }
}
