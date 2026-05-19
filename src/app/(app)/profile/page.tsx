'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import PetCompanion, { PET_NAMES } from '@/components/pet/PetCompanion'
import type { PetType } from '@/components/pet/PetCompanion'

type Profile = { full_name: string | null; exam_date: string | null; daily_goal_minutes: number; streak: number | null; pet_type: string | null }

const PET_COLORS: Record<PetType, { accent: string; soft: string }> = {
  cat:   { accent: '#FFD84A', soft: 'rgba(255,216,74,0.12)' },
  dog:   { accent: '#5BB8D4', soft: 'rgba(91,184,212,0.12)' },
  bunny: { accent: '#E86090', soft: 'rgba(232,96,144,0.12)' },
}

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
    await supabase.from('profiles').update({ full_name: name, exam_date: examDate || null, daily_goal_minutes: goal, pet_type: petType, updated_at: new Date().toISOString() }).eq('id', user.id)
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

          {/* Pet selection */}
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Compagnon</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['cat', 'dog', 'bunny'] as PetType[]).map(pet => {
                const sel = petType === pet
                const colors = PET_COLORS[pet]
                return (
                  <button
                    key={pet}
                    onClick={() => setPetType(pet)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '12px 8px',
                      borderRadius: 16,
                      background: sel ? colors.soft : A.surface,
                      border: `2px solid ${sel ? colors.accent : A.border}`,
                      cursor: 'pointer', fontFamily: A.font,
                      transition: 'all .18s',
                      boxShadow: sel ? `0 4px 16px ${colors.accent}30` : 'none',
                    }}
                  >
                    <div style={{ width: 64, height: 78, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <PetCompanion petType={pet} state={sel ? 'correct' : 'idle'} size={64} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sel ? colors.accent : A.textMuted }}>
                      {PET_NAMES[pet]}
                    </div>
                  </button>
                )
              })}
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
