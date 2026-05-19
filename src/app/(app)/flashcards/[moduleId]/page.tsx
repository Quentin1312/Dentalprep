'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FlashcardsClient from './FlashcardsClient'
import { A } from '@/lib/theme'
import type { ModuleId } from '@/types/database'

type Flashcard = { id: string; concept: string; definition: string }

function Skel({ h }: { h: number }) {
  return <div style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

export default function FlashcardsPage() {
  const { moduleId } = useParams() as { moduleId: string }
  const router = useRouter()
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      supabase.from('flashcards').select('id,concept,definition')
        .eq('user_id', user.id).eq('module_id', moduleId as ModuleId).order('created_at')
        .then(({ data }) => { setFlashcards(data ?? []); setLoading(false) })
    })
  }, [moduleId, router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, padding: '60px 20px 0' }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <Skel h={16} />
      <div style={{ marginTop: 20 }}><Skel h={420} /></div>
    </div>
  )

  if (!flashcards?.length) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: A.text, marginBottom: 8 }}>Aucune flashcard</div>
      <div style={{ fontSize: 14, color: A.textMuted }}>Importez des cours pour le module {moduleId} pour générer des flashcards.</div>
    </div>
  )

  return <FlashcardsClient flashcards={flashcards} moduleId={moduleId} userId={userId!} />
}
