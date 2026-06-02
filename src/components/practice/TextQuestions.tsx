'use client'

import { useState } from 'react'
import { A } from '@/lib/theme'

export type TextQuestion = {
  id: string
  label: string
  // soit une réponse unique soit un tableau d'alternatives acceptées
  answer: string | string[]
  hint?: string
}

export type AnswerMap = Record<string, string>

function normalize(s: string): string {
  return s.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // sans accents
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
}

function isCorrect(user: string, expected: string | string[]): boolean {
  const u = normalize(user)
  if (!u) return false
  const list = Array.isArray(expected) ? expected : [expected]
  return list.some(e => normalize(e) === u)
}

interface Props {
  questions: TextQuestion[]
  showCorrection: boolean
  onChange?: (answers: AnswerMap) => void
}

export default function TextQuestions({ questions, showCorrection, onChange }: Props) {
  const [answers, setAnswers] = useState<AnswerMap>({})

  function update(id: string, value: string) {
    const next = { ...answers, [id]: value }
    setAnswers(next)
    onChange?.(next)
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 14,
      border: `1px solid ${A.border}`,
      fontFamily: A.font,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: A.textMuted,
        letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10,
      }}>
        Questions
      </div>

      {questions.map((q, i) => {
        const user = answers[q.id] ?? ''
        const ok = showCorrection ? isCorrect(user, q.answer) : null
        const expected = Array.isArray(q.answer) ? q.answer[0] : q.answer
        const borderC = ok === true  ? '#16A34A'
                      : ok === false ? '#EF4444'
                      : A.border
        const bg     = ok === true  ? '#E7F8EE'
                     : ok === false ? '#FDECEC'
                     : '#fff'
        return (
          <div key={q.id} style={{
            marginTop: i === 0 ? 0 : 12,
          }}>
            <label style={{
              display: 'block', fontSize: 13, fontWeight: 700, color: A.text, marginBottom: 6,
            }}>
              {q.label}
            </label>
            <input
              type="text"
              value={user}
              onChange={e => update(q.id, e.target.value)}
              disabled={showCorrection}
              placeholder={q.hint}
              style={{
                width: '100%', padding: '10px 12px',
                border: `2px solid ${borderC}`, borderRadius: 10,
                fontSize: 13, fontFamily: A.font, color: A.text,
                background: bg, outline: 'none',
              }}
            />
            {showCorrection && ok === false && (
              <div style={{
                marginTop: 4, fontSize: 11, color: '#B91C1C', fontWeight: 700,
              }}>
                → Attendu : {expected}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function scoreQuestions(user: AnswerMap, questions: TextQuestion[]): { cellsCorrect: number; cellsTotal: number } {
  let correct = 0
  for (const q of questions) {
    if (isCorrect(user[q.id] ?? '', q.answer)) correct++
  }
  return { cellsCorrect: correct, cellsTotal: questions.length }
}
