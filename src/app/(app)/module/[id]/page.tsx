import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MODULE_MAP } from '@/lib/modules'
import type { ModuleId } from '@/types/database'

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const mod = MODULE_MAP[id as ModuleId]
  if (!mod) redirect('/dashboard')

  const mid = id as ModuleId
  const [{ data: courses }, { data: flashcards }, { data: attempts }] = await Promise.all([
    supabase.from('courses').select('*').eq('user_id', user.id).eq('module_id', mid).order('created_at', { ascending: false }),
    supabase.from('flashcards').select('id').eq('user_id', user.id).eq('module_id', mid),
    supabase.from('quiz_attempts').select('is_correct').eq('user_id', user.id).eq('module_id', mid),
  ])

  const totalAttempts = attempts?.length ?? 0
  const correct = attempts?.filter(a => a.is_correct).length ?? 0
  const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : null

  return (
    <div className="px-4 pt-12 pb-6">
      {/* Header */}
      <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 text-sm mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
        Tableau de bord
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ backgroundColor: mod.colorSoft, color: mod.color }}>
          {mod.id}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{mod.label}</h1>
          <p className="text-gray-500 text-sm">{mod.bloc}</p>
        </div>
      </div>

      {/* Stats ring */}
      {accuracy !== null && (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6 flex items-center gap-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={mod.color} strokeWidth="3"
                strokeDasharray={`${accuracy} ${100 - accuracy}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold" style={{ color: mod.color }}>{accuracy}%</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{accuracy}% de réussite</p>
            <p className="text-gray-500 text-sm">{totalAttempts} questions tentées</p>
            <p className="text-gray-500 text-sm">{flashcards?.length ?? 0} flashcards disponibles</p>
          </div>
        </div>
      )}

      {/* Mode de révision */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Modes de révision</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href={`/flashcards/${id}`} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-2 hover:border-blue-200 transition-colors">
          <span className="text-2xl">🃏</span>
          <p className="font-semibold text-gray-900 text-sm">Flashcards</p>
          <p className="text-gray-400 text-xs">{flashcards?.length ?? 0} cartes</p>
        </Link>
        <Link href={`/quiz/${id}`} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-2 hover:border-blue-200 transition-colors">
          <span className="text-2xl">🎯</span>
          <p className="font-semibold text-gray-900 text-sm">Quiz QCM</p>
          <p className="text-gray-400 text-xs">{totalAttempts > 0 ? `${accuracy}% de réussite` : 'Pas encore tenté'}</p>
        </Link>
      </div>

      {/* Cours */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Cours importés</h2>
      {courses?.length ? (
        <div className="space-y-2">
          {courses.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: mod.colorSoft }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={mod.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{c.title}</p>
                <p className="text-gray-400 text-xs">{c.page_count} page(s)</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-gray-500 text-sm mb-3">Aucun cours importé pour ce module.</p>
          <Link href="/upload" className="text-blue-600 font-semibold text-sm hover:underline">+ Ajouter un cours</Link>
        </div>
      )}
    </div>
  )
}
