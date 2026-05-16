import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FlashcardsClient from './FlashcardsClient'
import { MODULE_MAP } from '@/lib/modules'
import type { ModuleId } from '@/types/database'

export default async function FlashcardsPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const mod = MODULE_MAP[moduleId as ModuleId]
  if (!mod) redirect('/dashboard')

  const { data: flashcards } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_id', moduleId as ModuleId)
    .order('created_at')

  if (!flashcards?.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-4xl mb-4">📭</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune flashcard</h2>
        <p className="text-gray-500 text-sm">Ajoutez des cours pour le module {mod.label} pour générer des flashcards.</p>
      </div>
    )
  }

  return <FlashcardsClient flashcards={flashcards} module={mod} />
}
