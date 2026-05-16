'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

const TOTAL = 4

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? A.primary : '#E1E5EC', transition: 'background .25s' }} />
      ))}
    </div>
  )
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [examDate, setExamDate] = useState('2026-12-18')
  const [dailyMin, setDailyMin] = useState(10)
  const [loading, setLoading] = useState(false)

  const daysToExam = Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000))
  const examFmt = new Date(examDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  async function finish() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    await supabase.from('profiles').update({ full_name: name, exam_date: examDate, daily_goal_minutes: dailyMin, updated_at: new Date().toISOString() }).eq('id', user.id)
    router.push('/dashboard')
    router.refresh()
  }

  // Step 0 — Welcome
  if (step === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '64px 24px 36px', background: A.bg, color: A.text, fontFamily: A.font }}>
      <ProgressDots step={0} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ alignSelf: 'flex-start', width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${A.primary} 0%, ${A.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: '0 12px 32px rgba(10,102,224,0.32)' }}>
          <Icon name="tooth" size={36} color="#fff" strokeWidth={1.6} />
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05, marginBottom: 12 }}>Bienvenue sur<br />DentalPrep.</div>
        <div style={{ fontSize: 16, color: A.textMuted, lineHeight: 1.5, marginBottom: 32 }}>On va régler 3 trucs ensemble pour personnaliser ta préparation. Ça prend moins de 30 secondes.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { i: 'user', t: 'Ton prénom', s: 'Pour les rappels personnalisés' },
            { i: 'calendar', t: "Ta date d'examen", s: 'Pour calculer ton planning' },
            { i: 'target', t: 'Ton objectif', s: 'Combien de minutes par jour' },
          ].map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.primary, fontSize: 13, fontWeight: 700 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{it.t}</div>
                <div style={{ fontSize: 12, color: A.textMuted }}>{it.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => setStep(1)} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
        C'est parti <Icon name="arrowR" size={18} color="#fff" />
      </button>
    </div>
  )

  // Step 1 — Name
  if (step === 1) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '54px 24px 36px', background: A.bg, color: A.text, fontFamily: A.font }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <button onClick={() => setStep(0)} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
          <Icon name="chevronL" size={18} color={A.text} />
        </button>
        <div style={{ flex: 1, marginLeft: 14 }}><ProgressDots step={1} /></div>
        <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 600, marginLeft: 12 }}>2/{TOTAL}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.15, marginBottom: 10 }}>Comment tu t&apos;appelles ?</div>
        <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.5, marginBottom: 28 }}>Pour que les rappels te parlent directement.</div>
        <input autoFocus type="text" placeholder="Léa" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
          style={{ width: '100%', height: 56, borderRadius: 14, background: A.surface, border: `1.5px solid ${name ? A.primary : A.border}`, padding: '0 18px', fontSize: 22, fontWeight: 600, color: A.text, fontFamily: A.font, letterSpacing: -0.3, outline: 'none', boxShadow: name ? `0 0 0 4px ${A.primary}18` : 'none', transition: 'border-color .15s, box-shadow .15s', boxSizing: 'border-box' }} />
        <div style={{ fontSize: 12, color: A.textDim, marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="info" size={12} color={A.textDim} /> Tu pourras le modifier plus tard dans ton profil.
        </div>
      </div>
      <button onClick={() => name.trim() && setStep(2)} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: name.trim() ? 1 : 0.5, boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
        Continuer <Icon name="arrowR" size={16} color="#fff" />
      </button>
    </div>
  )

  // Step 2 — Exam date
  if (step === 2) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '54px 24px 36px', background: A.bg, color: A.text, fontFamily: A.font }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <button onClick={() => setStep(1)} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
          <Icon name="chevronL" size={18} color={A.text} />
        </button>
        <div style={{ flex: 1, marginLeft: 14 }}><ProgressDots step={2} /></div>
        <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 600, marginLeft: 12 }}>3/{TOTAL}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.15, marginBottom: 10 }}>Ton examen, c&apos;est quand {name || 'toi'} ?</div>
        <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.5, marginBottom: 28 }}>Date du titre CNQAOS ou équivalent.</div>
        <input type="date" value={examDate} min={new Date().toISOString().slice(0, 10)} onChange={e => setExamDate(e.target.value)}
          style={{ width: '100%', height: 56, borderRadius: 14, background: A.surface, border: `1.5px solid ${A.primary}`, padding: '0 18px', fontSize: 18, fontWeight: 600, color: A.text, fontFamily: A.font, outline: 'none', boxShadow: `0 0 0 4px ${A.primary}18`, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' as const }}>
          {[{ label: 'Décembre 2026', value: '2026-12-18' }, { label: 'Juin 2026', value: '2026-06-15' }, { label: 'Mars 2027', value: '2027-03-20' }].map(s => (
            <button key={s.value} onClick={() => setExamDate(s.value)} style={{ background: examDate === s.value ? A.text : A.surface, color: examDate === s.value ? '#fff' : A.text, border: `0.5px solid ${examDate === s.value ? A.text : A.borderStrong}`, borderRadius: 18, padding: '7px 14px', cursor: 'pointer', fontFamily: A.font, fontSize: 12, fontWeight: 600 }}>{s.label}</button>
          ))}
        </div>
        <div style={{ marginTop: 22, padding: 16, background: A.primarySoft, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Icon name="calendar" size={22} color={A.primary} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: A.text, fontWeight: 600 }}>{examFmt}</div>
            <div style={{ fontSize: 11, color: A.textMuted, marginTop: 2 }}>Tu commences {daysToExam} jours en avance — largement le temps.</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: A.primary, letterSpacing: -0.5 }}>J−{daysToExam}</div>
        </div>
      </div>
      <button onClick={() => setStep(3)} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
        Continuer <Icon name="arrowR" size={16} color="#fff" />
      </button>
    </div>
  )

  // Step 3 — Goal
  if (step === 3) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '54px 24px 36px', background: A.bg, color: A.text, fontFamily: A.font }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <button onClick={() => setStep(2)} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
          <Icon name="chevronL" size={18} color={A.text} />
        </button>
        <div style={{ flex: 1, marginLeft: 14 }}><ProgressDots step={3} /></div>
        <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 600, marginLeft: 12 }}>4/{TOTAL}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.7, lineHeight: 1.15, marginBottom: 10 }}>Combien de minutes par jour ?</div>
        <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.5, marginBottom: 28 }}>Sois honnête. Tu pourras toujours ajuster.</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[5, 10, 15, 30].map(m => (
            <button key={m} onClick={() => setDailyMin(m)} style={{ flex: 1, height: 64, borderRadius: 14, background: dailyMin === m ? A.primary : A.surface, color: dailyMin === m ? '#fff' : A.text, border: `1.5px solid ${dailyMin === m ? A.primary : A.border}`, cursor: 'pointer', fontFamily: A.font, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: dailyMin === m ? '0 4px 14px rgba(10,102,224,0.28)' : 'none', transition: 'all .15s' }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{m}</div>
              <div style={{ fontSize: 10, opacity: dailyMin === m ? 0.85 : 0.6, fontWeight: 500 }}>min/jour</div>
            </button>
          ))}
        </div>
      </div>
      <button onClick={finish} disabled={loading} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,102,224,0.28)', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Enregistrement…' : <><Icon name="check" size={18} color="#fff" strokeWidth={2.5} /> Terminer</>}
      </button>
    </div>
  )

  return null
}
