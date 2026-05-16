'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/setup')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: `linear-gradient(135deg, ${A.primary} 0%, ${A.primaryDark} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 12px 32px rgba(10,102,224,0.32)',
          }}>
            <Icon name="tooth" size={32} color="#fff" strokeWidth={1.6} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, color: A.text }}>DentalPrep</div>
          <div style={{ fontSize: 14, color: A.textMuted, marginTop: 4 }}>Créez votre compte gratuitement</div>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: A.text, display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="vous@exemple.fr"
              style={{ width: '100%', height: 50, borderRadius: 12, border: `0.5px solid ${A.border}`, background: A.surface, padding: '0 16px', fontSize: 15, color: A.text, fontFamily: A.font, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: A.text, display: 'block', marginBottom: 6 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              placeholder="6 caractères minimum"
              style={{ width: '100%', height: 50, borderRadius: 12, border: `0.5px solid ${A.border}`, background: A.surface, padding: '0 16px', fontSize: 15, color: A.text, fontFamily: A.font, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {error && (
            <div style={{ background: '#FEEBEB', border: `0.5px solid ${A.red}40`, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: A.red }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', height: 50, borderRadius: 14, border: 'none',
            background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600,
            fontFamily: A.font, cursor: 'pointer', letterSpacing: -0.2,
            boxShadow: '0 1px 0 rgba(8,80,184,0.4), 0 4px 14px rgba(10,102,224,0.28)',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: A.textMuted, marginTop: 20 }}>
          Déjà un compte ?{' '}
          <Link href="/auth/login" style={{ color: A.primary, fontWeight: 600, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
