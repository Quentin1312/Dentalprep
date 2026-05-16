'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Module } from '@/lib/modules'

type Flashcard = { id: string; concept: string; definition: string }

export default function FlashcardsClient({ flashcards, module: mod }: { flashcards: Flashcard[]; module: Module }) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [toReview, setToReview] = useState(0)
  const [done, setDone] = useState(false)

  const card = flashcards[index]
  const progress = index / flashcards.length

  function handleKnow() {
    setKnown(k => k + 1)
    next()
  }

  function handleReview() {
    setToReview(r => r + 1)
    next()
  }

  function next() {
    setFlipped(false)
    if (index + 1 >= flashcards.length) {
      setDone(true)
    } else {
      setTimeout(() => setIndex(i => i + 1), 150)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <span className="text-3xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Session terminée !</h2>
        <p className="text-gray-500 text-sm mb-6">
          ✅ {known} sus · 🔄 {toReview} à revoir sur {flashcards.length} cartes
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => { setIndex(0); setFlipped(false); setKnown(0); setToReview(0); setDone(false) }} className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-sm">
            Recommencer
          </button>
          <button onClick={() => router.push(`/quiz/${mod.id}`)} className="flex-1 bg-blue-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors text-sm">
            Faire le quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-6 min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
          Retour
        </button>
        <span className="text-sm text-gray-400">{index + 1} / {flashcards.length}</span>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress * 100}%`, backgroundColor: mod.color }} />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={() => setFlipped(f => !f)}
          className="w-full max-w-sm min-h-64 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl transition-all duration-300 active:scale-95"
          style={{ backgroundColor: flipped ? mod.colorSoft : 'white', border: `2px solid ${flipped ? mod.color + '40' : '#F3F4F6'}` }}
        >
          <span className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: mod.color }}>
            {flipped ? 'Définition' : 'Concept'}
          </span>
          <p className="text-lg font-semibold text-gray-900 leading-relaxed">
            {flipped ? card.definition : card.concept}
          </p>
          {!flipped && (
            <p className="text-xs text-gray-400 mt-6">Appuyez pour voir la définition</p>
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleReview}
          className="flex-1 bg-amber-50 border-2 border-amber-200 text-amber-700 font-semibold py-4 rounded-2xl hover:bg-amber-100 transition-colors"
        >
          🔄 À revoir
        </button>
        <button
          onClick={handleKnow}
          className="flex-1 bg-green-50 border-2 border-green-200 text-green-700 font-semibold py-4 rounded-2xl hover:bg-green-100 transition-colors"
        >
          ✅ Je sais
        </button>
      </div>
    </div>
  )
}
