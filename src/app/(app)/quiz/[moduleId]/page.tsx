import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizClient from './QuizClient'
import { MODULE_MAP } from '@/lib/modules'
import type { ModuleId } from '@/types/database'

export default async function QuizPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const mod = MODULE_MAP[moduleId as ModuleId]
  if (!mod) redirect('/dashboard')

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_id', moduleId as ModuleId)
    .order('created_at')

  if (!questions?.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl mb-4">📭</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune question</h2>
        <p className="text-gray-500 text-sm">Ajoutez des cours pour le module {mod.label} pour générer un quiz.</p>
      </div>
    )
  }

  return <QuizClient questions={questions} module={mod} userId={user.id} />
}
