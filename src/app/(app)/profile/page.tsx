'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import PetCompanion, { PET_NAMES } from '@/components/pet/PetCompanion'
import type { PetType } from '@/components/pet/PetCompanion'

type Profile = { full_name: string | null; exam_date: string | null; daily_goal_minutes: number; streak: number | null; pet_type: string | null }

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [goal, setGoal] = useState(30)
  const [petType, setPetType] = useState<PetType>('cat')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setEmail(user.email ?? '')
      Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('quiz_attempts').select('is_correct').eq('user_id', user.id),
      ]).then(([p, a]) => {
        const prof = p.data
        setProfile(prof)
        setName(prof?.full_name ?? '')
        setExamDate(prof?.exam_date ?? '')
        setGoal(prof?.daily_goal_minutes ?? 30)
        if (prof?.pet_type) setPetType(prof.pet_type as PetType)
        const att = a.data ?? []
        setTotalAttempts(att.length)
        setAccuracy(att.length > 0 ? Math.round((att.filter((x: { is_correct: boolean }) => x.is_correct).length / att.length) * 100) : 0)
        setLoading(false)
      })
    })
  }, [router])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ full_name: name, exam_date: examDate || null, daily_goal_minutes: goal, updated_at: new Date().toISOString() }).eq('id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  const initials = (name || email).slice(0, 2).toUpperCase()
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: `1px solid ${A.border}`, background: A.bg, fontSize: 15, color: A.text, fontFamily: A.font, outline: 'none' }

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ padding: '62px 20px 0' }}>
        <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Mon compte</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Profil</div>
      </div>

      {loading ? (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ borderRadius: 20, height: 180, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        </div>
      ) : (
        <>
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ background: `linear-gradient(135deg,${A.primary} 0%,${A.primaryDark} 100%)`, borderRadius: 20, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(10,102,224,0.28)' }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, border: '18px solid rgba(255,255,255,0.08)', borderRadius: '50%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{initials}</div>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>{name || 'Mon profil'}</div>
                  <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>{email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
                {[{ v: profile?.streak ?? 0, l: 'jours streak' }, { v: totalAttempts, l: 'questions' }, { v: `${accuracy}%`, l: 'précision' }].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{s.v}</div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pet — read-only, locked after setup */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Compagnon</div>
            <div style={{ background: A.surface, borderRadius: 16, border: `0.5px solid ${A.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64 }}>
                <PetCompanion petType={petType} state="idle" size={64} hideName />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: A.text, letterSpacing: -0.3 }}>{PET_NAMES[petType]}</div>
                <div style={{ fontSize: 12, color: A.textMuted, marginTop: 3 }}>Ton compagnon de révisions</div>
              </div>
              <div style={{ flexShrink: 0, background: A.bg, border: `0.5px solid ${A.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, color: A.textDim, fontWeight: 600 }}>Définitif</div>
            </div>
          </div>

          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Paramètres</div>
            <div style={{ background: A.surface, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
              <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${A.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: A.textMuted, marginBottom: 6 }}>Prénom</div>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Votre prénom" style={inputStyle} />
              </div>
              <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${A.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: A.textMuted, marginBottom: 6 }}>Date d&apos;examen</div>
                <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: A.textMuted }}>Objectif quotidien</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: A.primary }}>{goal} min</div>
                </div>
                <input type="range" min="10" max="120" step="5" value={goal} onChange={e => setGoal(Number(e.target.value))} style={{ width: '100%', accentColor: A.primary }} />
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 20px 0' }}>
            <button onClick={handleSave} disabled={saving} style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: saved ? A.green : A.primary, color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: `0 4px 14px ${saved ? 'rgba(22,163,74,0.28)' : 'rgba(10,102,224,0.28)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saved ? <><Icon name="check" size={18} color="#fff" strokeWidth={2.5} /> Enregistré !</> : saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
          <div style={{ padding: '10px 20px 0' }}>
            <button onClick={handleLogout} style={{ width: '100%', height: 52, borderRadius: 14, border: `1.5px solid ${A.red}20`, background: '#FEF2F2', color: A.red, fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer' }}>
              Se déconnecter
            </button>
          </div>
        </>
      )}
    </div>
  )
}
