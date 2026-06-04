'use client'

import { useState } from 'react'
import { A, PALETTE, RADIUS, SHADOW, sp, monoStyle, typeStyle } from '@/lib/theme'

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
      background: PALETTE.surface, borderRadius: RADIUS.lg, padding: sp(4),
      border: `1px solid ${PALETTE.rule}`, boxShadow: SHADOW.sm,
    }}>
      <div style={{
        ...monoStyle('xs', 'med', PALETTE.inkDim),
        textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: sp(3),
      }}>
        Questions
      </div>

      {questions.map((q, i) => {
        const user = answers[q.id] ?? ''
        const ok = showCorrection ? isCorrect(user, q.answer) : null
        const expected = Array.isArray(q.answer) ? q.answer[0] : q.answer
        const borderC = ok === true  ? PALETTE.green
                      : ok === false ? PALETTE.red
                      : PALETTE.rule
        const bg     = ok === true  ? PALETTE.greenSoft
                     : ok === false ? PALETTE.redSoft
                     : PALETTE.surface
        return (
          <div key={q.id} style={{
            marginTop: i === 0 ? 0 : sp(3),
          }}>
            <label style={{
              display: 'block', ...typeStyle('sm', 'med'), marginBottom: 6,
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
                width: '100%', padding: `${sp(2)}px ${sp(3)}px`,
                border: `2px solid ${borderC}`, borderRadius: RADIUS.md,
                ...typeStyle('sm', 'med'),
                background: bg, outline: 'none',
              }}
            />
            {showCorrection && ok === false && (
              <div style={{
                marginTop: 4, ...monoStyle('xs', 'med', '#7A1F1D'),
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
