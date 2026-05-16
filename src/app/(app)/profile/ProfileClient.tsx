'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  full_name: string | null
  exam_date: string | null
  daily_goal_minutes: number
}

export default function ProfileClient({ profile, email }: { profile: Profile | null; email: string }) {
  const router = useRouter()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [examDate, setExamDate] = useState(profile?.exam_date ?? '')
  const [goal, setGoal] = useState(profile?.daily_goal_minutes ?? 30)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      full_name: name,
      exam_date: examDate || null,
      daily_goal_minutes: goal,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="px-4 pt-12 pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profil</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
          {(profile?.full_name ?? email)[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-bold text-gray-900">{profile?.full_name ?? 'Mon profil'}</p>
          <p className="text-gray-500 text-sm">{email}</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Date d&apos;examen</label>
          <input
            type="date"
            value={examDate}
            onChange={e => setExamDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Objectif quotidien : <span className="text-blue-600">{goal} min</span></label>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={goal}
            onChange={e => setGoal(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10 min</span><span>2h</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 mb-3"
      >
        {saved ? '✅ Enregistré !' : saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </button>

      <button
        onClick={handleLogout}
        className="w-full border-2 border-red-200 text-red-600 font-semibold py-3.5 rounded-2xl hover:bg-red-50 transition-colors"
      >
        Se déconnecter
      </button>
    </div>
  )
}
