'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Question = {
  id: string
  question: string
  choices: unknown
  correct_index: number
  module_id: string
  type?: string
}

type SessionRow = {
  id: string
  started_at: string
  duration_seconds: number
  total_questions: number
  question_ids: string[]
  answers: Record<string, number>
  is_completed: boolean
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MockExamRunPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [userId, setUserId] = useState<string | null>(null)
  const [session, setSession] = useState<SessionRow | null>(null)
  const [questions, setQuestions] = useState<Map<string, Question>>(new Map())
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [secondsLeft, setSecondsLeft] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [confirmFinish, setConfirmFinish] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const submitInFlight = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    const supaAny = supabase as any
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      supaAny.from('mock_exam_sessions').select('*').eq('id', id).eq('user_id', user.id).single()
        .then(async ({ data: sess }: any) => {
          if (!sess) { router.replace('/mock-exam'); return }
          if (sess.is_completed) { router.replace(`/mock-exam/result/${id}`); return }

          const startedAt = new Date(sess.started_at).getTime()
          const elapsed = Math.floor((Date.now() - startedAt) / 1000)
          const remaining = Math.max(0, sess.duration_seconds - elapsed)

          const qIds: string[] = sess.question_ids
          const ans: Record<string, number> = sess.answers ?? {}
          // On reprend où l'élève s'était arrêté : 1ère question non répondue
          const startIdx = qIds.findIndex(qid => !(qid in ans))
          const safeIdx = startIdx === -1 ? qIds.length - 1 : startIdx

          // Charge les questions
          const { data: qs } = await supabase
            .from('quiz_questions')
            .select('id,question,choices,correct_index,module_id')
            .in('id', qIds)

          const qMap = new Map<string, Question>()
          for (const q of (qs ?? []) as unknown as Question[]) {
            qMap.set(q.id, {
              ...q,
              choices: typeof q.choices === 'string' ? JSON.parse(q.choices as unknown as string) : q.choices,
            })
          }

          setSession({ ...sess, question_ids: qIds, answers: ans })
          setQuestions(qMap)
          setIdx(safeIdx)
          setAnswers(ans)
          setSecondsLeft(remaining)
          setLoading(false)

          if (remaining <= 0) {
            void finishSession(ans, sess)
          }
        })
    })
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router])

  // Chrono
  useEffect(() => {
    if (loading || !session) return
    tickRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (tickRef.current) clearInterval(tickRef.current)
          void finishSession(answers, session)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, answers])

  async function saveAnswer(qid: string, value: number) {
    const supabase = createClient()
    const supaAny = supabase as any
    const newAnswers = { ...answers, [qid]: value }
    setAnswers(newAnswers)
    // Persist en best-effort
    void supaAny.from('mock_exam_sessions')
      .update({ answers: newAnswers })
      .eq('id', id)
  }

  async function finishSession(finalAnswers: Record<string, number>, sess: SessionRow) {
    if (submitInFlight.current) return
    submitInFlight.current = true
    setFinishing(true)
    const supabase = createClient()
    const supaAny = supabase as any

    // Calcule score
    let correct = 0
    for (const qid of sess.question_ids) {
      const q = questions.get(qid)
      if (!q) continue
      if (finalAnswers[qid] === q.correct_index) correct++
    }

    await supaAny.from('mock_exam_sessions').update({
      answers: finalAnswers,
      score_correct: correct,
      is_completed: true,
      completed_at: new Date().toISOString(),
    }).eq('id', id)

    router.replace(`/mock-exam/result/${id}`)
  }

  function handleNext() {
    if (!session) return
    if (picked === null) return
    const qid = session.question_ids[idx]
    void saveAnswer(qid, picked)
    setPicked(null)
    if (idx + 1 < session.question_ids.length) {
      setIdx(idx + 1)
    } else {
      // Dernière question — on termine
      void finishSession({ ...answers, [qid]: picked }, session)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${A.primary}`, borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!session) return null

  const qId = session.question_ids[idx]
  const q = questions.get(qId)
  if (!q) {
    return <div style={{ padding: 40, color: A.text }}>Question introuvable.</div>
  }

  const choices = (q.choices as string[]) ?? []
  const total = session.question_ids.length
  const answered = Object.keys(answers).length
  const lowTime = secondsLeft < 300        // < 5 min

  return (
    <div style={{
      minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font,
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes pulse-time { 0%,100%{opacity:1} 50%{opacity:0.6} }
        button:active:not(:disabled){transform:scale(.985)}
      `}</style>

      {/* Top bar : chrono + progression */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#fff', borderBottom: `1px solid ${A.border}`,
        padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 999,
            background: lowTime ? '#FCE8E8' : '#E6EFFC',
            border: `1px solid ${lowTime ? '#DC2626' : '#0A66E0'}`,
            animation: lowTime ? 'pulse-time 1s ease-in-out infinite' : undefined,
          }}>
            <span style={{ fontSize: 16 }}>⏱</span>
            <span style={{
              fontSize: 16, fontWeight: 900, color: lowTime ? '#DC2626' : '#0A66E0',
              fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5,
            }}>{fmtTime(secondsLeft)}</span>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: A.text, fontVariantNumeric: 'tabular-nums' }}>
            {idx + 1}<span style={{ color: A.textDim, fontWeight: 500 }}>/{total}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{
          marginTop: 10, height: 4, background: '#EEF1F5',
          borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            width: `${((idx + 1) / total) * 100}%`, height: '100%',
            background: A.primary, transition: 'width .3s ease',
          }} />
        </div>
      </div>

      {/* Question */}
      <div style={{ padding: '20px 16px', flex: 1 }}>
        <div style={{
          background: A.surface, borderRadius: 18,
          border: `1px solid ${A.border}`,
          padding: '18px 18px 22px',
        }}>
          <div style={{
            fontSize: 10.5, fontWeight: 800, color: A.primary, letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}>
            {q.module_id} · Question {idx + 1}
          </div>
          <div style={{
            fontSize: 16, fontWeight: 700, color: A.text, marginTop: 8,
            lineHeight: 1.45, letterSpacing: -0.1,
          }}>
            {q.question}
          </div>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {choices.map((c, i) => {
              const isPicked = picked === i
              return (
                <button
                  key={i}
                  onClick={() => setPicked(i)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 16px', borderRadius: 14,
                    background: isPicked ? '#E6EFFC' : '#fff',
                    border: isPicked ? `2px solid ${A.primary}` : `1px solid ${A.border}`,
                    fontFamily: A.font, fontSize: 14, fontWeight: 600,
                    color: A.text, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 999,
                    background: isPicked ? A.primary : '#fff',
                    border: isPicked ? 'none' : `1.5px solid ${A.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 11, fontWeight: 900, flexShrink: 0,
                  }}>
                    {isPicked && '✓'}
                  </div>
                  <div style={{ flex: 1 }}>{c}</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '12px 16px 28px', background: 'linear-gradient(180deg, rgba(244,246,248,0) 0%, rgba(244,246,248,1) 30%)' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setConfirmFinish(true)}
            disabled={finishing}
            style={{
              padding: '0 18px', height: 56, borderRadius: 16,
              background: '#fff', color: A.textMuted,
              border: `1px solid ${A.border}`,
              fontSize: 13, fontWeight: 700, fontFamily: A.font,
              cursor: 'pointer', flexShrink: 0,
            }}>
            Terminer
          </button>
          <button
            onClick={handleNext}
            disabled={picked === null || finishing}
            style={{
              flex: 1, height: 56, borderRadius: 16, border: 'none',
              background: picked === null ? '#fff' : A.primary,
              color: picked === null ? A.textDim : '#fff',
              fontSize: 16, fontWeight: 800, fontFamily: A.font,
              cursor: picked === null ? 'default' : 'pointer',
              boxShadow: picked === null
                ? `inset 0 0 0 1px ${A.border}`
                : `0 10px 24px -6px ${A.primary}77`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            {idx + 1 < total ? 'Suivant' : 'Terminer'}
            <Icon name="arrowR" size={16} color={picked === null ? A.textDim : '#fff'} strokeWidth={2.4} />
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: A.textMuted, textAlign: 'center' }}>
          {answered}/{total} répondues · pas de retour en arrière
        </div>
      </div>

      {/* Confirm finish */}
      {confirmFinish && (
        <div
          onClick={() => setConfirmFinish(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 18, padding: 24,
            maxWidth: 360, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: A.text }}>
              Terminer l'épreuve ?
            </div>
            <div style={{ fontSize: 13, color: A.textMuted, marginTop: 6, lineHeight: 1.5 }}>
              Tu as répondu à <b>{answered}</b>/{total} questions.<br />
              Les questions non répondues compteront comme fausses.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setConfirmFinish(false)}
                style={{
                  flex: 1, height: 48, borderRadius: 12, border: `1px solid ${A.border}`,
                  background: '#fff', color: A.text, fontSize: 14, fontWeight: 700, fontFamily: A.font,
                  cursor: 'pointer',
                }}>
                Continuer
              </button>
              <button
                onClick={() => { setConfirmFinish(false); void finishSession(answers, session) }}
                style={{
                  flex: 1, height: 48, borderRadius: 12, border: 'none',
                  background: A.primary, color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: A.font,
                  cursor: 'pointer',
                }}>
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
