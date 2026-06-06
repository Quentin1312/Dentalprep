'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import QuizClient from './QuizClient'
import { MODULE_MAP } from '@/lib/modules'
import { A } from '@/lib/theme'
import type { ModuleId } from '@/types/database'
import { useAppData } from '@/lib/app-context'
import { computeXP, xpToLevel } from '@/lib/xp'

type QType = 'QCM' | 'VF' | 'ORDRE' | 'ASSOCIATION'
type Question = { id: string; type?: QType; question: string; choices: unknown; correct_index: number; explanation: string; module_id: string; course_id: string; page_image_url?: string | null }
type AttemptStat = { question_id: string; is_correct: boolean; created_at?: string }

function Skel({ h }: { h: number }) {
  return <div style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

type Sm2Row = {
  question_id: string
  next_review_at: string | null
  is_leech: boolean
  is_suspended: boolean
  reps: number
}

function smartSort(q: Question, stats: Map<string, { ok: number; total: number }>): number {
  const s = stats.get(q.id)
  if (!s || s.total === 0) return 1 // jamais vu → 2ème priorité
  const acc = s.ok / s.total
  if (acc < 0.5) return 0  // en difficulté → 1ère priorité
  if (acc < 0.8) return 2  // en progression → 3ème
  return 3                  // maîtrisée → dernière
}

/**
 * Tri "smart v2" basé sur SM-2.
 * Buckets, du plus prioritaire au moins prioritaire :
 *   0 — overdue (next_review_at < now)
 *   1 — jamais vu (pas d'entrée SM-2)
 *   2 — due dans les 24h
 *   3 — bien apprise (pas due avant 24h)
 * Les leeches et suspendues sont exclues.
 * À l'intérieur d'un bucket, tri par overdue desc.
 */
function smartBucket(q: Question, sm2: Map<string, Sm2Row>, now: number): number {
  const row = sm2.get(q.id)
  if (!row) return 1
  if (!row.next_review_at) return 1
  const due = new Date(row.next_review_at).getTime()
  if (due <= now) return 0
  if (due - now <= 86_400_000) return 2
  return 3
}

function QuizInner() {
  const { moduleId } = useParams() as { moduleId: string }
  const searchParams = useSearchParams()
  const router = useRouter()

  const courseId = searchParams.get('courseId') ?? null
  const mode = searchParams.get('mode') ?? 'normal' // 'normal' | 'smart' | 'errors'
  const lesson = parseInt(searchParams.get('lesson') ?? '0', 10)

  const LESSON_SIZE = 10

  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [totalLessons, setTotalLessons] = useState(1)
  const [attemptStats, setAttemptStats] = useState<Map<string, { ok: number; total: number }>>(new Map())
  const [userId, setUserId] = useState<string | null>(null)
  const [petType, setPetType] = useState<string>('cat')
  const [loading, setLoading] = useState(true)
  const { data: appData } = useAppData()

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

      const supaAny = supabase as any
      Promise.all([
        q.order('created_at'),
        supabase.from('quiz_attempts').select('question_id,is_correct,created_at').eq('user_id', user.id).eq('module_id', moduleId as ModuleId).order('created_at', { ascending: true }),
        supaAny.from('quiz_question_progress')
          .select('question_id,next_review_at,is_leech,is_suspended,reps')
          .eq('user_id', user.id),
      ]).then(([{ data: qs }, { data: atts }, sm2Res]) => {
        const sm2Map = new Map<string, Sm2Row>()
        for (const row of ((sm2Res as any).data ?? []) as Sm2Row[]) {
          sm2Map.set(row.question_id, row)
        }
        // Normalise each row: parse choices if it came back as a string,
        // and ensure `type` is uppercase so the renderers match.
        const raw = (qs ?? []).map((row: Question) => ({
          ...row,
          choices: typeof row.choices === 'string' ? JSON.parse(row.choices) : row.choices,
          type: row.type ? ((row.type as string).toUpperCase() as QType) : undefined,
        }))
        const stats = new Map<string, { ok: number; total: number }>()
        // Track the most recent attempt per question (atts is ordered asc, so last wins)
        const lastAttempt = new Map<string, boolean>()
        for (const a of atts ?? [] as AttemptStat[]) {
          const s = stats.get(a.question_id) ?? { ok: 0, total: 0 }
          stats.set(a.question_id, { ok: s.ok + (a.is_correct ? 1 : 0), total: s.total + 1 })
          lastAttempt.set(a.question_id, a.is_correct)
        }
        setAttemptStats(stats)

        let sorted = raw
        if (mode === 'errors') {
          // ONLY questions where the most recent attempt was wrong
          sorted = raw.filter(q => {
            const last = lastAttempt.get(q.id)
            return last !== undefined && last === false
          })
          setQuestions(sorted)
        } else if (mode === 'module') {
          // All module questions, smart-sorted, capped at 50
          sorted = [...raw].sort((a, b) => smartSort(a, stats) - smartSort(b, stats))
          setQuestions(sorted.slice(0, 50))
        } else if (mode === 'smart') {
          // Smart v2 : priorise les questions dues (SM-2), puis jamais vues, puis proches.
          // Exclut leeches/suspendues (elles vont dans /mes-erreurs).
          const now = Date.now()
          const eligible = raw.filter(q => {
            const row = sm2Map.get(q.id)
            return !row || (!row.is_leech && !row.is_suspended)
          })
          const overdue = eligible
            .filter(q => smartBucket(q, sm2Map, now) === 0)
            .sort((a, b) => {
              const da = new Date(sm2Map.get(a.id)!.next_review_at!).getTime()
              const db = new Date(sm2Map.get(b.id)!.next_review_at!).getTime()
              return da - db   // le plus en retard d'abord
            })
          const unseen = eligible.filter(q => smartBucket(q, sm2Map, now) === 1)
          const dueSoon = eligible.filter(q => smartBucket(q, sm2Map, now) === 2)
          const mastered = eligible.filter(q => smartBucket(q, sm2Map, now) === 3)
          sorted = [
            ...overdue,
            ...unseen.slice(0, Math.max(5, 20 - overdue.length)),
            ...dueSoon.slice(0, 5),
            ...mastered.slice(0, 2),
          ].slice(0, 20)
          setQuestions(sorted)
        } else {
          const total = Math.ceil(sorted.length / LESSON_SIZE)
          setTotalLessons(total || 1)
          setQuestions(sorted.slice(lesson * LESSON_SIZE, (lesson + 1) * LESSON_SIZE))
        }
        setLoading(false)
      })
    })
  }, [moduleId, courseId, mode, lesson, mod, router])

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

  const globalXp = computeXP(appData?.attempts ?? []) + (appData?.flashXpBonus ?? 0)
  const petLevel = xpToLevel(globalXp)

  const nextLessonHref = mode !== 'smart' && lesson + 1 < totalLessons
    ? `/quiz/${moduleId}?${courseId ? `courseId=${courseId}&` : ''}lesson=${lesson + 1}`
    : undefined

  return (
    <QuizClient
      questions={questions}
      moduleId={moduleId}
      userId={userId!}
      mode={(mode === 'errors' || mode === 'module' ? 'smart' : mode) as 'normal' | 'smart'}
      attemptStats={attemptStats}
      petType={petType as 'cat' | 'dog' | 'bunny'}
      level={petLevel}
      backHref={`/library`}
      headerLabel={mode === 'errors' ? 'Mes erreurs' : mode === 'module' ? 'Quiz du module' : mode === 'smart' ? 'Quiz intelligent' : `Leçon ${lesson + 1}/${totalLessons}`}
    />
  )
}

export default function QuizPage() {
  return <Suspense><QuizInner /></Suspense>
}
