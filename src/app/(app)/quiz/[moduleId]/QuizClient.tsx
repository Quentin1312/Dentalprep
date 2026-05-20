'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recordSession } from '@/lib/recordSession'
import { useAppData } from '@/lib/app-context'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'
import PetCompanion from '@/components/pet/PetCompanion'
import type { PetType, PetState } from '@/components/pet/PetCompanion'
import QuizSummary from './QuizSummary'

type Question = { id: string; question: string; choices: unknown; correct_index: number; explanation: string; module_id: string; page_image_url?: string | null }

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
  const { refresh } = useAppData()
  const startRef = useRef(Date.now())
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [scoreOk, setScoreOk] = useState(0)
  const [scoreBad, setScoreBad] = useState(0)
  const [finished, setFinished] = useState(false)
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([])
  const [xpAnim, setXpAnim] = useState(0)

  const q = questions[idx]
  const choices = q?.choices as string[]
  const total = questions.length

  const petState: PetState = showResult
    ? (picked === q?.correct_index ? 'correct' : 'wrong')
    : picked !== null ? 'thinking' : 'idle'

  // Badge: question déjà ratée dans le passé
  const stat = attemptStats.get(q?.id ?? '')
  const wasTricky = stat && stat.total > 0 && stat.ok / stat.total < 0.6

  async function submit() {
    if (picked === null) return
    setShowResult(true)
    const isCorrect = picked === q.correct_index
    if (isCorrect) { setScoreOk(s => s + 1); setXpAnim(n => n + 1) }
    else { setScoreBad(s => s + 1); setWrongQuestions(prev => [...prev, q]) }
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
    if (idx + 1 >= total) {
      setFinished(true)
      const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
      await recordSession(userId, elapsed)
      return
    }
    setIdx(i => i + 1)
    setPicked(null)
    setShowResult(false)
  }

  function restart(questionsOverride?: Question[]) {
    const qs = questionsOverride ?? questions
    // if we restart with wrong questions, we need to re-mount with them — use router for simplicity
    if (questionsOverride) {
      // Store in sessionStorage and reload
      sessionStorage.setItem('quiz_retry', JSON.stringify(qs))
      window.location.reload()
    } else {
      setIdx(0); setPicked(null); setShowResult(false)
      setScoreOk(0); setScoreBad(0); setFinished(false)
      setWrongQuestions([]); startRef.current = Date.now()
    }
  }

  if (finished) return (
    <QuizSummary
      scoreOk={scoreOk}
      scoreBad={scoreBad}
      total={total}
      moduleId={moduleId}
      wrongQuestions={wrongQuestions}
      onRestart={() => restart()}
      onRestartWrong={(qs) => restart(qs)}
      backHref={backHref}
    />
  )

  const toReviewCount = mode === 'smart' ? questions.filter(q => {
    const s = attemptStats.get(q.id)
    return s && s.total > 0 && s.ok / s.total < 0.5
  }).length : 0

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes xp-float{0%{opacity:1;transform:translateY(0) scale(1)}30%{opacity:1;transform:translateY(-18px) scale(1.25)}100%{opacity:0;transform:translateY(-64px) scale(0.8)}}`}</style>
      {/* +XP float */}
      {xpAnim > 0 && (
        <div key={xpAnim} style={{
          position: 'fixed', bottom: 148, right: 28, zIndex: 30, pointerEvents: 'none',
          fontSize: 20, fontWeight: 900, color: '#FFD84A',
          textShadow: '0 0 14px rgba(255,216,74,0.7), 0 2px 4px rgba(0,0,0,0.4)',
          animation: 'xp-float 1.1s ease-out forwards',
          fontFamily: A.font,
        }}>+10 XP</div>
      )}
      {/* Pet companion — peeks from bottom-right, pops up on answer */}
      <div style={{
        position: 'fixed', bottom: 56, right: 12, zIndex: 25, pointerEvents: 'none',
        transform: (petState === 'idle' || petState === 'thinking') ? 'translateY(62px)' : 'translateY(0)',
        transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <PetCompanion petType={petType} state={petState} size={84} level={level} />
      </div>
      {/* Top bar */}
      <div style={{ padding: '60px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={() => router.push(backHref ?? `/module/${moduleId}`)} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="x" size={16} color={A.text} />
          </button>
          <div style={{ flex: 1, height: 5, background: '#E9ECF2', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${((idx + (showResult ? 1 : 0)) / total) * 100}%`, height: '100%', background: A.primary, borderRadius: 5, transition: 'width .4s' }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted }}>{idx + 1}<span style={{ color: A.textDim }}>/{total}</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: A.textMuted }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: A.green }} />{scoreOk} ✓
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: A.red }} />{scoreBad} ✗
            </span>
          </div>
          {mode === 'smart' && toReviewCount > 0 && (
            <div style={{ fontSize: 11, fontWeight: 600, color: A.amber, padding: '3px 8px', borderRadius: 6, background: A.amberSoft }}>
              🔁 {toReviewCount} à revoir
            </div>
          )}
        </div>
      </div>

      {/* Question */}
      <div style={{ padding: '8px 20px 24px', flex: 1 }}>
        {wasTricky && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: A.amber, background: A.amberSoft, borderRadius: 6, padding: '3px 8px', marginBottom: 10 }}>
            <Icon name="refresh" size={11} color={A.amber} /> Question difficile — déjà ratée
          </div>
        )}
        <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
          Question {idx + 1} · {headerLabel ?? moduleId}
        </div>
        {q.page_image_url && (
          <div style={{ marginBottom: 14, borderRadius: 12, overflow: 'hidden', border: `0.5px solid ${A.border}` }}>
            <img src={q.page_image_url} alt="Schéma" style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'contain', background: '#fff' }} />
          </div>
        )}
        <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.3, marginBottom: 24 }}>{q.question}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {choices.map((c, i) => {
            const sel = picked === i
            const isCorrect = showResult && i === q.correct_index
            const isWrong = showResult && sel && i !== q.correct_index
            let bg: string = A.surface, border: string = A.border, color: string = A.text
            if (isCorrect) { bg = A.greenSoft; border = A.green }
            else if (isWrong) { bg = '#FEEBEB'; border = A.red }
            else if (sel) { bg = A.primarySoft; border = A.primary }
            return (
              <button key={i} onClick={() => !showResult && setPicked(i)} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: showResult ? 'default' : 'pointer', textAlign: 'left', fontFamily: A.font, transition: 'all .15s', width: '100%' }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, border: `1.5px solid ${sel || isCorrect ? border : '#C8CFD9'}`, background: (sel || isCorrect) ? border : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(sel || isCorrect) && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color }}>{c}</div>
                {isCorrect && <Icon name="check" size={16} color={A.green} strokeWidth={2.5} />}
                {isWrong && <Icon name="x" size={16} color={A.red} strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>

        {showResult && (
          <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: picked === q.correct_index ? A.greenSoft : '#FEEBEB', border: `0.5px solid ${picked === q.correct_index ? A.green + '40' : A.red + '40'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon name={picked === q.correct_index ? 'check' : 'x'} size={16} color={picked === q.correct_index ? A.green : A.red} strokeWidth={2.5} />
              <div style={{ fontSize: 14, fontWeight: 700, color: picked === q.correct_index ? A.green : A.red }}>
                {picked === q.correct_index ? 'Bravo !' : 'Pas tout à fait'}
              </div>
            </div>
            <div style={{ fontSize: 13, color: A.text, lineHeight: 1.45 }}>{q.explanation}</div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '12px 20px 36px' }}>
        {showResult ? (
          <button onClick={next} style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
            {idx + 1 >= total ? 'Voir les résultats' : 'Question suivante'} <Icon name="arrowR" size={16} color="#fff" />
          </button>
        ) : (
          <button onClick={submit} disabled={picked === null} style={{ width: '100%', height: 52, borderRadius: 14, border: `0.5px solid ${A.borderStrong}`, background: picked === null ? A.surface : A.primary, color: picked === null ? A.text : '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: picked === null ? 'default' : 'pointer', opacity: picked === null ? 0.45 : 1, boxShadow: picked !== null ? '0 4px 14px rgba(10,102,224,0.28)' : 'none' }}>
            Valider
          </button>
        )}
      </div>
    </div>
  )
}
