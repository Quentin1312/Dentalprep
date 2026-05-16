import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MODULES } from '@/lib/modules'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: attempts }, { data: sessions }] = await Promise.all([
    supabase.from('profiles').select('streak, daily_goal_minutes').eq('id', user.id).single(),
    supabase.from('quiz_attempts').select('module_id, is_correct, created_at').eq('user_id', user.id),
    supabase.from('daily_sessions').select('date, minutes_studied').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
  ])

  const totalAttempts = attempts?.length ?? 0
  const totalCorrect = attempts?.filter(a => a.is_correct).length ?? 0
  const globalAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

  const moduleStats = MODULES.map(m => {
    const mAttempts = attempts?.filter(a => a.module_id === m.id) ?? []
    const correct = mAttempts.filter(a => a.is_correct).length
    const accuracy = mAttempts.length > 0 ? Math.round((correct / mAttempts.length) * 100) : null
    return { ...m, accuracy, count: mAttempts.length }
  }).filter(m => m.count > 0)

  // Estimated score (weighted average)
  const estimatedScore = moduleStats.length > 0
    ? Math.round(moduleStats.reduce((sum, m) => sum + (m.accuracy ?? 0), 0) / moduleStats.length)
    : null

  return (
    <div className="px-4 pt-12 pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Statistiques</h1>

      {/* Global cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{profile?.streak ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Streak 🔥</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{globalAccuracy}%</p>
          <p className="text-xs text-gray-500 mt-1">Précision</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{totalAttempts}</p>
          <p className="text-xs text-gray-500 mt-1">Questions</p>
        </div>
      </div>

      {/* Score estimé */}
      {estimatedScore !== null && (
        <div className="bg-blue-600 rounded-3xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Score CNQAOS estimé</p>
            <p className="text-4xl font-bold text-white">{estimatedScore}%</p>
            <p className="text-blue-200 text-xs mt-1">Basé sur {totalAttempts} questions</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{estimatedScore >= 70 ? '🟢' : estimatedScore >= 50 ? '🟡' : '🔴'}</span>
          </div>
        </div>
      )}

      {/* Par module */}
      {moduleStats.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Par module</h2>
          <div className="space-y-3">
            {moduleStats.map(m => (
              <div key={m.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: m.colorSoft, color: m.color }}>{m.id}</span>
                    <span className="text-sm font-semibold text-gray-900">{m.label}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: (m.accuracy ?? 0) >= 70 ? '#16A34A' : (m.accuracy ?? 0) >= 40 ? '#D97706' : '#DC2626' }}>
                    {m.accuracy}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${m.accuracy}%`, backgroundColor: (m.accuracy ?? 0) >= 70 ? '#16A34A' : (m.accuracy ?? 0) >= 40 ? '#D97706' : '#DC2626' }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{m.count} questions tentées</p>
              </div>
            ))}
          </div>
        </>
      )}

      {totalAttempts === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-gray-500 text-sm">Faites vos premiers quiz pour voir vos statistiques apparaître ici.</p>
        </div>
      )}
    </div>
  )
}
