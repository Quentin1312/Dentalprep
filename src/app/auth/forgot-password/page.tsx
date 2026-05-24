'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Step = 'form' | 'sent'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setStep('sent')
  }

  // ── Confirmation ─────────────────────────────────────────────────────────────
  if (step === 'sent') return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font }}>
      <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon name="mail" size={28} color={A.primary} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: A.text, marginBottom: 10 }}>Email envoyé !</div>
        <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.6, marginBottom: 28 }}>
          On a envoyé un lien de réinitialisation à<br />
          <span style={{ color: A.text, fontWeight: 600 }}>{email}</span><br />
          Clique dessus pour choisir un nouveau mot de passe.
        </div>
        <Link href="/auth/login" style={{ display: 'block', width: '100%', height: 50, borderRadius: 14, background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' } as React.CSSProperties}>
          Retour à la connexion
        </Link>
      </div>
    </div>
  )

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        <Link href="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: A.textMuted, fontSize: 14, textDecoration: 'none', marginBottom: 32 }}>
          <Icon name="chevronL" size={16} color={A.textMuted} /> Retour
        </Link>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, color: A.text, marginBottom: 8 }}>
            Mot de passe oublié ?
          </div>
          <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.55 }}>
            Entre ton email, on t&apos;envoie un lien pour en choisir un nouveau.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: A.text, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              placeholder="vous@exemple.fr"
              style={{ width: '100%', height: 50, borderRadius: 12, border: `0.5px solid ${A.border}`, background: A.surface, padding: '0 16px', fontSize: 15, color: A.text, fontFamily: A.font, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ background: '#FEEBEB', border: `0.5px solid ${A.red}40`, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: A.red }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', height: 50, borderRadius: 14, border: 'none',
            background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600,
            fontFamily: A.font, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(10,102,224,0.28)',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
      </div>
    </div>
  )
}
