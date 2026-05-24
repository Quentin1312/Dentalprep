'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recordSession } from '@/lib/recordSession'
import { useAppData } from '@/lib/app-context'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'
import PetCompanion from '@/components/pet/PetCompanion'
import type { PetType, PetState } from '@/components/pet/PetCompanion'
import { computeXP } from '@/lib/xp'
import QuizSummary from './QuizSummary'

type QType = 'QCM' | 'VF' | 'ORDRE' | 'ASSOCIATION'

type AssociationChoices = {
  left: string[]
  right: string[]
  /** correctMap[i] = index in `right` that pairs with `left[i]` */
  correctMap: number[]
}

type Question = {
  id: string
  /** Defaults to 'QCM' when absent (back-compat with existing DB rows). */
  type?: QType
  question: string
  /**
   * QCM:         string[] (the 4 options)
   * VF:          string[] (usually ['Vrai', 'Faux'])
   * ORDRE:       string[] (items in *correct* order — UI shuffles them)
   * ASSOCIATION: AssociationChoices
   */
  choices: unknown
  /**
   * QCM / VF: index of the right option in `choices`.
   * ORDRE / ASSOCIATION: sentinel — set to 1; the UI sets `picked` to 1 when
   * the user's arrangement matches and to 0 otherwise.
   */
  correct_index: number
  explanation: string
  module_id: string
  page_image_url?: string | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Small label/typography helpers — kept inline-styled, no className.
// ─────────────────────────────────────────────────────────────────────────────

const FONT = A.font

function shuffle<T>(arr: T[], seed: string): T[] {
  // Deterministic per question id so a refresh doesn't re-shuffle.
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) | 0
    const j = Math.abs(h) % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const PAIR_COLORS = ['#8B5CF6', '#0EA5E9', '#F59E0B', '#10B981', '#EC4899', '#6366F1']

export default function QuizClient({
  questions,
  moduleId,
  userId,
  mode = 'normal',
  attemptStats = new Map(),
  petType = 'cat',
  level = 1,
  backHref,
  headerLabel,
}: {
  questions: Question[]
  moduleId: string
  userId: string
  mode?: 'normal' | 'smart'
  attemptStats?: Map<string, { ok: number; total: number }>
  petType?: PetType
  level?: number
  backHref?: string
  headerLabel?: string
}) {
  const router = useRouter()
  const { data, refresh } = useAppData()
  const startRef = useRef(Date.now())
  const [xpBefore] = useState(() => computeXP((data?.attempts as { is_correct: boolean }[] | undefined) ?? []))
  // Queue-based: wrong answers go back to end until answered correctly
  const [queue, setQueue] = useState<Question[]>(() => [...questions])
  const [completed, setCompleted] = useState(0)
  const [wrongAttemptIds, setWrongAttemptIds] = useState<Set<string>>(new Set())
  const [picked, setPicked] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)
  const [xpAnim, setXpAnim] = useState(0)
  // Monotonic counter — increments every time we move to the next question,
  // even if it's the same question coming back. Used to reset interaction state.
  const [questionKey, setQuestionKey] = useState(0)

  const originalTotal = questions.length

  // Type-specific local interaction state. Resets per question via useEffect.
  const [orderState, setOrderState] = useState<number[]>([])
  const [pairs, setPairs] = useState<Array<{ l: number; r: number }>>([])
  const [pendingLeft, setPendingLeft] = useState<number | null>(null)
  const [pendingRight, setPendingRight] = useState<number | null>(null)

  const q = queue[0]
  const qtype: QType = (q?.type ?? 'QCM') as QType

  // Reset per-question interaction state on every question advance (including repeats).
  useEffect(() => {
    setOrderState([])
    setPairs([])
    setPendingLeft(null)
    setPendingRight(null)
  }, [questionKey])

  // Pet animation state — preserved from original.
  const petState: PetState = showResult
    ? (picked === q?.correct_index ? 'correct' : 'wrong')
    : picked !== null ? 'thinking' : 'idle'

  const stat = attemptStats.get(q?.id ?? '')
  const wasTricky = stat && stat.total > 0 && stat.ok / stat.total < 0.6

  async function submit() {
    if (picked === null) return
    setShowResult(true)
    const isCorrect = picked === q.correct_index
    if (isCorrect) { setCompleted(c => c + 1); setXpAnim(n => n + 1) }
    else { setWrongAttemptIds(prev => new Set([...prev, q.id])) }
    const supabase = createClient()
    supabase.from('quiz_attempts').insert({
      user_id: userId,
      module_id: (q.module_id || moduleId) as ModuleId,
      question_id: q.id,
      selected_index: picked,
      is_correct: isCorrect,
    }).then(() => refresh())
  }

  async function next() {
    const isCorrect = picked === q.correct_index
    if (isCorrect) {
      const newQueue = queue.slice(1)
      if (newQueue.length === 0) {
        setFinished(true)
        const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
        await recordSession(userId, elapsed)
        return
      }
      setQueue(newQueue)
    } else {
      // Wrong: put question back at end of queue
      setQueue(prev => [...prev.slice(1), prev[0]])
    }
    setPicked(null)
    setShowResult(false)
    setQuestionKey(k => k + 1)
  }

  function restart() {
    setQueue([...questions])
    setCompleted(0)
    setWrongAttemptIds(new Set())
    setPicked(null)
    setShowResult(false)
    setFinished(false)
    setQuestionKey(k => k + 1)
    startRef.current = Date.now()
  }

  if (finished) return (
    <QuizSummary
      scoreOk={originalTotal - wrongAttemptIds.size}
      scoreBad={wrongAttemptIds.size}
      total={originalTotal}
      moduleId={moduleId}
      wrongQuestions={[]}
      onRestart={() => restart()}
      onRestartWrong={() => {}}
      backHref={backHref}
      petType={petType}
      level={level}
      xpBefore={xpBefore}
    />
  )

  const toReviewCount = mode === 'smart' ? questions.filter(qq => {
    const s = attemptStats.get(qq.id)
    return s && s.total > 0 && s.ok / s.total < 0.5
  }).length : 0

  const completedSegments = completed

  // ── Type-aware label
  const typeLabel: Record<QType, string> = {
    QCM: 'QCM',
    VF: 'Vrai / Faux',
    ORDRE: 'Ordre',
    ASSOCIATION: 'Association',
  }

  return (
    <div style={{
      minHeight: '100vh', background: A.bg, color: A.text, fontFamily: FONT,
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes xp-float{0%{opacity:1;transform:translateY(0) scale(1)}30%{opacity:1;transform:translateY(-18px) scale(1.25)}100%{opacity:0;transform:translateY(-64px) scale(0.8)}}
        @keyframes q-fade-in{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes q-pop{0%{transform:scale(.96)}60%{transform:scale(1.02)}100%{transform:scale(1)}}
        button:active:not(:disabled){transform:scale(.985)}
      `}</style>

      {/* +XP float */}
      {xpAnim > 0 && (
        <div key={xpAnim} style={{
          position: 'fixed', bottom: 184, right: 28, zIndex: 30, pointerEvents: 'none',
          fontSize: 20, fontWeight: 900, color: '#FFD84A',
          textShadow: '0 0 14px rgba(255,216,74,0.7), 0 2px 4px rgba(0,0,0,0.4)',
          animation: 'xp-float 1.1s ease-out forwards',
          fontFamily: FONT,
        }}>+10 XP</div>
      )}

      {/* Pet companion — peeks from bottom-right, pops up on answer */}
      <div style={{
        position: 'fixed', bottom: 72, right: 12, zIndex: 25, pointerEvents: 'none',
        transform: (petState === 'idle' || petState === 'thinking') ? 'translateY(62px)' : 'translateY(0)',
        transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <PetCompanion petType={petType} state={petState} size={84} level={level} />
      </div>

      {/* ─── Top bar — segmented progress + score chips ─── */}
      <div style={{ padding: '54px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button
            onClick={() => router.push(backHref ?? `/module/${moduleId}`)}
            aria-label="Quitter"
            style={{
              width: 36, height: 36, borderRadius: 12, background: A.surface,
              border: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, cursor: 'pointer', boxShadow: '0 1px 0 rgba(15,27,45,0.02)',
            }}>
            <Icon name="x" size={14} color={A.text} strokeWidth={2.2} />
          </button>

          {/* Segmented progress — one segment per original question */}
          <div style={{ flex: 1, display: 'flex', gap: 3 }}>
            {Array.from({ length: originalTotal }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 3,
                background: i < completedSegments ? A.green : '#E4E8EE',
                transition: 'background .3s ease',
              }} />
            ))}
          </div>

          <div style={{
            fontSize: 13, fontWeight: 700, color: A.text,
            fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right',
          }}>
            {completed}<span style={{ color: A.textDim, fontWeight: 500 }}>/{originalTotal}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 9px', borderRadius: 999, background: A.primarySoft,
            border: `1px solid ${A.primarySoft}`,
            fontSize: 10.5, fontWeight: 700, color: A.primary,
            letterSpacing: 0.6, textTransform: 'uppercase',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 3, background: A.primary }} />
            {typeLabel[qtype]}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ScoreChip kind="ok" count={completed} />
            <ScoreChip kind="bad" count={wrongAttemptIds.size} />
            {mode === 'smart' && toReviewCount > 0 && (
              <div style={{
                fontSize: 11, fontWeight: 700, color: A.amber, padding: '3px 8px',
                borderRadius: 999, background: A.amberSoft,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <Icon name="refresh" size={10} color={A.amber} strokeWidth={2.5} />
                {toReviewCount}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Question card ─── */}
      <div style={{ padding: '4px 16px 16px', flex: 1 }} key={q.id}>
        <div style={{
          background: A.surface, borderRadius: 22,
          border: `1px solid ${A.border}`,
          boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 8px 24px -16px rgba(15,27,45,0.18)',
          padding: '20px 20px 22px',
          animation: 'q-fade-in .35s ease both',
        }}>
          {wasTricky && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, color: A.amber, background: A.amberSoft,
              borderRadius: 8, padding: '4px 9px', marginBottom: 10,
              border: `1px solid ${A.amber}25`,
            }}>
              <Icon name="refresh" size={11} color={A.amber} strokeWidth={2.5} />
              Question difficile — déjà ratée
            </div>
          )}

          <div style={{
            fontSize: 10.5, fontWeight: 700, color: A.textMuted,
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
          }}>
            {wrongAttemptIds.has(q.id) ? '↩ À corriger · ' : ''}{headerLabel ?? moduleId}
          </div>

          {q.page_image_url && (
            <div style={{
              marginBottom: 14, borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${A.border}`, background: '#fff',
            }}>
              <img src={q.page_image_url} alt="Schéma" style={{
                width: '100%', display: 'block', maxHeight: 240, objectFit: 'contain',
              }} />
            </div>
          )}

          <div style={{
            fontSize: 21, fontWeight: 700, color: A.text,
            letterSpacing: -0.4, lineHeight: 1.3, marginBottom: 20,
          }}>{q.question}</div>

          {/* Type-specific renderer */}
          {qtype === 'QCM' && (
            <QCMRenderer
              q={q}
              picked={picked}
              showResult={showResult}
              onPick={(i) => !showResult && setPicked(i)}
            />
          )}

          {qtype === 'VF' && (
            <VFRenderer
              q={q}
              picked={picked}
              showResult={showResult}
              onPick={(i) => !showResult && setPicked(i)}
            />
          )}

          {qtype === 'ORDRE' && (
            <OrdreRenderer
              q={q}
              orderState={orderState}
              setOrderState={setOrderState}
              showResult={showResult}
              picked={picked}
              setPicked={setPicked}
            />
          )}

          {qtype === 'ASSOCIATION' && (
            <AssociationRenderer
              q={q}
              pairs={pairs}
              setPairs={setPairs}
              pendingLeft={pendingLeft}
              pendingRight={pendingRight}
              setPendingLeft={setPendingLeft}
              setPendingRight={setPendingRight}
              showResult={showResult}
              picked={picked}
              setPicked={setPicked}
            />
          )}

          {showResult && (
            <ResultExplain
              correct={picked === q.correct_index}
              text={q.explanation}
            />
          )}
        </div>
      </div>

      {/* ─── Bottom CTA ─── */}
      <div style={{
        padding: '12px 20px 36px',
        background: 'linear-gradient(180deg, rgba(244,246,248,0) 0%, rgba(244,246,248,1) 30%)',
      }}>
        {showResult ? (
          <button onClick={next} style={{
            width: '100%', height: 56, borderRadius: 16, border: 'none',
            background: picked === q?.correct_index ? A.primary : A.red,
            color: '#fff', fontSize: 16, fontWeight: 700,
            letterSpacing: -0.1, fontFamily: FONT, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: picked === q?.correct_index
              ? '0 10px 24px -6px rgba(10,102,224,0.55), 0 2px 6px rgba(10,102,224,0.18), inset 0 1px 0 rgba(255,255,255,0.18)'
              : '0 10px 24px -6px rgba(220,38,38,0.55), 0 2px 6px rgba(220,38,38,0.18), inset 0 1px 0 rgba(255,255,255,0.18)',
            transition: 'transform .12s ease, box-shadow .12s ease',
          }}>
            {picked === q?.correct_index ? 'Continuer' : 'Ça reviendra !'}
            <Icon name="arrowR" size={16} color="#fff" strokeWidth={2.4} />
          </button>
        ) : (
          <button onClick={submit} disabled={picked === null} style={{
            width: '100%', height: 56, borderRadius: 16, border: 'none',
            background: picked === null ? A.surface : A.primary,
            color: picked === null ? A.textDim : '#fff',
            fontSize: 16, fontWeight: 700, letterSpacing: -0.1, fontFamily: FONT,
            cursor: picked === null ? 'default' : 'pointer',
            boxShadow: picked === null
              ? `inset 0 0 0 1px ${A.border}`
              : '0 10px 24px -6px rgba(10,102,224,0.55), 0 2px 6px rgba(10,102,224,0.18), inset 0 1px 0 rgba(255,255,255,0.18)',
            transition: 'transform .12s ease, box-shadow .12s ease, background .15s ease',
          }}>
            Valider
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Score chip in top bar
// ─────────────────────────────────────────────────────────────────────────────

function ScoreChip({ kind, count }: { kind: 'ok' | 'bad'; count: number }) {
  const col = kind === 'ok' ? A.green : A.red
  const bg = kind === 'ok' ? A.greenSoft : '#FCE8E8'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 999, background: bg,
      fontSize: 11, fontWeight: 700, color: col, fontVariantNumeric: 'tabular-nums',
    }}>
      <Icon name={kind === 'ok' ? 'check' : 'x'} size={10} color={col} strokeWidth={3} />
      {count}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Explanation block (post-result)
// ─────────────────────────────────────────────────────────────────────────────

function ResultExplain({ correct, text }: { correct: boolean; text: string }) {
  const col = correct ? A.green : A.red
  const bg = correct ? A.greenSoft : '#FCE8E8'
  const title = correct ? 'Bonne réponse' : 'Pas tout à fait'
  return (
    <div style={{
      marginTop: 18, padding: '14px 16px', borderRadius: 16, background: bg,
      border: `1px solid ${col}30`,
      animation: 'q-fade-in .3s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 11, background: col,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={correct ? 'check' : 'x'} size={12} color="#fff" strokeWidth={3.5} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: col }}>{title}</div>
      </div>
      <div style={{ fontSize: 13.5, color: A.text, lineHeight: 1.5, opacity: 0.92 }}>{text}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QCM — Multiple choice
// ─────────────────────────────────────────────────────────────────────────────

function QCMRenderer({ q, picked, showResult, onPick }: {
  q: Question
  picked: number | null
  showResult: boolean
  onPick: (i: number) => void
}) {
  const raw = q.choices
  const choices: string[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {choices.map((c, i) => {
        const sel = picked === i
        const isCorrect = showResult && i === q.correct_index
        const isWrong = showResult && sel && i !== q.correct_index
        const isDim = showResult && !isCorrect && !isWrong

        let bg: string = A.surface
        let border: string = A.border
        let textCol: string = A.text
        let circleBg: string = '#F1F6FE'
        let circleText: string = A.primary
        let shadow = '0 1px 0 rgba(15,27,45,0.02)'
        let rightIcon: React.ReactNode = null

        if (isCorrect) {
          border = A.green; bg = A.greenSoft
          circleBg = A.green; circleText = '#fff'
          shadow = '0 0 0 3px rgba(22,163,74,0.10), 0 6px 18px -8px rgba(22,163,74,0.35)'
          rightIcon = <Icon name="check" size={18} color={A.green} strokeWidth={2.8} />
        } else if (isWrong) {
          border = A.red; bg = '#FCE8E8'
          circleBg = A.red; circleText = '#fff'
          shadow = '0 0 0 3px rgba(220,38,38,0.10), 0 6px 18px -8px rgba(220,38,38,0.35)'
          rightIcon = <Icon name="x" size={18} color={A.red} strokeWidth={2.8} />
        } else if (isDim) {
          textCol = A.textDim; circleBg = '#F0F2F5'; circleText = A.textDim
        } else if (sel) {
          border = A.primary; bg = '#F1F6FE'
          circleBg = A.primary; circleText = '#fff'
          shadow = '0 0 0 3px rgba(10,102,224,0.12), 0 6px 18px -8px rgba(10,102,224,0.35)'
        }

        const letter = String.fromCharCode(65 + i) // A, B, C, D…

        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            disabled={showResult}
            style={{
              width: '100%', textAlign: 'left', fontFamily: FONT,
              cursor: showResult ? 'default' : 'pointer',
              background: bg, border: `1.5px solid ${border}`, borderRadius: 16,
              padding: 14, display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: shadow, transition: 'all .15s ease',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: circleBg, color: circleText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, flexShrink: 0, letterSpacing: -0.3,
              transition: 'all .15s ease',
            }}>{letter}</div>
            <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: textCol, lineHeight: 1.35 }}>{c}</div>
            {rightIcon}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VF — True / False
// ─────────────────────────────────────────────────────────────────────────────

function VFRenderer({ q, picked, showResult, onPick }: {
  q: Question
  picked: number | null
  showResult: boolean
  onPick: (i: number) => void
}) {
  const rawVf = q.choices
  const labels: string[] = Array.isArray(rawVf) ? rawVf : typeof rawVf === 'string' ? JSON.parse(rawVf) : ['Vrai', 'Faux']
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
      {labels.map((label, i) => {
        const isTrue = i === 0
        const sel = picked === i
        const isCorrect = showResult && i === q.correct_index
        const isWrong = showResult && sel && i !== q.correct_index
        const isDim = showResult && !isCorrect && !isWrong

        const baseColor = isTrue ? A.green : A.red
        const baseSoft = isTrue ? A.greenSoft : '#FCE8E8'

        let bg: string = A.surface
        let border: string = A.border
        let labelCol: string = A.text
        let iconBg: string = '#F0F2F5'
        let iconStroke: string = A.textMuted
        let shadow: string = '0 1px 0 rgba(15,27,45,0.02), 0 4px 14px -8px rgba(15,27,45,0.10)'

        if (isCorrect) {
          border = A.green; bg = A.greenSoft
          iconBg = A.green; iconStroke = '#fff'; labelCol = A.green
          shadow = `0 0 0 3px ${A.green}1f, 0 12px 32px -10px ${A.green}66`
        } else if (isWrong) {
          border = A.red; bg = '#FCE8E8'
          iconBg = A.red; iconStroke = '#fff'; labelCol = A.red
          shadow = `0 0 0 3px ${A.red}1f, 0 12px 32px -10px ${A.red}66`
        } else if (isDim) {
          labelCol = A.textDim; iconBg = '#F0F2F5'; iconStroke = A.textDim
        } else if (sel) {
          border = baseColor; bg = baseSoft
          iconBg = baseColor; iconStroke = '#fff'; labelCol = baseColor
          shadow = `0 0 0 3px ${baseColor}1f, 0 12px 32px -10px ${baseColor}66`
        }

        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            disabled={showResult}
            style={{
              flex: 1, height: 168, borderRadius: 20, background: bg,
              border: `1.5px solid ${border}`,
              cursor: showResult ? 'default' : 'pointer', fontFamily: FONT,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 14, padding: 16, boxShadow: shadow, transition: 'all .18s ease',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 28, background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .18s ease',
            }}>
              <Icon name={isTrue ? 'check' : 'x'} size={28} color={iconStroke} strokeWidth={3} />
            </div>
            <div style={{
              fontSize: 17, fontWeight: 800, color: labelCol,
              letterSpacing: 1.4, textTransform: 'uppercase',
            }}>{label}</div>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDRE — Drag to reorder
// ─────────────────────────────────────────────────────────────────────────────

function OrdreRenderer({ q, orderState, setOrderState, showResult, picked, setPicked }: {
  q: Question
  orderState: number[]
  setOrderState: (v: number[]) => void
  showResult: boolean
  picked: number | null
  setPicked: (n: number | null) => void
}) {
  const raw = q.choices
  const items: string[] = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  const initialOrder = useMemo(() => {
    const idxs = items.map((_, i) => i)
    return shuffle(idxs, q.id)
  }, [q.id, items.length])

  const currentOrder = orderState.length === items.length ? orderState : initialOrder

  useEffect(() => {
    if (showResult) return
    const isCorrect = currentOrder.every((v, i) => v === i)
    setPicked(isCorrect ? q.correct_index : (q.correct_index === 0 ? 1 : 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder.join(','), showResult])

  function move(from: number, to: number) {
    if (from === to) return
    const next = currentOrder.slice()
    const [v] = next.splice(from, 1)
    next.splice(to, 0, v)
    setOrderState(next)
  }

  return (
    <>
      {/* Direction hint banner */}
      {!showResult && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', marginBottom: 12,
          background: A.primarySoft, borderRadius: 12,
          border: `1px solid ${A.primary}25`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, background: A.primary, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
            }}>1</div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: A.primary, letterSpacing: 0.3 }}>
              PREMIER en haut ↑
            </span>
          </div>
          <span style={{ fontSize: 11, color: A.textMuted, fontWeight: 600 }}>
            Dernier en bas ↓
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {currentOrder.map((origIdx, pos) => {
          let border: string = A.border
          let bg: string = A.surface
          let rankBg: string = A.primary
          let rankText: string = '#fff'
          let shadow: string = '0 1px 0 rgba(15,27,45,0.02), 0 2px 6px -4px rgba(15,27,45,0.06)'

          if (showResult) {
            const isCorrectPos = origIdx === pos
            if (isCorrectPos) {
              border = A.green; bg = A.greenSoft; rankBg = A.green; rankText = '#fff'
              shadow = `0 0 0 3px ${A.green}1a, 0 6px 18px -10px ${A.green}55`
            } else {
              border = A.red; bg = '#FCE8E8'; rankBg = A.red; rankText = '#fff'
              shadow = `0 0 0 3px ${A.red}1a, 0 6px 18px -10px ${A.red}55`
            }
          }

          return (
            <div
              key={origIdx}
              style={{
                width: '100%', background: bg, border: `2px solid ${border}`, borderRadius: 14,
                padding: '12px 10px 12px 12px', display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: shadow, fontFamily: FONT,
                transition: 'all .22s cubic-bezier(0.2,0.7,0.2,1)',
                userSelect: 'none',
              }}
            >
              {/* Position badge with explicit ordinal */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: rankBg, color: rankText,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}>
                <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{pos + 1}</div>
                <div style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 0.4, marginTop: 1, opacity: 0.85 }}>
                  {pos === 0 ? '1ER' : `${pos + 1}E`}
                </div>
              </div>

              <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: A.text, lineHeight: 1.3 }}>
                {items[origIdx]}
              </div>

              {!showResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    onClick={() => move(pos, Math.max(0, pos - 1))}
                    disabled={pos === 0}
                    aria-label="Monter"
                    style={{
                      width: 40, height: 32, borderRadius: 9, border: `1.5px solid ${A.border}`,
                      background: pos === 0 ? '#F4F6F8' : A.surface,
                      cursor: pos === 0 ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                      opacity: pos === 0 ? 0.4 : 1,
                      boxShadow: pos === 0 ? 'none' : '0 1px 0 rgba(15,27,45,0.04)',
                    }}>
                    <Icon name="chevronU" size={16} color={A.text} strokeWidth={2.8} />
                  </button>
                  <button
                    onClick={() => move(pos, Math.min(items.length - 1, pos + 1))}
                    disabled={pos === items.length - 1}
                    aria-label="Descendre"
                    style={{
                      width: 40, height: 32, borderRadius: 9, border: `1.5px solid ${A.border}`,
                      background: pos === items.length - 1 ? '#F4F6F8' : A.surface,
                      cursor: pos === items.length - 1 ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                      opacity: pos === items.length - 1 ? 0.4 : 1,
                      boxShadow: pos === items.length - 1 ? 'none' : '0 1px 0 rgba(15,27,45,0.04)',
                    }}>
                    <Icon name="chevronD" size={16} color={A.text} strokeWidth={2.8} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSOCIATION — Duolingo-style tap pairs
// ─────────────────────────────────────────────────────────────────────────────

function AssociationRenderer({ q, pairs, setPairs, pendingLeft, pendingRight, setPendingLeft, setPendingRight, showResult, picked, setPicked }: {
  q: Question
  pairs: Array<{ l: number; r: number }>
  setPairs: (v: Array<{ l: number; r: number }>) => void
  pendingLeft: number | null
  pendingRight: number | null
  setPendingLeft: (n: number | null) => void
  setPendingRight: (n: number | null) => void
  showResult: boolean
  picked: number | null
  setPicked: (n: number | null) => void
}) {
  // Defensive parsing — choices may be: object {left,right,correctMap}, JSON string,
  // double-stringified, or contain snake_case 'correct_map'. Handle all shapes.
  let parsed: unknown = q.choices
  if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch {} }
  if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed) } catch {} }
  const obj = (parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {})
  const left: string[] = Array.isArray(obj.left) ? (obj.left as string[]) : []
  const right: string[] = Array.isArray(obj.right) ? (obj.right as string[]) : []
  const correctMap: number[] = Array.isArray(obj.correctMap)
    ? (obj.correctMap as number[])
    : Array.isArray(obj.correct_map)
    ? (obj.correct_map as number[])
    : []

  // Stable shuffled right-column order per question id (so it's not pre-aligned).
  const rightOrder = useMemo(() => {
    const idxs = right.map((_, i) => i)
    return shuffle(idxs, q.id + '|right')
  }, [q.id, right.length])

  const leftPairedTo: Record<number, number | undefined> = {}
  const rightPairedFrom: Record<number, number | undefined> = {}
  pairs.forEach((p, i) => { leftPairedTo[p.l] = i; rightPairedFrom[p.r] = i })

  // Recompute picked whenever pairs actually change (not just their count).
  const pairsKey = pairs.map(p => `${p.l}:${p.r}`).join(',')
  useEffect(() => {
    if (showResult) return
    if (pairs.length !== left.length) { setPicked(null); return }
    const allCorrect = pairs.every(p => correctMap[p.l] === p.r)
    setPicked(allCorrect ? q.correct_index : (q.correct_index === 0 ? 1 : 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairsKey, showResult])

  function attempt(li: number | null, ri: number | null) {
    if (li !== null && ri !== null) {
      // If either is already paired, unpair it first.
      const filtered = pairs.filter(p => p.l !== li && p.r !== ri)
      setPairs([...filtered, { l: li, r: ri }])
      setPendingLeft(null)
      setPendingRight(null)
    }
  }

  function tapLeft(i: number) {
    if (showResult) return
    // If already paired, unpair on tap.
    if (leftPairedTo[i] !== undefined) {
      setPairs(pairs.filter(p => p.l !== i))
      return
    }
    if (pendingRight !== null) {
      attempt(i, pendingRight)
    } else {
      setPendingLeft(pendingLeft === i ? null : i)
    }
  }

  function tapRight(i: number) {
    if (showResult) return
    if (rightPairedFrom[i] !== undefined) {
      setPairs(pairs.filter(p => p.r !== i))
      return
    }
    if (pendingLeft !== null) {
      attempt(pendingLeft, i)
    } else {
      setPendingRight(pendingRight === i ? null : i)
    }
  }

  // If data isn't well-formed (no left or no right), show a visible diagnostic
  // instead of a blank renderer.
  if (left.length === 0 || right.length === 0) {
    return (
      <div style={{
        padding: 16, background: '#FCE8E8', borderRadius: 12,
        border: `1px solid ${A.red}30`, fontFamily: FONT,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: A.red, marginBottom: 6 }}>
          Question d&apos;association mal formatée
        </div>
        <div style={{ fontSize: 12, color: A.text, opacity: 0.8, marginBottom: 8 }}>
          Les données <code>choices</code> n&apos;ont pas la forme attendue {`{left, right, correctMap}`}. Saute cette question.
        </div>
        <button
          onClick={() => setPicked(q.correct_index === 0 ? 1 : 0)}
          style={{
            fontSize: 12, fontWeight: 600, color: '#fff', background: A.red,
            border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            fontFamily: FONT,
          }}>
          Marquer comme erreur et continuer
        </button>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {left.map((text, i) => {
            const pairIdx = leftPairedTo[i]
            const isPaired = pairIdx !== undefined
            const isSelected = pendingLeft === i
            let state: 'idle' | 'selected' | 'paired' | 'correct' | 'wrong' = 'idle'
            let color: string | undefined
            if (showResult) {
              if (isPaired) {
                const p = pairs[pairIdx!]
                state = correctMap[p.l] === p.r ? 'correct' : 'wrong'
              } else state = 'wrong'
            } else if (isSelected) state = 'selected'
            else if (isPaired) { state = 'paired'; color = PAIR_COLORS[pairIdx! % PAIR_COLORS.length] }

            return (
              <AssocChip
                key={`l-${i}`}
                side="left"
                text={text}
                state={state}
                color={color}
                onClick={() => tapLeft(i)}
              />
            )
          })}
        </div>
        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rightOrder.map((origI) => {
            const i = origI
            const pairIdx = rightPairedFrom[i]
            const isPaired = pairIdx !== undefined
            const isSelected = pendingRight === i
            let state: 'idle' | 'selected' | 'paired' | 'correct' | 'wrong' = 'idle'
            let color: string | undefined
            if (showResult) {
              if (isPaired) {
                const p = pairs[pairIdx!]
                state = correctMap[p.l] === p.r ? 'correct' : 'wrong'
              } else state = 'wrong'
            } else if (isSelected) state = 'selected'
            else if (isPaired) { state = 'paired'; color = PAIR_COLORS[pairIdx! % PAIR_COLORS.length] }

            return (
              <AssocChip
                key={`r-${i}`}
                side="right"
                text={right[i]}
                state={state}
                color={color}
                onClick={() => tapRight(i)}
              />
            )
          })}
        </div>
      </div>
      {!showResult && (
        <div style={{
          marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 11.5, color: A.textMuted, fontWeight: 600,
        }}>
          <Icon name="sparkle" size={12} color={A.textMuted} strokeWidth={2} />
          Touche une carte de gauche, puis sa paire à droite
        </div>
      )}
    </>
  )
}

function AssocChip({ side, text, state, color, onClick }: {
  side: 'left' | 'right'
  text: string
  state: 'idle' | 'selected' | 'paired' | 'correct' | 'wrong'
  color?: string
  onClick: () => void
}) {
  let bg: string = A.surface
  let border: string = A.border
  let textCol: string = A.text
  let shadow: string = '0 1px 0 rgba(15,27,45,0.02), 0 4px 10px -8px rgba(15,27,45,0.10)'
  let dot: React.ReactNode = null

  if (state === 'selected') {
    border = A.primary; bg = '#F1F6FE'; textCol = A.primary
    shadow = '0 0 0 3px rgba(10,102,224,0.14), 0 10px 22px -10px rgba(10,102,224,0.45)'
  } else if (state === 'paired') {
    border = color || A.primary; bg = A.surface; textCol = A.text
    shadow = `inset 0 0 0 1px ${color || A.primary}, 0 4px 10px -8px rgba(15,27,45,0.08)`
    dot = (
      <div style={{
        width: 18, height: 18, borderRadius: 9, background: color || A.primary,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, flexShrink: 0,
      }}>
        <Icon name="check" size={11} color="#fff" strokeWidth={3} />
      </div>
    )
  } else if (state === 'correct') {
    border = A.green; bg = A.greenSoft; textCol = A.green
    shadow = `0 0 0 3px ${A.green}1a, 0 6px 18px -10px ${A.green}55`
  } else if (state === 'wrong') {
    border = A.red; bg = '#FCE8E8'; textCol = A.red
    shadow = `0 0 0 3px ${A.red}1a, 0 6px 18px -10px ${A.red}55`
  }

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', minHeight: 52, borderRadius: 14, background: bg,
        border: `1.5px solid ${border}`, padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT,
        cursor: 'pointer', boxShadow: shadow, transition: 'all .15s ease',
        justifyContent: 'space-between',
      }}
    >
      {side === 'left' && dot}
      <div style={{
        flex: 1, fontSize: 14, fontWeight: 700, color: textCol, lineHeight: 1.3,
        textAlign: side === 'left' ? 'left' : 'right',
      }}>{text}</div>
      {side === 'right' && dot}
    </button>
  )
}
