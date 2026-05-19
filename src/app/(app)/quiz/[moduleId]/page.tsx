'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import QuizClient from './QuizClient'
import { MODULE_MAP } from '@/lib/modules'
import { A } from '@/lib/theme'
import type { ModuleId } from '@/types/database'

type Question = { id: string; question: string; choices: unknown; correct_index: number; explanation: string; module_id: string; course_id: string; page_image_url?: string | null }
type AttemptStat = { question_id: string; is_correct: boolean }

function Skel({ h }: { h: number }) {
  return <div style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

function smartSort(q: Question, stats: Map<string, { ok: number; total: number }>): number {
  const s = stats.get(q.id)
  if (!s || s.total === 0) return 1 // jamais vu → 2ème priorité
  const acc = s.ok / s.total
  if (acc < 0.5) return 0  // en difficulté → 1ère priorité
  if (acc < 0.8) return 2  // en progression → 3ème
  return 3                  // maîtrisée → dernière
}

function QuizInner() {
  const { moduleId } = useParams() as { moduleId: string }
  const searchParams = useSearchParams()
  const router = useRouter()

  const courseId = searchParams.get('courseId') ?? null
  const mode = searchParams.get('mode') ?? 'normal' // 'normal' | 'smart'

  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [attemptStats, setAttemptStats] = useState<Map<string, { ok: number; total: number }>>(new Map())
  const [userId, setUserId] = useState<string | null>(null)
  const [petType, setPetType] = useState<string>('cat')
  const [loading, setLoading] = useState(true)

  const mod = MODULE_MAP[moduleId as ModuleId]

  useEffect(() => {
    if (!mod) { router.replace('/dashboard'); return }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      supabase.from('profiles').select('pet_type').eq('id', user.id).single().then(({ data }) => {
        if (data?.pet_type) setPetType(data.pet_type)
      })

      let q = supabase.from('quiz_questions').select('*').eq('user_id', user.id).eq('module_id', moduleId as ModuleId)
      if (courseId) q = q.eq('course_id', courseId)

      Promise.all([
        q.order('created_at'),
        supabase.from('quiz_attempts').select('question_id,is_correct').eq('user_id', user.id).eq('module_id', moduleId as ModuleId),
      ]).then(([{ data: qs }, { data: atts }]) => {
        const raw = qs ?? []
        const stats = new Map<string, { ok: number; total: number }>()
        for (const a of atts ?? [] as AttemptStat[]) {
          const s = stats.get(a.question_id) ?? { ok: 0, total: 0 }
          stats.set(a.question_id, { ok: s.ok + (a.is_correct ? 1 : 0), total: s.total + 1 })
        }
        setAttemptStats(stats)

        let sorted = raw
        if (mode === 'smart') {
          sorted = [...raw].sort((a, b) => smartSort(a, stats) - smartSort(b, stats))
          // Cap à 25 questions, mais prendre au moins toutes les questions à revoir
          const toReview = sorted.filter(q => smartSort(q, stats) === 0)
          const unseen = sorted.filter(q => smartSort(q, stats) === 1)
          const improving = sorted.filter(q => smartSort(q, stats) === 2)
          const mastered = sorted.filter(q => smartSort(q, stats) === 3)
          // Priorité: toutes les erreurs + quelques nouvelles + quelques améliorations
          sorted = [
            ...toReview,
            ...unseen.slice(0, Math.max(5, 20 - toReview.length)),
            ...improving.slice(0, 5),
            ...mastered.slice(0, 2),
          ].slice(0, 30)
        }

        setQuestions(sorted)
        setLoading(false)
      })
    })
  }, [moduleId, courseId, mode, mod, router])

  const style = `@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`

  if (loading) return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, padding: '60px 20px 0' }}>
      <style>{style}</style>
      <Skel h={24} />
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skel h={120} /><Skel h={64} /><Skel h={64} /><Skel h={64} />
      </div>
    </div>
  )

  if (!questions?.length) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: A.text, marginBottom: 8 }}>Aucune question</div>
      <div style={{ fontSize: 14, color: A.textMuted }}>Scannez des pages pour ce fascicule pour générer un quiz.</div>
    </div>
  )

  return (
    <QuizClient
      questions={questions}
      moduleId={moduleId}
      userId={userId!}
      mode={mode as 'normal' | 'smart'}
      attemptStats={attemptStats}
      petType={petType as 'cat' | 'dog' | 'bunny'}
    />
  )
}

export default function QuizPage() {
  return <Suspense><QuizInner /></Suspense>
}
