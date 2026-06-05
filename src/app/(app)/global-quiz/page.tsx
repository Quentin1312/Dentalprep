'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppData } from '@/lib/app-context'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import PetCompanion from '@/components/pet/PetCompanion'
import type { PetType, PetState } from '@/components/pet/PetCompanion'
import Companion, { getMood } from '@/components/ui/Companion'
import { computeXP, xpToLevel } from '@/lib/xp'
import { recordSession } from '@/lib/recordSession'
import { readFlashQuestions, addFlashXP, type FlashQuestion } from '@/lib/flash-store'

type Phase = 'checking' | 'empty' | 'locked' | 'quiz' | 'done'
type GQuestion = FlashQuestion & { _id: string }
type LockedModule = { id: string; label: string }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function calcXP(correct: number, total: number): number {
  const acc = total > 0 ? correct / total : 0
  return correct * 10 + (acc >= 0.8 ? 30 : acc >= 0.6 ? 15 : 0)
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ
  const color = pct >= 80 ? A.green : pct >= 60 ? A.primary : pct >= 40 ? A.amber : A.red
  return (
    <svg width="130" height="130" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke={A.border} strokeWidth="9" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`} transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="50" y="47" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{pct}%</text>
      <text x="50" y="62" textAnchor="middle" fontSize="10" fill={A.textMuted}>précision</text>
    </svg>
  )
}

const MESSAGES = {
  perfect: { title: 'Parfait, tu déchires !',      sub: 'Maîtrise totale — continue comme ça !' },
  good:    { title: 'Bien joué !',                 sub: 'Tu progresses sur tous les modules.'    },
  okay:    { title: 'Pas mal !',                   sub: 'Continue à réviser régulièrement.'      },
  tough:   { title: 'Courage, tu vas y arriver !', sub: 'Reviens aux flashcards pour consolider.'},
}

export default function GlobalQuizPage() {
  const router = useRouter()
  const { data, refresh } = useAppData()
  const checkedRef = useRef(false)
  const startRef = useRef(Date.now())
  const savedRef = useRef(false)

  const [phase, setPhase] = useState<Phase>('checking')
  const [questions, setQuestions] = useState<GQuestion[]>([])
  const [lockedModules, setLockedModules] = useState<LockedModule[]>([])
  const [xpGained, setXpGained] = useState(0)

  // Quiz state
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])

  const petType = (data?.profile?.pet_type ?? 'cat') as PetType
  const petLevel = xpToLevel(computeXP(data?.attempts ?? []) + (data?.flashXpBonus ?? 0))

  useEffect(() => {
    if (checkedRef.current || !data) return
    checkedRef.current = true

    function check() {
      const pool = readFlashQuestions()
      if (pool.length < 5) { setPhase('empty'); return }

      if (!data) return

      // Unlock condition: every module that has courses must have ≥1 quiz attempt
      const moduleIds = [...new Set(data.courses.map(c => c.module_id))]
      const attemptedModuleIds = new Set(data.attempts.map(a => a.module_id))
      const missing = moduleIds.filter(id => !attemptedModuleIds.has(id))

      if (missing.length > 0) {
        setLockedModules(missing.map(id => ({ id, label: id })))
        setPhase('locked')
        return
      }

      const qs = shuffle(pool).slice(0, 20).map((q, i) => ({ ...q, _id: `g${i}` }))
      setQuestions(qs)
      startRef.current = Date.now()
      setPhase('quiz')
    }

    check()
  }, [data])

  function handleAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const correct = idx === questions[qIdx].correct_index
    setAnswers(prev => [...prev, correct])
  }

  async function nextQuestion() {
    const isLast = qIdx + 1 >= questions.length
    if (isLast) {
      if (!savedRef.current) {
        savedRef.current = true
        const score = answers.filter(Boolean).length
        const total = answers.length
        const gained = calcXP(score, total)
        setXpGained(gained)
        const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
        addFlashXP(gained)
        if (data?.userId) await recordSession(data.userId, elapsed)
        refresh()
      }
      setPhase('done')
    } else {
      setQIdx(q => q + 1)
      setSelected(null)
    }
  }

  // ── CHECKING ──────────────────────────────────────────────────
  if (phase === 'checking') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: A.bg, fontFamily: A.font }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `4px solid ${A.primarySoft}`, borderTop: `4px solid #7C3AED`, animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 15, color: A.textMuted }}>Vérification de la maîtrise…</div>
    </div>
  )

  // ── EMPTY — pas assez de questions ────────────────────────────
  if (phase === 'empty') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: A.bg, fontFamily: A.font, padding: '0 28px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 24, background: '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon name="sparkle" size={32} color="#7C3AED" />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: A.text, marginBottom: 8 }}>Quiz Global verrouillé</div>
      <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.55, marginBottom: 28 }}>
        Fais d&apos;abord quelques Quiz Flash pour accumuler des questions.<br />
        Il faut au moins <strong>5 questions</strong> dans le pool.
      </div>
      <button onClick={() => router.push('/quick-scan')} style={{ height: 50, paddingInline: 28, borderRadius: 14, background: A.primary, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
        Faire un Quiz Flash
      </button>
      <button onClick={() => router.back()} style={{ marginTop: 12, height: 44, paddingInline: 20, borderRadius: 12, background: 'none', border: 'none', color: A.textMuted, fontSize: 14, fontFamily: A.font, cursor: 'pointer' }}>
        Retour
      </button>
    </div>
  )

  // ── LOCKED — quiz manquants ──────────────────────────────────
  if (phase === 'locked') return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 48 }}>
      <div style={{ padding: '62px 20px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="chevronL" size={16} color={A.text} />
        </button>
        <div>
          <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Quiz Global</div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Accès verrouillé 🔒</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ background: '#F3E8FF', borderRadius: 16, padding: '14px 16px', marginBottom: 20, border: '1px solid #DDD6FE' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', marginBottom: 4 }}>Condition d&apos;accès</div>
          <div style={{ fontSize: 13, color: A.text, lineHeight: 1.5 }}>
            Tu dois avoir fait le quiz de <strong>chaque module</strong> pour lequel tu as des cours.
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: A.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>
          Modules à compléter
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lockedModules.map(m => (
            <div key={m.id} style={{ background: A.surface, borderRadius: 14, padding: '12px 14px', border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: A.red }}>{m.id}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: A.text }}>Module {m.id} — quiz non fait</div>
            </div>
          ))}
        </div>

        <button onClick={() => router.push('/library')} style={{ marginTop: 20, width: '100%', height: 50, borderRadius: 14, background: A.primary, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
          Aller faire les quiz
        </button>
      </div>
    </div>
  )

  // ── QUIZ ──────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = questions[qIdx]
    const petState: PetState = selected !== null
      ? (selected === q.correct_index ? 'correct' : 'wrong')
      : 'idle'
    return (
      <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{
          position: 'fixed', bottom: 75, right: 12, zIndex: 25, pointerEvents: 'none',
          transform: petState === 'idle' ? 'translateY(62px)' : 'translateY(0)',
          transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <PetCompanion petType={petType} state={petState} size={84} level={petLevel} equipped={data?.profile.equipped_accessories ?? {}} />
        </div>

        <div style={{ padding: '60px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="x" size={16} color={A.text} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>Quiz Global · tous modules</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{qIdx + 1}<span style={{ color: A.textDim }}>/{questions.length}</span></div>
          </div>
        </div>

        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 4 }}>
          {questions.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < answers.length ? (answers[i] ? A.green : A.red) : i === qIdx ? '#7C3AED88' : '#E1E5EC' }} />
          ))}
        </div>

        <div style={{ padding: '0 20px', flex: 1 }}>
          <div style={{ background: A.surface, borderRadius: 20, border: `0.5px solid ${A.border}`, padding: 24, marginBottom: 16, boxShadow: '0 4px 16px rgba(15,27,45,0.06)' }}>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: A.text }}>{q.question}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.choices.map((choice, ci) => {
              const isCorrect = ci === q.correct_index
              const isSelected = selected === ci
              let bg: string = A.surface
              let border: string = `0.5px solid ${A.border}`
              let color: string = A.text
              if (selected !== null) {
                if (isCorrect) { bg = A.greenSoft; border = `1.5px solid ${A.green}`; color = A.green }
                else if (isSelected) { bg = '#FEF2F2'; border = `1.5px solid ${A.red}`; color = A.red }
              }
              return (
                <button key={ci} onClick={() => handleAnswer(ci)} disabled={selected !== null} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: bg, border, cursor: selected !== null ? 'default' : 'pointer', fontFamily: A.font, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: selected !== null && isCorrect ? A.green : selected !== null && isSelected ? A.red : '#E9ECF2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: selected !== null && (isCorrect || isSelected) ? '#fff' : A.textMuted }}>{['A','B','C','D'][ci]}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color }}>{choice}</span>
                </button>
              )
            })}
          </div>

          {selected !== null && (
            <>
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: selected === q.correct_index ? A.greenSoft : '#FEF2F2', border: `0.5px solid ${selected === q.correct_index ? A.green : A.red}30` }}>
                <div style={{ fontSize: 13, color: selected === q.correct_index ? A.green : A.red, fontWeight: 600, marginBottom: 4 }}>
                  {selected === q.correct_index ? '✓ Correct !' : '✗ Incorrect'}
                </div>
                <div style={{ fontSize: 13, color: A.text, lineHeight: 1.4 }}>{q.explanation}</div>
              </div>
              <button onClick={nextQuestion} style={{ marginTop: 12, width: '100%', height: 50, borderRadius: 14, border: 'none', background: '#7C3AED', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(124,58,237,0.32)' }}>
                {qIdx + 1 >= questions.length ? 'Voir les résultats' : 'Question suivante'} <Icon name="arrowR" size={16} color="#fff" />
              </button>
            </>
          )}
        </div>
        <div style={{ height: 40 }} />
      </div>
    )
  }

  // ── DONE ──────────────────────────────────────────────────────
  const score = answers.filter(Boolean).length
  const total = answers.length
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0
  const mood = getMood(accuracy)
  const { title, sub } = MESSAGES[mood]
  const wrongQs = questions.filter((_, i) => answers[i] === false)

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px 40px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Companion mood={mood} size={100} />
        <div style={{ background: A.surface, border: `0.5px solid ${A.border}`, borderRadius: 18, padding: '13px 20px', maxWidth: 280, textAlign: 'center', boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: A.textMuted, lineHeight: 1.45 }}>{sub}</div>
        </div>
      </div>

      <ScoreRing pct={accuracy} />

      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340, margin: '20px 0 16px' }}>
        {([
          { label: 'Questions', value: total,         color: A.text  },
          { label: 'Correctes', value: score,         color: A.green },
          { label: 'Erreurs',   value: total - score, color: A.red   },
        ] as const).map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, background: A.surface, border: `0.5px solid ${A.border}`, borderRadius: 14, padding: '14px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: A.textMuted, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#F3E8FF', border: '1px solid #DDD6FE', borderRadius: 14, padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 340, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>⭐</span>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#7C3AED' }}>+{xpGained} XP</div>
          <div style={{ fontSize: 12, color: A.textMuted }}>gagnés cette session</div>
        </div>
      </div>

      {wrongQs.length > 0 && (
        <div style={{ width: '100%', maxWidth: 340, background: A.amberSoft, border: `0.5px solid ${A.amber}30`, borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: A.amber, marginBottom: 8 }}>
            {wrongQs.length} question{wrongQs.length > 1 ? 's' : ''} à retravailler
          </div>
          {wrongQs.map((wq, i) => (
            <div key={i} style={{ fontSize: 12, color: A.text, padding: '4px 0', lineHeight: 1.35, borderTop: i > 0 ? `0.5px solid ${A.amber}30` : 'none' }}>
              {wq.question.length > 72 ? wq.question.slice(0, 72) + '…' : wq.question}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
        <button onClick={() => router.push('/dashboard')} style={{ flex: 1, height: 50, borderRadius: 14, background: A.surface, border: `0.5px solid ${A.borderStrong}`, color: A.text, fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer' }}>
          Accueil
        </button>
        <button onClick={() => router.push('/quick-scan')} style={{ flex: 1, height: 50, borderRadius: 14, background: '#7C3AED', border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.28)' }}>
          Quiz Flash
        </button>
      </div>
    </div>
  )
}
