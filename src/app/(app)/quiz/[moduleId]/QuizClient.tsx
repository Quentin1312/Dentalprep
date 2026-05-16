'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Module } from '@/lib/modules'

type Question = {
  id: string
  question: string
  choices: unknown
  correct_index: number
  explanation: string
  module_id: string
}

export default function QuizClient({ questions, module: mod, userId }: { questions: Question[]; module: Module; userId: string }) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[index]
  const choices = q.choices as string[]
  const isCorrect = selected === q.correct_index

  async function handleSelect(choiceIndex: number) {
    if (selected !== null) return
    setSelected(choiceIndex)
    if (choiceIndex === q.correct_index) setScore(s => s + 1)

    // Save attempt
    const supabase = createClient()
    await supabase.from('quiz_attempts').insert({
      user_id: userId,
      module_id: mod.id,
      question_id: q.id,
      selected_index: choiceIndex,
      is_correct: choiceIndex === q.correct_index,
    })
  }

  function handleNext() {
    setSelected(null)
    if (index + 1 >= questions.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
    }
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-28 h-28 rounded-full flex items-center justify-center mb-6 border-4" style={{ borderColor: mod.color, backgroundColor: mod.colorSoft }}>
          <span className="text-3xl font-bold" style={{ color: mod.color }}>{pct}%</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz terminé !</h2>
        <p className="text-gray-500 text-sm mb-6">{score} bonne(s) réponse(s) sur {questions.length}</p>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => { setIndex(0); setSelected(null); setScore(0); setDone(false) }} className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-sm">
            Recommencer
          </button>
          <button onClick={() => router.push('/dashboard')} className="flex-1 font-semibold py-3.5 rounded-2xl transition-colors text-sm text-white" style={{ backgroundColor: mod.color }}>
            Tableau de bord
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-6 min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Retour
        </button>
        <span className="text-sm font-medium" style={{ color: mod.color }}>{mod.label}</span>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${((index) / questions.length) * 100}%`, backgroundColor: mod.color }} />
      </div>

      <p className="text-xs text-gray-400 mb-3">Question {index + 1} / {questions.length}</p>
      <h2 className="text-lg font-bold text-gray-900 mb-6 leading-snug">{q.question}</h2>

      {/* Choices */}
      <div className="space-y-3 flex-1">
        {choices.map((choice, i) => {
          let style = 'bg-white border-2 border-gray-100 text-gray-800'
          if (selected !== null) {
            if (i === q.correct_index) style = 'bg-green-50 border-2 border-green-400 text-green-800'
            else if (i === selected) style = 'bg-red-50 border-2 border-red-400 text-red-800'
            else style = 'bg-white border-2 border-gray-100 text-gray-400'
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full text-left px-5 py-4 rounded-2xl font-medium text-sm transition-all ${style} ${selected === null ? 'hover:border-blue-300 hover:bg-blue-50 active:scale-98' : ''}`}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
              {choice}
            </button>
          )
        })}
      </div>

      {/* Explanation + Next */}
      {selected !== null && (
        <div className="mt-6">
          <div className={`rounded-2xl px-4 py-3 mb-4 text-sm ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="font-semibold mb-1">{isCorrect ? '✅ Bonne réponse !' : '❌ Incorrect'}</p>
            <p>{q.explanation}</p>
          </div>
          <button onClick={handleNext} className="w-full text-white font-semibold py-4 rounded-2xl transition-colors" style={{ backgroundColor: mod.color }}>
            {index + 1 >= questions.length ? 'Voir le score' : 'Question suivante →'}
          </button>
        </div>
      )}
    </div>
  )
}
