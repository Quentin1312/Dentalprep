'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppData } from '@/lib/app-context'
import { A } from '@/lib/theme'
import { useThemeBg, themeBgStyle } from '@/lib/theme-bg'
import { recordSession } from '@/lib/recordSession'
import { addFlashXP } from '@/lib/flash-store'
import { computeXP, xpToLevel } from '@/lib/xp'
import Icon from '@/components/ui/Icon'
import PetCompanion from '@/components/pet/PetCompanion'
import type { PetType, PetState } from '@/components/pet/PetCompanion'

type Code = { id: string; code: string; label: string; family: string }
type Attempt = { code: string; is_correct: boolean }

const ROUND_SIZE = 10

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistractors(target: Code, pool: Code[], n: number): Code[] {
  // Distracteurs : préfère même famille pour rendre la question difficile
  const sameFamily = pool.filter(c => c.id !== target.id && c.family === target.family)
  const otherFamily = pool.filter(c => c.id !== target.id && c.family !== target.family)
  const distract = [...shuffle(sameFamily), ...shuffle(otherFamily)].slice(0, n)
  return distract
}

type Question = { code: Code; options: Code[]; correctIdx: number }

function buildRound(pool: Code[], attempts: Attempt[]): Question[] {
  if (pool.length === 0) return []
  // Priorité : codes ratés récemment > codes jamais vus > codes maîtrisés
  const scoreByCode: Record<string, number> = {}
  for (const a of attempts) {
    if (!(a.code in scoreByCode)) scoreByCode[a.code] = 0
    scoreByCode[a.code] += a.is_correct ? 1 : -2
  }
  const sorted = [...pool].sort((a, b) => (scoreByCode[a.code] ?? 0) - (scoreByCode[b.code] ?? 0))
  // Pioche : 60% des moins maîtrisés, 40% au hasard
  const half = Math.ceil(ROUND_SIZE * 0.6)
  const top = sorted.slice(0, half * 2)
  const rest = sorted.slice(half * 2)
  const picked = [...shuffle(top).slice(0, half), ...shuffle(rest).slice(0, ROUND_SIZE - half)]
    .slice(0, ROUND_SIZE)
  return picked.map(code => {
    const distractors = pickDistractors(code, pool, 3)
    const options = shuffle([code, ...distractors])
    return { code, options, correctIdx: options.findIndex(o => o.id === code.id) }
  })
}

