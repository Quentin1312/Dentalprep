'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import PetCompanion, { PET_NAMES } from '@/components/pet/PetCompanion'
import type { PetType } from '@/components/pet/PetCompanion'
import { computeXP, xpProgress } from '@/lib/xp'
import { computeBadges } from '@/lib/badges'
import type { Badge } from '@/lib/badges'

type Profile = { full_name: string | null; exam_date: string | null; daily_goal_minutes: number; streak: number | null; pet_type: string | null }
type Attempt = { module_id: string; is_correct: boolean; question_id: string }

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [attempts, setAttempts] = useState<Attempt[]>([])
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
        supabase.from('quiz_attempts').select('module_id,is_correct,question_id').eq('user_id', user.id),
      ]).then(([p, a]) => {
        const prof = p.data
        setProfile(prof)
        setName(prof?.full_name ?? '')
        setExamDate(prof?.exam_date ?? '')
        setGoal(prof?.daily_goal_minutes ?? 30)
        if (prof?.pet_type) setPetType(prof.pet_type as PetType)
        setAttempts((a.data ?? []) as Attempt[])
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
  const totalAttempts = attempts.length
  const correctAttempts = attempts.filter(a => a.is_correct).length
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
  const xp = computeXP(attempts)
  const xpInfo = xpProgress(xp)
  const badges: Badge[] = computeBadges(attempts, profile?.streak ?? 0)
  const unlockedCount = badges.filter(b => b.unlocked).length

  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 12, border: `1px solid ${A.border}`, background: A.bg, fontSize: 15, color: A.text, fontFamily: A.font, outline: 'none' }

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}} @keyframes xp-fill{from{width:0}to{width:var(--xp-pct)}}`}</style>
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
          {/* Hero card */}
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

          {/* XP & Level */}
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Niveau & XP</div>
            <div style={{ background: A.surface, borderRadius: 16, border: `0.5px solid ${A.border}`, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                {/* Pet mini */}
                <div style={{ flexShrink: 0, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PetCompanion petType={petType} state="idle" size={52} hideName level={xpInfo.level} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: xpInfo.color, letterSpacing: -0.5 }}>
                      Niv. {xpInfo.level}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: xpInfo.color }}>{xpInfo.name}</div>
                  </div>
                  <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2 }}>
                    {xp} XP total · {xpInfo.level < 5 ? `${xpInfo.levelEnd - xp} XP avant le prochain niveau` : 'Niveau maximum atteint !'}
                  </div>
                </div>
              </div>
              {/* XP bar */}
              <div style={{ height: 10, background: '#E9ECF2', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  width: `${xpInfo.pct}%`,
                  background: `linear-gradient(90deg, ${xpInfo.color}, ${xpInfo.color}CC)`,
                  borderRadius: 6,
                  transition: 'width 1s cubic-bezier(0.34,1.2,0.64,1)',
                  boxShadow: `0 0 8px ${xpInfo.color}66`,
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, color: A.textDim }}>
                <span>{xpInfo.levelStart} XP</span>
                <span style={{ fontWeight: 600, color: A.textMuted }}>{xpInfo.pct}%</span>
                <span>{xpInfo.level < 5 ? `${xpInfo.levelEnd} XP` : '∞'}</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>Badges</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: A.primary }}>{unlockedCount}/{badges.length} débloqués</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {badges.map(b => (
                <div key={b.id} style={{
                  background: b.unlocked ? A.surface : A.bg,
                  border: `0.5px solid ${b.unlocked ? A.borderStrong : A.border}`,
                  borderRadius: 14,
                  padding: '12px 6px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  opacity: b.unlocked ? 1 : 0.38,
                  filter: b.unlocked ? undefined : 'grayscale(100%)',
                  boxShadow: b.unlocked ? '0 2px 8px rgba(15,27,45,0.06)' : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {b.unlocked && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                      background: `linear-gradient(90deg, ${A.primary}, ${A.primaryDark})`,
                      borderRadius: '14px 14px 0 0',
                    }} />
                  )}
                  <div style={{ fontSize: 26, lineHeight: 1 }}>{b.emoji}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: b.unlocked ? A.text : A.textDim, textAlign: 'center', lineHeight: 1.2, letterSpacing: 0.1 }}>
                    {b.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pet — read-only, locked after setup */}
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Compagnon</div>
            <div style={{ background: A.surface, borderRadius: 16, border: `0.5px solid ${A.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64 }}>
                <PetCompanion petType={petType} state="idle" size={56} hideName level={xpInfo.level} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: A.text, letterSpacing: -0.3 }}>{PET_NAMES[petType]}</div>
                <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2 }}>
                  Niveau {xpInfo.level} · {xpInfo.name}
                </div>
              </div>
              <div style={{ flexShrink: 0, background: A.bg, border: `0.5px solid ${A.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, color: A.textDim, fontWeight: 600 }}>Définitif</div>
            </div>
          </div>

          <div style={{ padding: '16px 20px 0' }}>
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
