'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A, PALETTE, RADIUS, SHADOW, sp, monoStyle, displayStyle, typeStyle } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import { MODULE_MAP } from '@/lib/modules'
import { scoreByModule } from '@/lib/mock-exam'

type Question = {
  id: string
  question: string
  choices: unknown
  correct_index: number
  explanation: string
  module_id: string
}

type Session = {
  id: string
  started_at: string
  completed_at: string | null
  duration_seconds: number
  total_questions: number
  question_ids: string[]
  answers: Record<string, number>
  score_correct: number
  is_completed: boolean
}

const MODULE_ACCENT: Record<string, string> = {
  M1: '#0A66E0', M2: '#0D9488', M3: '#7C3AED',
  M4: '#E11D48', M5: '#D97706', M6: '#5B21B6',
}

export default function MockExamResultPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [session, setSession] = useState<Session | null>(null)
  const [prevSession, setPrevSession] = useState<Session | null>(null)
  const [questions, setQuestions] = useState<Map<string, Question>>(new Map())
  const [loading, setLoading] = useState(true)
  const [showWrongOnly, setShowWrongOnly] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const supaAny = supabase as any
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }

      supaAny.from('mock_exam_sessions').select('*').eq('id', id).eq('user_id', user.id).single()
        .then(async ({ data: sess }: any) => {
          if (!sess) { router.replace('/mock-exam'); return }
          if (!sess.is_completed) { router.replace(`/mock-exam/run/${id}`); return }

          // Récupère la session précédente complétée pour comparaison
          const { data: prev } = await supaAny
            .from('mock_exam_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .lt('completed_at', sess.completed_at)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          // Charge les questions
          const { data: qs } = await supabase
            .from('quiz_questions')
            .select('id,question,choices,correct_index,explanation,module_id')
            .in('id', sess.question_ids)

          const qMap = new Map<string, Question>()
          for (const q of (qs ?? []) as Question[]) {
            qMap.set(q.id, {
              ...q,
              choices: typeof q.choices === 'string' ? JSON.parse(q.choices as unknown as string) : q.choices,
            })
          }

          setSession(sess)
          setPrevSession(prev ?? null)
          setQuestions(qMap)
          setLoading(false)
        })
    })
  }, [id, router])

  if (loading || !session) {
    return (
      <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${A.primary}`, borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const pct = session.total_questions > 0
    ? Math.round((session.score_correct / session.total_questions) * 100)
    : 0
  const prevPct = prevSession && prevSession.total_questions > 0
    ? Math.round((prevSession.score_correct / prevSession.total_questions) * 100)
    : null
  const delta = prevPct !== null ? pct - prevPct : null

  const color = pct >= 70 ? PALETTE.green : pct >= 50 ? PALETTE.brand : PALETTE.amber
  const label = pct >= 70 ? 'Excellent' : pct >= 50 ? 'Honorable' : pct >= 30 ? 'À renforcer' : 'En difficulté'

  // Score par module
  const modScores = scoreByModule(
    session.question_ids,
    session.answers,
    new Map(Array.from(questions.entries()).map(([id, q]) => [id, { module_id: q.module_id, correct_index: q.correct_index }])),
  )

  // Liste des questions à afficher
  const visibleQuestions = session.question_ids
    .map(qid => ({ qid, q: questions.get(qid) }))
    .filter(x => x.q)
    .filter(({ qid, q }) => {
      if (!showWrongOnly) return true
      return session.answers[qid] !== q!.correct_index
    })

  // Durée passée
  const startedAt = new Date(session.started_at).getTime()
  const completedAt = session.completed_at ? new Date(session.completed_at).getTime() : startedAt
  const usedSeconds = Math.floor((completedAt - startedAt) / 1000)

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: `${sp(12)}px ${sp(5)}px 0`, display: 'flex', alignItems: 'center', gap: sp(2) }}>
        <button
          onClick={() => router.push('/mock-exam')}
          aria-label="Retour"
          style={{
            width: 36, height: 36, borderRadius: 12, background: PALETTE.surface,
            border: `1px solid ${PALETTE.rule}`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
          }}>
          <Icon name="chevronL" size={16} color={PALETTE.ink} strokeWidth={2.2} />
        </button>
        <div>
          <div style={{ ...monoStyle('xs', 'med', PALETTE.brand), textTransform: 'uppercase', letterSpacing: 1.4 }}>
            Résultat
          </div>
          <div style={displayStyle('xl', 'bold')}>Épreuve blanche</div>
        </div>
      </div>

      {/* Hero score */}
      <div style={{ padding: `${sp(4)}px ${sp(5)}px 0` }}>
        <div style={{
          background: PALETTE.surface, borderRadius: RADIUS.xl,
          border: `1px solid ${PALETTE.rule}`,
          padding: '24px 22px',
          boxShadow: SHADOW.md,
          textAlign: 'center',
        }}>
          <div style={{ ...monoStyle('xs', 'med', color), textTransform: 'uppercase', letterSpacing: 1.4 }}>
            {label}
          </div>
          <div style={{
            fontSize: 64, fontWeight: 900, color, letterSpacing: -3,
            marginTop: 6, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>{pct}%</div>
          <div style={{ ...typeStyle('sm', 'body', PALETTE.inkMute), marginTop: 6 }}>
            {session.score_correct}/{session.total_questions} bonnes réponses
          </div>

          {delta !== null && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginTop: 12, padding: '4px 10px', borderRadius: 999,
              background: delta >= 0 ? PALETTE.greenSoft : PALETTE.amberSoft,
              color: delta >= 0 ? PALETTE.green : PALETTE.amber,
              fontSize: 12, fontWeight: 800, letterSpacing: 0.4,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {delta >= 0 ? '↑' : '↓'} {delta >= 0 ? '+' : ''}{delta} pts vs session précédente
            </div>
          )}

          <div style={{
            marginTop: 14, paddingTop: 14, borderTop: `1px solid ${PALETTE.rule}`,
            display: 'flex', justifyContent: 'space-around',
            ...typeStyle('xs', 'med', PALETTE.inkMute),
          }}>
            <div>
              <div style={{ ...displayStyle('base', 'bold'), color: PALETTE.ink }}>
                {Math.floor(usedSeconds / 60)} min
              </div>
              <div>temps passé</div>
            </div>
            <div>
              <div style={{ ...displayStyle('base', 'bold'), color: PALETTE.ink }}>
                {session.total_questions - Object.keys(session.answers).length}
              </div>
              <div>non répondues</div>
            </div>
          </div>
        </div>
      </div>

      {/* Score par module */}
      <div style={{ padding: `${sp(5)}px ${sp(5)}px 0` }}>
        <div style={{ ...monoStyle('xs', 'med', PALETTE.inkMute), textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: sp(2) }}>
          Par module
        </div>
        <div style={{
          background: PALETTE.surface, borderRadius: RADIUS.lg,
          border: `1px solid ${PALETTE.rule}`, overflow: 'hidden',
        }}>
          {Object.entries(MODULE_MAP).map(([modId, mod], i, arr) => {
            const stat = modScores[modId]
            if (!stat) return null
            const modColor = MODULE_ACCENT[modId] ?? PALETTE.brand
            const isLast = i === arr.length - 1
            return (
              <div key={modId} style={{
                padding: '12px 14px',
                borderBottom: isLast ? 'none' : `1px solid ${PALETTE.rule}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: modColor, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, letterSpacing: 0.4,
                  }}>{modId}</div>
                  <div style={{ flex: 1, ...typeStyle('sm', 'med') }}>
                    {mod.label}
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 900, color: stat.pct >= 70 ? PALETTE.green : stat.pct >= 40 ? PALETTE.brand : PALETTE.amber,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {stat.correct}/{stat.total}
                  </div>
                </div>
                <div style={{
                  height: 6, background: PALETTE.surfaceAlt,
                  borderRadius: 999, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${stat.pct}%`, height: '100%', background: modColor,
                    borderRadius: 999, transition: 'width .8s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Correction */}
      <div style={{ padding: `${sp(5)}px ${sp(5)}px 0` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp(2) }}>
          <div style={{ ...monoStyle('xs', 'med', PALETTE.inkMute), textTransform: 'uppercase', letterSpacing: 1.4 }}>
            Correction
          </div>
          <button
            onClick={() => setShowWrongOnly(!showWrongOnly)}
            style={{
              padding: '4px 10px', borderRadius: 999, border: `1px solid ${PALETTE.rule}`,
              background: showWrongOnly ? PALETTE.amberSoft : PALETTE.surface,
              color: showWrongOnly ? PALETTE.amber : PALETTE.inkMute,
              fontSize: 11, fontWeight: 800, fontFamily: A.font, cursor: 'pointer',
              letterSpacing: 0.4,
            }}>
            {showWrongOnly ? 'Erreurs seulement' : 'Toutes'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: sp(2) }}>
          {visibleQuestions.length === 0 ? (
            <div style={{
              padding: 28, textAlign: 'center', background: PALETTE.surface,
              border: `1px solid ${PALETTE.rule}`, borderRadius: RADIUS.md,
              ...typeStyle('sm', 'med', PALETTE.inkMute),
            }}>
              🎉 Aucune erreur — sans-faute !
            </div>
          ) : visibleQuestions.map(({ qid, q }, i) => {
            const picked = session.answers[qid]
            const wasAnswered = qid in session.answers
            const isCorrect = picked === q!.correct_index
            const choices = (q!.choices as string[]) ?? []
            return (
              <div key={qid} style={{
                background: PALETTE.surface, borderRadius: RADIUS.md,
                border: `1px solid ${isCorrect ? PALETTE.green : PALETTE.rule}`,
                padding: sp(3),
                borderLeft: `3px solid ${isCorrect ? PALETTE.green : '#DC2626'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    fontSize: 10.5, fontWeight: 800,
                    color: MODULE_ACCENT[q!.module_id] ?? PALETTE.brand,
                    letterSpacing: 1, textTransform: 'uppercase',
                  }}>
                    {q!.module_id} · Q{session.question_ids.indexOf(qid) + 1}
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{
                    fontSize: 10.5, fontWeight: 800,
                    color: isCorrect ? PALETTE.green : '#DC2626',
                    letterSpacing: 0.5,
                  }}>
                    {isCorrect ? '✓ JUSTE' : wasAnswered ? '✗ FAUX' : '— NON RÉPONDU'}
                  </div>
                </div>
                <div style={{ ...typeStyle('sm', 'med'), marginBottom: 8 }}>
                  {q!.question}
                </div>
                {choices.map((c, ci) => {
                  const isPicked = picked === ci
                  const isAnswer = ci === q!.correct_index
                  const bg = isAnswer ? PALETTE.greenSoft
                           : isPicked ? '#FCE8E8'
                           : PALETTE.surfaceAlt
                  const border = isAnswer ? PALETTE.green
                              : isPicked ? '#DC2626'
                              : PALETTE.rule
                  return (
                    <div key={ci} style={{
                      padding: '8px 12px', borderRadius: 10,
                      background: bg, border: `1px solid ${border}`,
                      marginBottom: 4,
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 13, color: PALETTE.ink, fontWeight: isAnswer ? 700 : 500,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: border, minWidth: 14 }}>
                        {isAnswer ? '✓' : isPicked ? '✗' : ''}
                      </div>
                      <div style={{ flex: 1 }}>{c}</div>
                    </div>
                  )
                })}
                {q!.explanation && (
                  <div style={{
                    marginTop: 8, padding: 10, borderRadius: 10,
                    background: PALETTE.brandSoft, fontSize: 12, color: PALETTE.ink,
                    lineHeight: 1.5,
                  }}>
                    <b style={{ color: PALETTE.brand }}>Explication —</b> {q!.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA bas */}
      <div style={{ padding: `${sp(5)}px ${sp(5)}px 0` }}>
        <Link href="/mock-exam" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '14px 18px', borderRadius: 16,
            background: PALETTE.brand, color: '#fff',
            textAlign: 'center', fontSize: 14, fontWeight: 800,
            boxShadow: `0 10px 24px -6px ${PALETTE.brand}77`,
          }}>
            Retour
          </div>
        </Link>
      </div>
    </div>
  )
}
