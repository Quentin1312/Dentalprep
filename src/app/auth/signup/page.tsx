'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Step = 'form' | 'otp'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [digits, setDigits] = useState(['', '', '', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function doSignUp(): Promise<'session' | 'otp' | false> {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return false }
    if (data.session) return 'session'
    return 'otp'
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    const result = await doSignUp()
    if (result === 'session') {
      router.push('/setup')
      router.refresh()
    } else if (result === 'otp') {
      setDigits(['', '', '', '', '', '', '', ''])
      setStep('otp')
      setResendCooldown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    const result = await doSignUp()
    if (result === 'otp') {
      setDigits(['', '', '', '', '', '', '', ''])
      setResendCooldown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }

  async function verifyCode(token: string) {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/setup')
    router.refresh()
  }

  function handleDigitChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    // Auto-submit when last digit filled
    if (index === 7 && value) {
      const token = [...newDigits.slice(0, 7), value.slice(-1)].join('')
      if (token.length === 8) verifyCode(token)
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    const newDigits = pasted.split('').concat(Array(8).fill('')).slice(0, 8)
    setDigits(newDigits)
    const nextEmpty = newDigits.findIndex(d => !d)
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus()
    if (pasted.length === 8) verifyCode(pasted)
  }

  const token = digits.join('')
  const canVerify = token.length === 8 && !loading

  // ── OTP step ────────────────────────────────────────────────────────────────
  if (step === 'otp') return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        <button onClick={() => { setStep('form'); setError(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: A.textMuted, fontSize: 14, fontFamily: A.font, padding: 0, marginBottom: 32 }}>
          <Icon name="chevronL" size={16} color={A.textMuted} /> Retour
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icon name="mail" size={28} color={A.primary} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: A.text, marginBottom: 8 }}>Vérifie tes emails</div>
          <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.55 }}>
            On a envoyé un code à 6 chiffres à<br />
            <span style={{ color: A.text, fontWeight: 600 }}>{email}</span>
          </div>
        </div>

        {/* 6 digit boxes */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }} onPaste={handleDigitPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleDigitChange(i, e.target.value)}
              onKeyDown={e => handleDigitKeyDown(i, e)}
              style={{
                width: 36, height: 52, borderRadius: 11, textAlign: 'center',
                fontSize: 20, fontWeight: 700, color: A.text,
                background: A.surface,
                border: `1.5px solid ${d ? A.primary : A.border}`,
                outline: 'none', boxSizing: 'border-box',
                boxShadow: d ? `0 0 0 3px ${A.primary}1A` : 'none',
                fontFamily: A.font,
                transition: 'border-color .15s, box-shadow .15s',
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{ background: '#FEEBEB', border: `0.5px solid ${A.red}40`, borderRadius: 10, padding: '12px 14px', fontSize: 13, color: A.red, marginBottom: 14 }}>
            Code incorrect. Vérifie et réessaie.
          </div>
        )}

        <button
          onClick={() => canVerify && verifyCode(token)}
          disabled={!canVerify}
          style={{
            width: '100%', height: 50, borderRadius: 14, border: 'none',
            background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600,
            fontFamily: A.font, cursor: canVerify ? 'pointer' : 'default',
            boxShadow: '0 4px 14px rgba(10,102,224,0.28)',
            opacity: canVerify ? 1 : 0.45,
            transition: 'opacity .15s',
          }}
        >
          {loading ? 'Vérification…' : 'Confirmer le code'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: A.textMuted, marginTop: 20 }}>
          Pas reçu ?{' '}
          {resendCooldown > 0
            ? <span style={{ color: A.textDim }}>Renvoyer dans {resendCooldown}s</span>
            : <button onClick={handleResend} disabled={loading} style={{ color: A.primary, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: A.font, fontSize: 13, padding: 0 }}>
                Renvoyer le code
              </button>
          }
        </p>
      </div>
    </div>
  )

  // ── Form step ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font }}>
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

        <button onClick={handleGoogle} disabled={googleLoading} style={{ width: '100%', height: 50, borderRadius: 14, border: `1.5px solid ${A.border}`, background: A.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 15, fontWeight: 600, color: A.text, fontFamily: A.font, cursor: 'pointer', marginBottom: 16, boxShadow: '0 1px 3px rgba(15,27,45,0.06)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          {googleLoading ? 'Redirection…' : 'Continuer avec Google'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: A.border }} />
          <span style={{ fontSize: 12, color: A.textDim, fontWeight: 500 }}>ou</span>
          <div style={{ flex: 1, height: 1, background: A.border }} />
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
