import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MODULES } from '@/lib/modules'

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: courses }, { data: attempts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('courses').select('id, module_id').eq('user_id', user.id),
    supabase.from('quiz_attempts').select('module_id, is_correct').eq('user_id', user.id),
  ])

  const days = daysUntil(profile?.exam_date ?? null)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'là'

  const moduleStats = MODULES.map(m => {
    const moduleAttempts = attempts?.filter(a => a.module_id === m.id) ?? []
    const correct = moduleAttempts.filter(a => a.is_correct).length
    const accuracy = moduleAttempts.length > 0 ? Math.round((correct / moduleAttempts.length) * 100) : 0
    const hasCourses = courses?.some(c => c.module_id === m.id) ?? false
    return { ...m, accuracy, hasCourses, attemptCount: moduleAttempts.length }
  })

  return (
    <div className="px-4 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-500 text-sm">Bonjour {firstName} 👋</p>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        </div>
        <Link href="/upload" className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </Link>
      </div>

      {/* Exam countdown card */}
      <div className="bg-blue-600 rounded-3xl p-5 mb-6 text-white">
        <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Examen CNQAOS</p>
        {days !== null ? (
          <>
            <p className="text-4xl font-bold mb-0.5">{days} jours</p>
            <p className="text-blue-200 text-sm">
              {days <= 0 ? "C'est aujourd'hui !" : days === 1 ? 'Plus qu\'un jour !' : 'restants pour préparer'}
            </p>
          </>
        ) : (
          <p className="text-blue-100 text-sm">Ajoutez votre date d&apos;examen dans le profil</p>
        )}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1 bg-blue-500/50 rounded-full h-1.5">
            <div className="bg-white rounded-full h-1.5 w-1/3" />
          </div>
          <span className="text-blue-200 text-xs">{profile?.streak ?? 0}j de streak 🔥</span>
        </div>
      </div>

      {/* Modules */}
      <h2 className="text-lg font-bold text-gray-900 mb-3">Modules</h2>
      <div className="space-y-3">
        {MODULES.map(m => {
          const stat = moduleStats.find(s => s.id === m.id)!
          return (
            <Link key={m.id} href={`/module/${m.id}`} className="block">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: m.colorSoft }}>
                  <span className="text-xs font-bold" style={{ color: m.color }}>{m.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{m.label}</p>
                  <p className="text-gray-400 text-xs truncate">{m.bloc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {stat.attemptCount > 0 ? (
                    <>
                      <p className="text-sm font-bold" style={{ color: stat.accuracy >= 70 ? '#16A34A' : stat.accuracy >= 40 ? '#D97706' : '#DC2626' }}>
                        {stat.accuracy}%
                      </p>
                      <p className="text-gray-400 text-xs">{stat.attemptCount} qst</p>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">{stat.hasCourses ? 'À réviser' : 'Vide'}</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
