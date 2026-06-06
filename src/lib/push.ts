/**
 * Web Push — client side
 *
 * Cycle de vie :
 *   1. registerServiceWorker() au boot (ou à la 1re demande)
 *   2. requestPermission() — déclenche la popup système (1 seule chance)
 *   3. subscribe() — crée la subscription PushManager + envoie au serveur
 *   4. unsubscribe() — retire localement + côté serveur
 *
 * iOS Safari : push fonctionne UNIQUEMENT si l'app est ajoutée à l'écran
 * d'accueil ("Ajouter à l'écran d'accueil"). Sinon Notification.permission
 * retourne 'denied' silencieusement.
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

export type PushSupport = {
  supported: boolean
  reason?: string
  isIosStandalone: boolean
}

export function checkSupport(): PushSupport {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'SSR', isIosStandalone: false }
  }
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true

  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'Service Worker non supporté', isIosStandalone: false }
  }
  if (!('PushManager' in window)) {
    return { supported: false, reason: 'Push API non supporté', isIosStandalone: false }
  }
  if (!('Notification' in window)) {
    return { supported: false, reason: 'Notifications non supportées', isIosStandalone: false }
  }
  if (isIos && !isStandalone) {
    return {
      supported: false,
      reason: 'Sur iPhone, ajoute d\'abord DentalPrep à ton écran d\'accueil.',
      isIosStandalone: false,
    }
  }
  return { supported: true, isIosStandalone: isIos && isStandalone }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready
    return reg
  } catch (e) {
    console.error('SW register failed', e)
    return null
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return null
  return (await reg.pushManager.getSubscription()) ?? null
}

export async function subscribePush(): Promise<{ ok: true; subscription: PushSubscription } | { ok: false; error: string }> {
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, error: 'VAPID public key manquante (NEXT_PUBLIC_VAPID_PUBLIC_KEY)' }
  }

  const support = checkSupport()
  if (!support.supported) {
    return { ok: false, error: support.reason ?? 'Non supporté' }
  }

  const reg = await registerServiceWorker()
  if (!reg) return { ok: false, error: 'Service Worker indisponible' }

  // Demande la permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, error: 'Permission refusée par le navigateur' }
  }

  // Crée la subscription
  let subscription: PushSubscription
  try {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
    })
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Échec de la subscription' }
  }

  // Envoie au serveur
  const json = subscription.toJSON()
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
      user_agent: navigator.userAgent,
    }),
  })

  if (!res.ok) {
    await subscription.unsubscribe()
    return { ok: false, error: 'Échec côté serveur' }
  }

  return { ok: true, subscription }
}

export async function unsubscribePush(): Promise<boolean> {
  const sub = await getCurrentSubscription()
  if (!sub) return true

  // Retire côté serveur d'abord (avant qu'on n'ait plus l'endpoint)
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  })

  await sub.unsubscribe()
  return true
}

export async function sendTestNotification(): Promise<boolean> {
  const res = await fetch('/api/push/test', { method: 'POST' })
  return res.ok
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr
}
