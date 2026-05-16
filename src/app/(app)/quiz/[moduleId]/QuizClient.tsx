'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'

type Question = { id: string; question: string; choices: unknown; correct_index: number; explanation: string; module_id: string }

export default function QuizClient({ questions, moduleId, userId }: { questions: Question[]; moduleId: string; userId: string }) {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [scoreOk, setScoreOk] = useState(0)
  const [scoreBad, setScoreBad] = useState(0)

  const q = questions[idx]
  const choices = q.choices as string[]
  const total = questions.length

  async function submit() {
    if (picked === null) return
    setShowResult(true)
    const isCorrect = picked === q.correct_index
    if (isCorrect) setScoreOk(s => s + 1); else setScoreBad(s => s + 1)
    const supabase = createClient()
    await supabase.from('quiz_attempts').insert({ user_id: userId, module_id: moduleId as ModuleId, question_id: q.id, selected_index: picked, is_correct: isCorrect })
  }

  function next() {
    if (idx + 1 >= total) { router.push(`/module/${moduleId}`); return }
    setIdx(i => i + 1); setPicked(null); setShowResult(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '60px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => router.push(`/module/${moduleId}`)} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="x" size={16} color={A.text} />
          </button>
          <div style={{ flex: 1, height: 5, background: '#E9ECF2', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${(idx / total) * 100}%`, height: '100%', background: A.primary, borderRadius: 5, transition: 'width .4s' }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted }}>{idx + 1}<span style={{ color: A.textDim }}>/{total}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: A.textMuted }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: A.green }} />{scoreOk} bonnes
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: A.red }} />{scoreBad} erreurs
          </span>
        </div>
      </div>

      {/* Question */}
      <div style={{ padding: '8px 20px 24px', flex: 1 }}>
        <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
          Question {idx + 1} · {moduleId}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.25, marginBottom: 24 }}>{q.question}</div>

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
              <button key={i} onClick={() => !showResult && setPicked(i)} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: showResult ? 'default' : 'pointer', textAlign: 'left', fontFamily: A.font, transition: 'all .2s', width: '100%' }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, border: `1.5px solid ${sel || isCorrect ? border : '#C8CFD9'}`, background: (sel || isCorrect) ? border : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(sel || isCorrect) && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />}
                </div>
                <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color }}>{c}</div>
                {isCorrect && <Icon name="check" size={18} color={A.green} strokeWidth={2.5} />}
                {isWrong && <Icon name="x" size={18} color={A.red} strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>

        {showResult && (
          <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: picked === q.correct_index ? A.greenSoft : '#FEEBEB', border: `0.5px solid ${picked === q.correct_index ? A.green + '40' : A.red + '40'}` }}>
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
      <div style={{ padding: '12px 20px 30px' }}>
        {showResult ? (
          <button onClick={next} style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
            {idx + 1 >= total ? 'Terminer' : 'Question suivante'} <Icon name="arrowR" size={16} color="#fff" />
          </button>
        ) : (
          <button onClick={submit} style={{ width: '100%', height: 50, borderRadius: 14, border: `0.5px solid ${A.borderStrong}`, background: picked === null ? A.surface : A.primary, color: picked === null ? A.text : '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', opacity: picked === null ? 0.5 : 1, boxShadow: picked !== null ? '0 4px 14px rgba(10,102,224,0.28)' : 'none' }}>
            Valider
          </button>
        )}
      </div>
    </div>
  )
}
