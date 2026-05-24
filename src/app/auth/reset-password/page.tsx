'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const mismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 6) { setError('6 caractères minimum.'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg, ${A.primary} 0%, ${A.primaryDark} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 12px 32px rgba(10,102,224,0.32)',
          }}>
            <Icon name="tooth" size={32} color="#fff" strokeWidth={1.6} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: A.text, marginBottom: 6 }}>
            Nouveau mot de passe
          </div>
          <div style={{ fontSize: 14, color: A.textMuted }}>
            Choisis un mot de passe sécurisé.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: A.text, display: 'block', marginBottom: 6 }}>
              Nouveau mot de passe
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={6} autoFocus placeholder="6 caractères minimum"
              style={{ width: '100%', height: 50, borderRadius: 12, border: `0.5px solid ${A.border}`, background: A.surface, padding: '0 16px', fontSize: 15, color: A.text, fontFamily: A.font, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: A.text, display: 'block', marginBottom: 6 }}>
              Confirmer le mot de passe
            </label>
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              required placeholder="••••••••"
              style={{ width: '100%', height: 50, borderRadius: 12, border: `0.5px solid ${mismatch ? A.red : A.border}`, background: A.surface, padding: '0 16px', fontSize: 15, color: A.text, fontFamily: A.font, outline: 'none', boxSizing: 'border-box', boxShadow: mismatch ? `0 0 0 3px ${A.red}18` : 'none' }}
            />
            {mismatch && (
              <div style={{ fontSize: 12, color: A.red, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="info" size={12} color={A.red} /> Les mots de passe ne correspondent pas.
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: '#FEEBEB', border: `0.5px solid ${A.red}40`, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: A.red }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || mismatch} style={{
            width: '100%', height: 50, borderRadius: 14, border: 'none',
            background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600,
            fontFamily: A.font, cursor: (loading || mismatch) ? 'default' : 'pointer',
            boxShadow: '0 4px 14px rgba(10,102,224,0.28)',
            opacity: (loading || mismatch) ? 0.5 : 1,
            transition: 'opacity .15s',
          }}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}
