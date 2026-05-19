'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import PetCompanion, { PET_NAMES } from '@/components/pet/PetCompanion'
import type { PetType } from '@/components/pet/PetCompanion'

const TOTAL = 5

function ProgressDots({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: TOTAL }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? A.primary : '#E1E5EC', transition: 'background .25s' }} />
      ))}
    </div>
  )
}

function Shell({ children, button, header }: { children: React.ReactNode; button: React.ReactNode; header?: React.ReactNode }) {
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: A.bg, color: A.text, fontFamily: A.font, overflow: 'hidden', maxWidth: '100vw' }}>
      {header && <div style={{ flexShrink: 0, padding: '48px 24px 16px' }}>{header}</div>}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' as never, padding: header ? '0 24px' : '48px 24px 0' }}>
        {children}
      </div>
      <div style={{ flexShrink: 0, padding: '16px 24px 36px' }}>
        {button}
      </div>
    </div>
  )
}

const PET_COLORS: Record<PetType, { accent: string; soft: string }> = {
  cat:   { accent: '#FFD84A', soft: 'rgba(255,216,74,0.12)' },
  dog:   { accent: '#5BB8D4', soft: 'rgba(91,184,212,0.12)' },
  bunny: { accent: '#E86090', soft: 'rgba(232,96,144,0.12)' },
}

