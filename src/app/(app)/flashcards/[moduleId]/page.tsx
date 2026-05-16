import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FlashcardsClient from './FlashcardsClient'
import type { ModuleId } from '@/types/database'
import { A } from '@/lib/theme'

export default async function FlashcardsPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: flashcards } = await supabase
    .from('flashcards').select('*')
    .eq('user_id', user.id).eq('module_id', moduleId as ModuleId).order('created_at')

  if (!flashcards?.length) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: A.text, marginBottom: 8 }}>Aucune flashcard</div>
      <div style={{ fontSize: 14, color: A.textMuted }}>Importez des cours pour le module {moduleId} pour générer des flashcards.</div>
    </div>
  )

  return <FlashcardsClient flashcards={flashcards} moduleId={moduleId} />
}