export default function DrillPage() {
  const router = useRouter()
  const [themeId] = useThemeBg()
  const { data: appData, refresh } = useAppData()
  const startRef = useRef<number>(Date.now())

  const [userId, setUserId] = useState<string | null>(null)
  const [pool, setPool] = useState<Code[]>([])
  const [pastAttempts, setPastAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<boolean[]>([])
  const [finished, setFinished] = useState(false)
  const [petState, setPetState] = useState<PetState>('idle')
  const [xpAnim, setXpAnim] = useState<number>(0)

  useEffect(() => {
    const supabase = createClient() as any
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      startRef.current = Date.now()
      Promise.all([
        supabase.from('ccam_codes').select('id,code,label,family').eq('user_id', user.id),
        supabase.from('ccam_drill_attempts').select('code,is_correct').eq('user_id', user.id),
      ]).then(([codesRes, attemptsRes]: any) => {
        const codes: Code[] = codesRes.data ?? []
        const attempts: Attempt[] = attemptsRes.data ?? []
        setPool(codes)
        setPastAttempts(attempts)
        setQuestions(buildRound(codes, attempts))
        setLoading(false)
      })
    })
  }, [router])

  const q = questions[idx]
  const total = questions.length

  const petType = (appData?.profile.pet_type as PetType) ?? 'cat'
  const totalXP = (appData ? computeXP(appData.attempts) : 0) + (appData?.flashXpBonus ?? 0)
  const level = xpToLevel(totalXP)

  async function submit() {
    if (picked === null || !q || !userId) return
    const isCorrect = picked === q.correctIdx
    setShowResult(true)
    setResults(r => [...r, isCorrect])
    setPetState(isCorrect ? 'correct' : 'wrong')
    // XP : 10 si juste, 2 sinon (comme les quiz)
    const earn = isCorrect ? 10 : 2
    addFlashXP(earn)
    setXpAnim(earn)
    const supabase = createClient() as any
    supabase.from('ccam_drill_attempts').insert({
      user_id: userId,
      code: q.code.code,
      is_correct: isCorrect,
    })
  }

  function next() {
    setPicked(null)
    setShowResult(false)
    setPetState('idle')
    if (idx + 1 >= total) {
      // Fin
      setFinished(true)
      const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
      if (userId) void recordSession(userId, elapsed)
      void refresh()
      return
    }
    setIdx(i => i + 1)
  }

  function restart() {
    setQuestions(buildRound(pool, [...pastAttempts, ...questions.slice(0, idx + 1).map((qq, i) => ({ code: qq.code.code, is_correct: results[i] ?? false }))]))
    setIdx(0)
    setPicked(null)
    setShowResult(false)
    setResults([])
    setFinished(false)
    setPetState('idle')
    startRef.current = Date.now()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${A.primary}`, borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (pool.length < 4) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: A.text, fontFamily: A.font, textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 800 }}>Pas assez de codes pour démarrer le drill.</div>
      <div style={{ fontSize: 13, color: A.textMuted, marginTop: 8 }}>Il faut au moins 4 codes dans la base.</div>
      <Link href="/practice" style={{ marginTop: 16, color: A.primary, fontWeight: 700 }}>← Retour</Link>
    </div>
  )

  if (finished) {
    const ok = results.filter(Boolean).length
    const perfect = ok === total
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: A.text, fontFamily: A.font, textAlign: 'center', ...themeBgStyle(themeId) }}>
        <div style={{
          width: 96, height: 96, borderRadius: 32,
          background: perfect ? 'linear-gradient(135deg, #FFD84A 0%, #F59E0B 100%)' : 'linear-gradient(135deg, #0A66E0 0%, #5B21B6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 48,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        }}>{perfect ? '🏆' : '🎯'}</div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.6, marginBottom: 6 }}>
          {perfect ? 'Sans-faute !' : 'Drill terminé'}
        </div>
        <div style={{ fontSize: 16, color: A.textMuted, marginBottom: 4 }}>
          {ok} <span style={{ color: A.text, fontWeight: 700 }}>/ {total}</span> codes maîtrisés
        </div>
        <div style={{ fontSize: 14, color: '#D97706', fontWeight: 800, marginBottom: 28 }}>
          +{results.reduce((s, c) => s + (c ? 10 : 2), 0)} XP
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
          <Link href="/practice" style={{ flex: 1, textDecoration: 'none' }}>
            <button style={{
              width: '100%', height: 50, borderRadius: 14, background: '#fff', border: `1.5px solid ${A.primary}`,
              color: A.primary, fontSize: 15, fontWeight: 700, fontFamily: A.font, cursor: 'pointer',
            }}>Quitter</button>
          </Link>
          <button onClick={restart} style={{
            flex: 1, height: 50, borderRadius: 14, background: A.primary, border: 'none',
            color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: A.font, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(10,102,224,0.28)',
          }}>Rejouer 10 codes</button>
        </div>
      </div>
    )
  }

  if (!q) return null

  return (
    <div style={{ minHeight: '100vh', fontFamily: A.font, ...themeBgStyle(themeId), paddingBottom: 100, color: A.text, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes xp-float{0%{opacity:1;transform:translateY(0) scale(1)}30%{opacity:1;transform:translateY(-18px) scale(1.25)}100%{opacity:0;transform:translateY(-64px) scale(0.8)}}
        @keyframes pop{0%{transform:scale(.95)}60%{transform:scale(1.02)}100%{transform:scale(1)}}
      `}</style>

      {/* +XP float */}
      {xpAnim > 0 && showResult && (
        <div key={`xp-${idx}-${xpAnim}`} style={{
          position: 'fixed', bottom: 184, right: 28, zIndex: 30, pointerEvents: 'none',
          fontSize: 22, fontWeight: 900, color: '#FFD84A',
          textShadow: '0 0 14px rgba(255,216,74,0.7), 0 2px 4px rgba(0,0,0,0.4)',
          animation: 'xp-float 1.4s ease-out forwards',
        }}>+{xpAnim} XP</div>
      )}

      {/* Pet */}
      <div style={{
        position: 'fixed', bottom: 72, right: 12, zIndex: 25, pointerEvents: 'none',
        transform: petState === 'idle' ? 'translateY(62px)' : 'translateY(0)',
        transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <PetCompanion petType={petType} state={petState} size={84} level={level} />
      </div>

      {/* Top bar */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.push('/practice')}
          aria-label="Quitter"
          style={{
            width: 36, height: 36, borderRadius: 12, background: '#fff',
            border: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, cursor: 'pointer',
          }}>
          <Icon name="x" size={14} color={A.text} strokeWidth={2.2} />
        </button>
        <div style={{ flex: 1, display: 'flex', gap: 3 }}>
          {Array.from({ length: total }).map((_, i) => {
            const isCurrent = i === idx
            const r = results[i]
            const bg = isCurrent
              ? A.primary
              : r === true ? '#16A34A'
              : r === false ? '#EF4444'
              : '#E4E8EE'
            return (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 3, background: bg,
                boxShadow: isCurrent ? `0 0 0 2px ${A.primary}33` : 'none',
                transition: 'background .3s ease',
              }} />
            )
          })}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
          {idx + 1}<span style={{ color: '#9CA3AF', fontWeight: 500 }}>/{total}</span>
        </div>
      </div>

      {/* Question */}
      <div style={{ flex: 1, padding: '16px 16px 24px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <div style={{
          background: '#fff', borderRadius: 18, padding: 22,
          border: `1px solid ${A.border}`, marginBottom: 18,
          animation: 'pop 0.3s ease-out',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: A.primary,
            textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6,
          }}>
            Code pour cet acte
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: A.text, lineHeight: 1.35, letterSpacing: -0.2 }}>
            {q.code.label}
          </div>
        </div>

        {/* Propositions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {q.options.map((opt, i) => {
            const isPicked = picked === i
            const isCorrect = i === q.correctIdx
            let bg = '#fff'
            let borderColor: string = A.border
            let textColor: string = A.text
            if (showResult) {
              if (isCorrect) { bg = '#DCFCE7'; borderColor = '#16A34A'; textColor = '#166534' }
              else if (isPicked) { bg = '#FEE2E2'; borderColor = '#EF4444'; textColor = '#991B1B' }
            } else if (isPicked) {
              bg = '#EEF4FF'; borderColor = A.primary; textColor = A.primary
            }
            return (
              <button
                key={opt.id}
                onClick={() => !showResult && setPicked(i)}
                disabled={showResult}
                style={{
                  background: bg, color: textColor,
                  border: `2px solid ${borderColor}`,
                  borderRadius: 14, padding: '16px 12px',
                  fontFamily: 'monospace', fontSize: 16, fontWeight: 800, letterSpacing: 1,
                  cursor: showResult ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                }}
              >
                {opt.code}
              </button>
            )
          })}
        </div>

        {/* Bouton submit / next */}
        <div style={{ marginTop: 18 }}>
          {!showResult ? (
            <button
              onClick={submit}
              disabled={picked === null}
              style={{
                width: '100%', padding: '14px 18px', borderRadius: 14,
                background: picked === null ? '#E4E8EE' : A.primary,
                color: picked === null ? A.textMuted : '#fff',
                border: 'none', fontSize: 15, fontWeight: 800, fontFamily: A.font,
                cursor: picked === null ? 'default' : 'pointer',
                boxShadow: picked === null ? 'none' : '0 4px 14px rgba(10,102,224,0.28)',
              }}
            >Valider</button>
          ) : (
            <button
              onClick={next}
              style={{
                width: '100%', padding: '14px 18px', borderRadius: 14,
                background: A.primary, color: '#fff', border: 'none',
                fontSize: 15, fontWeight: 800, fontFamily: A.font,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(10,102,224,0.28)',
              }}
            >{idx + 1 >= total ? 'Voir le score' : 'Question suivante'}</button>
          )}
        </div>
      </div>
    </div>
  )
}
