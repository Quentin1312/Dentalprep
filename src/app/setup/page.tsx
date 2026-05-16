'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Bienvenue', 'Prénom', 'Examen', 'Objectif']
const GOALS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1h', value: 60 },
]

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [goal, setGoal] = useState(30)
  const [loading, setLoading] = useState(false)

  async function handleFinish() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    await supabase.from('profiles').update({
      full_name: name,
      exam_date: examDate || null,
      daily_goal_minutes: goal,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-600' : i < step ? 'w-4 bg-blue-300' : 'w-4 bg-gray-200'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center mx-auto mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue sur DentalPrep</h1>
            <p className="text-gray-500 text-sm mb-8">Préparez le CNQAOS avec des flashcards et quiz générés par IA à partir de vos cours.</p>
            <button onClick={() => setStep(1)} className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors">
              Commencer →
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Comment vous appelez-vous ?</h2>
            <p className="text-gray-500 text-sm mb-6">Pour personnaliser votre expérience</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Votre prénom"
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 text-lg font-medium mb-6"
              autoFocus
            />
            <button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-40"
            >
              Continuer →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Date de l&apos;examen ?</h2>
            <p className="text-gray-500 text-sm mb-6">Pour calculer votre compte à rebours</p>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 text-base mb-6"
            />
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors">
                ← Retour
              </button>
              <button onClick={() => setStep(3)} className="flex-1 bg-blue-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors">
                Continuer →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Objectif quotidien ?</h2>
            <p className="text-gray-500 text-sm mb-6">Combien de temps souhaitez-vous réviser par jour ?</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {GOALS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`py-4 rounded-2xl font-semibold text-lg transition-all ${goal === g.value ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors">
                ← Retour
              </button>
              <button onClick={handleFinish} disabled={loading} className="flex-1 bg-blue-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {loading ? 'Enregistrement…' : "C'est parti !"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