const PET_DESCRIPTIONS: Record<PetType, string> = {
  cat:   'Mystérieuse et vive',
  dog:   'Enthousiaste et fidèle',
  bunny: 'Douce et curieuse',
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [petType, setPetType] = useState<PetType>('cat')
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
    await supabase.from('profiles').update({
      full_name: name,
      exam_date: examDate,
      daily_goal_minutes: dailyMin,
      pet_type: petType,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    router.push('/dashboard')
  }

  const btnStyle = (active = true): React.CSSProperties => ({
    width: '100%', height: 52, borderRadius: 14, border: 'none',
    background: active ? A.primary : A.surface,
    color: active ? '#fff' : A.textMuted,
    fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: active ? 'pointer' : 'default',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: active ? 1 : 0.45,
    boxShadow: active ? '0 4px 14px rgba(10,102,224,0.28)' : 'none',
  })

  const backBtn = (onBack: () => void, stepN: number) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
        <Icon name="chevronL" size={18} color={A.text} />
      </button>
      <div style={{ flex: 1 }}><ProgressDots step={stepN} /></div>
      <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 600, flexShrink: 0 }}>{stepN + 1}/{TOTAL}</div>
    </div>
  )

  // Step 0 — Welcome
  if (step === 0) return (
    <Shell
      header={<ProgressDots step={0} />}
      button={
        <button onClick={() => setStep(1)} style={btnStyle()}>
          C&apos;est parti <Icon name="arrowR" size={18} color="#fff" />
        </button>
      }
    >
      <div style={{ paddingTop: 16, paddingBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${A.primary} 0%, ${A.primaryDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 12px 32px rgba(10,102,224,0.32)' }}>
          <Icon name="tooth" size={30} color="#fff" strokeWidth={1.6} />
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 10 }}>Bienvenue sur<br />DentalPrep.</div>
        <div style={{ fontSize: 15, color: A.textMuted, lineHeight: 1.5, marginBottom: 28 }}>
          On va régler 4 trucs ensemble pour personnaliser ta préparation. Ça prend moins de 30 secondes.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { t: 'Ton prénom', s: 'Pour les rappels personnalisés' },
            { t: 'Ton compagnon', s: 'Le petit animal qui te guide' },
            { t: "Ta date d'examen", s: 'Pour calculer ton planning' },
            { t: 'Ton objectif', s: 'Combien de minutes par jour' },
          ].map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: A.surface, borderRadius: 14, border: `0.5px solid ${A.border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.primary, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{it.t}</div>
                <div style={{ fontSize: 12, color: A.textMuted }}>{it.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )

  // Step 1 — Name
  if (step === 1) return (
    <Shell
      header={backBtn(() => setStep(0), 1)}
      button={
        <button onClick={() => name.trim() && setStep(2)} style={btnStyle(!!name.trim())}>
          Continuer <Icon name="arrowR" size={16} color="#fff" />
        </button>
      }
    >
      <div style={{ paddingTop: 16, paddingBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 8 }}>
          Comment tu t&apos;appelles ?
        </div>
        <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.5, marginBottom: 24 }}>
          Pour que les rappels te parlent directement.
        </div>
        <input
          autoFocus type="text" placeholder="Léa" value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
          style={{ width: '100%', height: 56, borderRadius: 14, background: A.surface, border: `1.5px solid ${name ? A.primary : A.border}`, padding: '0 18px', fontSize: 20, fontWeight: 600, color: A.text, fontFamily: A.font, outline: 'none', boxShadow: name ? `0 0 0 4px ${A.primary}18` : 'none', boxSizing: 'border-box' }}
        />
        <div style={{ fontSize: 12, color: A.textDim, marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="info" size={12} color={A.textDim} /> Modifiable à tout moment dans ton profil.
        </div>
      </div>
    </Shell>
  )

  // Step 2 — Pet selection
  if (step === 2) {
    const pets: PetType[] = ['cat', 'dog', 'bunny']
    return (
      <Shell
        header={backBtn(() => setStep(1), 2)}
        button={
          <button onClick={() => setStep(3)} style={btnStyle()}>
            Continuer <Icon name="arrowR" size={16} color="#fff" />
          </button>
        }
      >
        <div style={{ paddingTop: 16, paddingBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 8 }}>
            Choisis ton compagnon, {name || 'toi'} !
          </div>
          <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.5, marginBottom: 24 }}>
            Il t&apos;accompagnera dans tous tes quiz et te donnera des encouragements.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {pets.map(pet => {
              const sel = petType === pet
              const colors = PET_COLORS[pet]
              return (
                <button
                  key={pet}
                  onClick={() => setPetType(pet)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 18,
                    padding: '16px 18px',
                    borderRadius: 18,
                    background: sel ? colors.soft : A.surface,
                    border: `2px solid ${sel ? colors.accent : A.border}`,
                    cursor: 'pointer',
                    fontFamily: A.font,
                    textAlign: 'left',
                    transition: 'all .18s',
                    boxShadow: sel ? `0 4px 20px ${colors.accent}30` : 'none',
                    width: '100%',
                  }}
                >
                  <div style={{ flexShrink: 0, width: 80, height: 94, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <PetCompanion petType={pet} state="idle" size={80} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: sel ? colors.accent : A.text, letterSpacing: -0.4, marginBottom: 3 }}>
                      {PET_NAMES[pet]}
                    </div>
                    <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>
                      {PET_DESCRIPTIONS[pet]}
                    </div>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: 12, border: `2px solid ${sel ? colors.accent : A.border}`, background: sel ? colors.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .18s' }}>
                    {sel && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Shell>
    )
  }

  // Step 3 — Exam date
  if (step === 3) return (
    <Shell
      header={backBtn(() => setStep(2), 3)}
      button={
        <button onClick={() => setStep(4)} style={btnStyle()}>
          Continuer <Icon name="arrowR" size={16} color="#fff" />
        </button>
      }
    >
      <div style={{ paddingTop: 16, paddingBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 8 }}>
          Ton examen, c&apos;est quand {name || 'toi'} ?
        </div>
        <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.5, marginBottom: 24 }}>
          Date du titre CNQAOS ou équivalent.
        </div>
        <div style={{ overflow: 'hidden', borderRadius: 14 }}>
          <input
            type="date" value={examDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setExamDate(e.target.value)}
            style={{ width: '100%', maxWidth: '100%', height: 52, borderRadius: 14, background: A.surface, border: `1.5px solid ${A.primary}`, padding: '0 18px', fontSize: 16, fontWeight: 600, color: A.text, fontFamily: A.font, outline: 'none', boxSizing: 'border-box', display: 'block', WebkitAppearance: 'none' as never }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {[{ label: 'Déc. 2026', value: '2026-12-18' }, { label: 'Juin 2026', value: '2026-06-15' }, { label: 'Mars 2027', value: '2027-03-20' }].map(s => (
            <button key={s.value} onClick={() => setExamDate(s.value)} style={{ background: examDate === s.value ? A.text : A.surface, color: examDate === s.value ? '#fff' : A.text, border: `0.5px solid ${examDate === s.value ? A.text : A.borderStrong}`, borderRadius: 18, padding: '7px 14px', cursor: 'pointer', fontFamily: A.font, fontSize: 12, fontWeight: 600 }}>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 20, padding: 14, background: A.primarySoft, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="calendar" size={20} color={A.primary} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: A.text, fontWeight: 600 }}>{examFmt}</div>
            <div style={{ fontSize: 11, color: A.textMuted, marginTop: 2 }}>Tu commences {daysToExam} jours en avance.</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: A.primary }}>J−{daysToExam}</div>
        </div>
      </div>
    </Shell>
  )

  // Step 4 — Goal
  if (step === 4) return (
    <Shell
      header={backBtn(() => setStep(3), 4)}
      button={
        <button onClick={finish} disabled={loading} style={btnStyle(!loading)}>
          {loading ? 'Enregistrement…' : <><Icon name="check" size={18} color="#fff" strokeWidth={2.5} /> Terminer</>}
        </button>
      }
    >
      <div style={{ paddingTop: 16, paddingBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.15, marginBottom: 8 }}>
          Combien de minutes par jour ?
        </div>
        <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.5, marginBottom: 24 }}>
          Sois honnête. Tu pourras toujours ajuster.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[{ m: 5, label: 'Rapide', sub: '5 min/jour' }, { m: 10, label: 'Régulier', sub: '10 min/jour' }, { m: 15, label: 'Sérieux', sub: '15 min/jour' }, { m: 30, label: 'Intensif', sub: '30 min/jour' }].map(({ m, label, sub }) => (
            <button key={m} onClick={() => setDailyMin(m)} style={{ height: 80, borderRadius: 14, background: dailyMin === m ? A.primary : A.surface, color: dailyMin === m ? '#fff' : A.text, border: `1.5px solid ${dailyMin === m ? A.primary : A.border}`, cursor: 'pointer', fontFamily: A.font, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, boxShadow: dailyMin === m ? '0 4px 14px rgba(10,102,224,0.28)' : 'none' }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>{m} min</div>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: dailyMin === m ? 0.85 : 0.55 }}>{label}</div>
            </button>
          ))}
        </div>
      </div>
    </Shell>
  )

  return null
}
