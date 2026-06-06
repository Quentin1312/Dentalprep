'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FlashcardsClient from '../[moduleId]/FlashcardsClient'
import { A } from '@/lib/theme'

type Flashcard = { id: string; concept: string; definition: string; module_id: string }

// Cap session — au-delà l'élève abandonne. Anki recommande 20-30/jour.
const DUE_SESSION_CAP = 20

function Skel({ h }: { h: number }) {
  return <div style={{
    height: h, borderRadius: 14,
    background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
  }} />
}

export default function FlashcardsDuePage() {
  const router = useRouter()
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const supaAny = supabase as any

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)

      // Toutes les cartes dues (next_review_at <= now), tous modules confondus
      supaAny.from('flashcard_progress')
        .select('flashcard_id,next_review_at')
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at', { ascending: true })
        .limit(DUE_SESSION_CAP)
        .then(async ({ data: dueRows }: any) => {
          const dueIds: string[] = (dueRows ?? []).map((r: { flashcard_id: string }) => r.flashcard_id)
          if (dueIds.length === 0) {
            setFlashcards([])
            setLoading(false)
            return
          }
          const { data: cards } = await supabase
            .from('flashcards')
            .select('id,concept,definition,module_id')
            .in('id', dueIds)

          // Préserve l'ordre par overdue
          const byId = new Map<string, Flashcard>()
          for (const c of (cards ?? []) as Flashcard[]) byId.set(c.id, c)
          const ordered = dueIds.map(id => byId.get(id)).filter((c): c is Flashcard => !!c)

          setFlashcards(ordered)
          setLoading(false)
        })
    })
  }, [router])

  const style = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`

  if (loading) return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, padding: '60px 20px 0' }}>
      <style>{style}</style>
      <Skel h={24} />
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skel h={240} /><Skel h={48} />
      </div>
    </div>
  )

  if (!flashcards?.length) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: A.text, marginBottom: 8 }}>Aucune flashcard en attente</div>
      <div style={{ fontSize: 14, color: A.textMuted, maxWidth: 280 }}>
        Tu es à jour ! Reviens plus tard ou ajoute un nouveau cours.
      </div>
      <button
        onClick={() => router.push('/dashboard')}
        style={{
          marginTop: 24, padding: '12px 24px', borderRadius: 999,
          background: A.primary, color: '#fff', border: 'none',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font,
        }}>
        Retour au tableau de bord
      </button>
    </div>
  )

  // Module dominant pour la nav. La session sert toutes les cartes dues
  // sans distinction de module.
  const dominantModule = flashcards[0].module_id

  return (
    <FlashcardsClient
      flashcards={flashcards}
      moduleId={dominantModule}
      userId={userId!}
      totalCards={flashcards.length}
    />
  )
}
