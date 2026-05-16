import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import QuizClient from './QuizClient'
import { MODULE_MAP } from '@/lib/modules'
import { A } from '@/lib/theme'
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: A.text, marginBottom: 8 }}>Aucune question</div>
        <div style={{ fontSize: 14, color: A.textMuted }}>Ajoutez des cours pour le module {mod.label} pour générer un quiz.</div>
      </div>
    )
  }

  return <QuizClient questions={questions} moduleId={moduleId} userId={user.id} />
}
