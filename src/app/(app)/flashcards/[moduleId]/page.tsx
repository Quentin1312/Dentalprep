'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import FlashcardsClient from './FlashcardsClient'
import { A } from '@/lib/theme'
import type { ModuleId } from '@/types/database'

type Flashcard = { id: string; concept: string; definition: string }
const LESSON_SIZE = 10

function Skel({ h }: { h: number }) {
  return <div style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

function FlashcardsInner() {
  const { moduleId } = useParams() as { moduleId: string }
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  const lesson = Math.max(0, parseInt(searchParams.get('lesson') ?? '0', 10) || 0)
  const router = useRouter()
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null)
  const [totalCards, setTotalCards] = useState(0)
  const [totalLessons, setTotalLessons] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      let q = supabase.from('flashcards').select('id,concept,definition').eq('user_id', user.id)
      if (courseId) {
        q = q.eq('course_id', courseId).eq('module_id', moduleId as ModuleId)
      } else {
        q = q.eq('module_id', moduleId as ModuleId)
      }
      q.order('created_at').then(({ data }) => {
        const allCards = data ?? []
        setTotalCards(allCards.length)
        setTotalLessons(Math.max(1, Math.ceil(allCards.length / LESSON_SIZE)))
        setFlashcards(courseId ? allCards.slice(lesson * LESSON_SIZE, (lesson + 1) * LESSON_SIZE) : allCards)
        setLoading(false)
      })
    })
  }, [moduleId, courseId, lesson, router])

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
      <div style={{ fontSize: 14, color: A.textMuted }}>Importez des cours pour générer des flashcards.</div>
    </div>
  )

  return (
    <FlashcardsClient
      flashcards={flashcards}
      moduleId={moduleId}
      userId={userId!}
      courseId={courseId}
      lesson={courseId ? lesson : undefined}
      totalLessons={courseId ? totalLessons : undefined}
      totalCards={courseId ? totalCards : undefined}
    />
  )
}

export default function FlashcardsPage() {
  return <Suspense><FlashcardsInner /></Suspense>
}
