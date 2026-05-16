import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MODULE_MAP, MODULES } from '@/lib/modules'
import type { ModuleId } from '@/types/database'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const grouped = MODULES.map(m => ({
    module: m,
    courses: courses?.filter(c => c.module_id === m.id) ?? [],
  })).filter(g => g.courses.length > 0)

  return (
    <div className="px-4 pt-12 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes cours</h1>
        <Link href="/upload" className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </Link>
      </div>

      {!grouped.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-4">📚</p>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Aucun cours</h2>
          <p className="text-gray-500 text-sm mb-6">Importez vos premiers cours pour commencer à réviser.</p>
          <Link href="/upload" className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-blue-700 transition-colors">
            Ajouter un cours
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ module: m, courses: mCourses }) => (
            <div key={m.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: m.colorSoft, color: m.color }}>{m.id}</div>
                <h2 className="text-sm font-bold text-gray-700">{m.label}</h2>
              </div>
              <div className="space-y-2">
                {mCourses.map(course => (
                  <div key={course.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: m.colorSoft }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{course.title}</p>
                      <p className="text-gray-400 text-xs">{course.page_count} page(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
