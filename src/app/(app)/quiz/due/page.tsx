'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import QuizClient from '../[moduleId]/QuizClient'
import { A } from '@/lib/theme'
import type { ModuleId } from '@/types/database'
import { useAppData } from '@/lib/app-context'
import { computeXP, xpToLevel } from '@/lib/xp'

type QType = 'QCM' | 'VF' | 'ORDRE' | 'ASSOCIATION'
type Question = {
  id: string
  type?: QType
  question: string
  choices: unknown
  correct_index: number
  explanation: string
  module_id: string
  course_id: string
  page_image_url?: string | null
}

// Cap session size — au-delà l'élève abandonne. Anki recommande 20-30/jour.
const DUE_SESSION_CAP = 20

function Skel({ h }: { h: number }) {
  return <div style={{
    height: h, borderRadius: 14,
    background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
  }} />
}

export default function QuizDuePage() {
  const router = useRouter()
  const { data: appData } = useAppData()
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [attemptStats, setAttemptStats] = useState<Map<string, { ok: number; total: number }>>(new Map())
  const [userId, setUserId] = useState<string | null>(null)
  const [petType, setPetType] = useState<'cat' | 'dog' | 'bunny'>('cat')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const supaAny = supabase as any

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)

      Promise.all([
        supabase.from('profiles').select('pet_type').eq('id', user.id).single(),
        // Toutes les questions dues, non suspendues, par retard décroissant
        supaAny.from('quiz_question_progress')
          .select('question_id,next_review_at')
          .eq('user_id', user.id)
          .eq('is_suspended', false)
          .lte('next_review_at', new Date().toISOString())
          .order('next_review_at', { ascending: true })
          .limit(DUE_SESSION_CAP),
        supabase.from('quiz_attempts')
          .select('question_id,is_correct')
          .eq('user_id', user.id),
      ]).then(async ([profRes, dueRes, attsRes]) => {
        if (profRes.data?.pet_type) setPetType(profRes.data.pet_type as 'cat' | 'dog' | 'bunny')

        const dueIds: string[] = ((dueRes as any).data ?? []).map((r: { question_id: string }) => r.question_id)
        if (dueIds.length === 0) {
          setQuestions([])
          setLoading(false)
          return
        }

        const { data: qs } = await supabase
          .from('quiz_questions').select('*').in('id', dueIds)

        // Préserve l'ordre par overdue (dueRes est déjà trié)
        const byId = new Map<string, Question>()
        for (const row of (qs ?? []) as Question[]) {
          byId.set(row.id, {
            ...row,
            choices: typeof row.choices === 'string' ? JSON.parse(row.choices as unknown as string) : row.choices,
            type: row.type ? ((row.type as string).toUpperCase() as QType) : undefined,
          })
        }
        const ordered = dueIds.map(id => byId.get(id)).filter((q): q is Question => !!q)

        const stats = new Map<string, { ok: number; total: number }>()
        for (const a of (attsRes.data ?? []) as { question_id: string; is_correct: boolean }[]) {
          const s = stats.get(a.question_id) ?? { ok: 0, total: 0 }
          stats.set(a.question_id, { ok: s.ok + (a.is_correct ? 1 : 0), total: s.total + 1 })
        }

        setAttemptStats(stats)
        setQuestions(ordered)
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
        <Skel h={120} /><Skel h={64} /><Skel h={64} /><Skel h={64} />
      </div>
    </div>
  )

  if (!questions?.length) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: A.text, marginBottom: 8 }}>Aucune révision en attente</div>
      <div style={{ fontSize: 14, color: A.textMuted, maxWidth: 280 }}>
        Tu es à jour ! Reviens plus tard ou attaque un nouveau module.
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

  // Module dominant pour le routage de QuizClient (header / back). La pédagogie
  // reste multi-module : chaque question conserve son propre module_id.
  const dominantModule = (questions[0].module_id as ModuleId) ?? 'M1'
  const globalXp = computeXP(appData?.attempts ?? []) + (appData?.flashXpBonus ?? 0)
  const petLevel = xpToLevel(globalXp)

  return (
    <QuizClient
      questions={questions}
      moduleId={dominantModule}
      userId={userId!}
      mode="smart"
      attemptStats={attemptStats}
      petType={petType}
      level={petLevel}
      backHref="/dashboard"
      headerLabel="Révisions du jour"
    />
  )
}
