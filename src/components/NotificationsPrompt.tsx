'use client'

/**
 * NotificationsPrompt — modale qui propose d'activer les rappels push.
 *
 * Affichage :
 *  - sur le dashboard, au boot
 *  - seulement si :
 *      • le navigateur supporte les push (PWA sur iOS sinon ignoré)
 *      • permission != 'denied' (sinon l'utilisateur a refusé via le système, on n'insiste pas)
 *      • reminders_enabled=false côté serveur
 *      • pas dismissed dans les 7 derniers jours (cooldown local)
 *
 * Comportement :
 *  - "Activer" → demande la permission, subscribe, met à jour le profil, ferme
 *  - "Plus tard" → cooldown 7j
 *  - X (fermer) → cooldown 24h (plus court — l'utilisateur n'a pas dit non)
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { checkSupport, subscribePush } from '@/lib/push'
import { A, PALETTE, RADIUS, sp, monoStyle, displayStyle, typeStyle } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

const DISMISS_KEY = 'dentalprep_notifs_dismiss_until'

function getDismissUntil(): number {
  try { return parseInt(localStorage.getItem(DISMISS_KEY) ?? '0', 10) || 0 } catch { return 0 }
}
function setDismissUntil(ms: number) {
  try { localStorage.setItem(DISMISS_KEY, String(ms)) } catch {}
}

export default function NotificationsPrompt({ userId }: { userId: string | null }) {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    void (async () => {
      // 1. Cooldown
      if (Date.now() < getDismissUntil()) return

      // 2. Support
      const support = checkSupport()
      if (!support.supported) return

      // 3. Permission déjà refusée → on insiste pas
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return

      // 4. Vérifie si pas déjà activé côté serveur
      const supabase = createClient()
      const supaAny = supabase as any
      const { data: prof } = await supaAny
        .from('profiles')
        .select('reminders_enabled')
        .eq('id', userId)
        .single()
      if (prof?.reminders_enabled) return

      // Tout passe → on affiche le prompt (avec un petit delay pour pas surprendre)
      setTimeout(() => setVisible(true), 1200)
    })()
  }, [userId])

  async function handleEnable() {
    if (busy) return
    setBusy(true)
    setErrorMsg(null)
    try {
      const res = await subscribePush()
      if (!res.ok) {
        setErrorMsg(res.error)
        setBusy(false)
        return
      }
      // Set reminders_enabled + fuseau auto-détecté (pas d'heure choisie,
      // c'est le cron qui décide intelligemment quand envoyer)
      const supabase = createClient()
      const supaAny = supabase as any
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supaAny.from('profiles').update({
          reminders_enabled: true,
          reminder_tz: tz,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id)
      }
      setVisible(false)
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Erreur')
      setBusy(false)
    }
  }

  function handleLater() {
    setDismissUntil(Date.now() + 7 * 86_400_000) // 7 jours
    setVisible(false)
  }

  function handleClose() {
    setDismissUntil(Date.now() + 86_400_000)    // 24h
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(10, 22, 20, 0.55)',
        zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'np-fade 0.25s ease-out',
      }}>
      <style>{`
        @keyframes np-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes np-slide { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: PALETTE.surface,
          width: '100%', maxWidth: 460,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: '20px 22px 28px',
          boxShadow: '0 -20px 40px rgba(10,22,20,0.25)',
          animation: 'np-slide 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}>
        {/* Handle drag */}
        <div style={{
          width: 40, height: 4, background: PALETTE.rule,
          borderRadius: 999, margin: '0 auto 18px',
        }} />

        {/* Close (X) */}
        <button
          onClick={handleClose}
          aria-label="Fermer"
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 32, height: 32, borderRadius: 10,
            background: PALETTE.surfaceAlt, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
          <Icon name="x" size={14} color={PALETTE.inkMute} strokeWidth={2.4} />
        </button>

        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 18,
          background: `linear-gradient(135deg, ${PALETTE.brand} 0%, ${PALETTE.brandDeep} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: `0 10px 24px -6px ${PALETTE.brand}77`,
        }}>
          <Icon name="bell" size={26} color="#fff" strokeWidth={2.2} />
        </div>

        {/* Title + body */}
        <div style={{ textAlign: 'center', marginBottom: sp(4) }}>
          <div style={displayStyle('xl', 'bold')}>
            Active les rappels
          </div>
          <div style={{ ...typeStyle('sm', 'body', PALETTE.inkMute), marginTop: 6, lineHeight: 1.5 }}>
            On te prévient en soirée seulement si<br />
            tu n'as pas étudié dans la journée.
          </div>
        </div>

        {/* Bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: sp(5) }}>
          {[
            { icon: 'target',  text: 'Aucun spam : zéro notif si tu as déjà bossé' },
            { icon: 'flame',   text: 'Sauve ta série de jours quand tu zappes' },
            { icon: 'clock',   text: 'Entre 18h et 23h · 1 par jour max' },
          ].map(b => (
            <div key={b.text} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12,
              background: PALETTE.surfaceAlt,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: PALETTE.brandSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name={b.icon} size={16} color={PALETTE.brand} strokeWidth={2.2} />
              </div>
              <div style={typeStyle('sm', 'med')}>{b.text}</div>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div style={{
            background: '#FEF2F2', color: '#DC2626',
            padding: '10px 14px', borderRadius: 10, marginBottom: sp(3),
            fontSize: 12, fontWeight: 700,
          }}>
            {errorMsg}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleEnable}
            disabled={busy}
            style={{
              width: '100%', height: 54, borderRadius: 16, border: 'none',
              background: busy ? PALETTE.inkDim : PALETTE.brand, color: '#fff',
              fontSize: 15, fontWeight: 800, letterSpacing: -0.1, fontFamily: A.font,
              cursor: busy ? 'wait' : 'pointer',
              boxShadow: `0 10px 24px -6px ${PALETTE.brand}77`,
            }}>
            {busy ? 'Activation…' : 'Activer les rappels'}
          </button>
          <button
            onClick={handleLater}
            style={{
              width: '100%', height: 44, borderRadius: 14, border: 'none',
              background: 'transparent', color: PALETTE.inkMute,
              fontSize: 13, fontWeight: 700, fontFamily: A.font, cursor: 'pointer',
            }}>
            Plus tard
          </button>
          <Link href="/profile" onClick={handleClose} style={{
            textAlign: 'center', fontSize: 11, color: PALETTE.inkDim, fontWeight: 600,
            textDecoration: 'none', marginTop: 4,
            ...monoStyle('xs', 'med', PALETTE.inkDim),
          }}>
            Personnaliser dans le profil →
          </Link>
        </div>
      </div>
    </div>
  )
}
