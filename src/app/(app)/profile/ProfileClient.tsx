'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Profile = {
  full_name: string | null
  exam_date: string | null
  daily_goal_minutes: number
  streak?: number | null
}

type Stats = {
  totalAttempts: number
  accuracy: number
}

export default function ProfileClient({ profile, email, stats }: { profile: Profile | null; email: string; stats: Stats }) {
  const router = useRouter()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [examDate, setExamDate] = useState(profile?.exam_date ?? '')
  const [goal, setGoal] = useState(profile?.daily_goal_minutes ?? 30)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const initials = (profile?.full_name ?? email).slice(0, 2).toUpperCase()
  const streakVal = profile?.streak ?? 0

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      full_name: name,
      exam_date: examDate || null,
      daily_goal_minutes: goal,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '14px 16px', borderRadius: 12,
    border: `1px solid ${A.border}`, background: A.bg,
    fontSize: 15, color: A.text, fontFamily: A.font,
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <div style={{ padding: '62px 20px 0' }}>
        <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Mon compte</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Profil</div>
      </div>

      {/* Avatar card */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: `linear-gradient(135deg, ${A.primary} 0%, ${A.primaryDark} 100%)`, borderRadius: 20, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(10,102,224,0.28)' }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, border: '18px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{initials}</div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>{profile?.full_name || 'Mon profil'}</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>{email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 0, marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{streakVal}</div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>jours streak</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.totalAttempts}</div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>questions</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.accuracy}%</div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>précision</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Paramètres</div>
        <div style={{ background: A.surface, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
          {/* Name row */}
          <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${A.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: A.textMuted, marginBottom: 6 }}>Prénom</div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Votre prénom"
              style={inputStyle}
            />
          </div>
          {/* Exam date row */}
          <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${A.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: A.textMuted, marginBottom: 6 }}>Date d&apos;examen</div>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          {/* Goal row */}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: A.textMuted }}>Objectif quotidien</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.primary }}>{goal} min</div>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={goal}
              onChange={e => setGoal(Number(e.target.value))}
              style={{ width: '100%', accentColor: A.primary }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: A.textDim, marginTop: 4 }}>
              <span>10 min</span><span>2h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ padding: '16px 20px 0' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: 52, borderRadius: 14, border: 'none',
            background: saved ? A.green : A.primary,
            color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font,
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
            boxShadow: `0 4px 14px ${saved ? 'rgba(22,163,74,0.28)' : 'rgba(10,102,224,0.28)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background .3s',
          }}
        >
          {saved ? (
            <><Icon name="check" size={18} color="#fff" strokeWidth={2.5} /> Enregistré !</>
          ) : saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {/* Logout */}
      <div style={{ padding: '10px 20px 0' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', height: 52, borderRadius: 14,
            border: `1.5px solid ${A.red}20`, background: '#FEF2F2',
            color: A.red, fontSize: 15, fontWeight: 600, fontFamily: A.font,
            cursor: 'pointer',
          }}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
