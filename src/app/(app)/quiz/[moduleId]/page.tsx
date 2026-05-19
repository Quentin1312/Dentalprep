'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import QuizClient from './QuizClient'
import { MODULE_MAP } from '@/lib/modules'
import { A } from '@/lib/theme'
import type { ModuleId } from '@/types/database'

type Question = { id: string; question: string; choices: unknown; correct_index: number; explanation: string; module_id: string }

function Skel({ h }: { h: number }) {
  return <div style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

export default function QuizPage() {
  const { moduleId } = useParams() as { moduleId: string }
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const mod = MODULE_MAP[moduleId as ModuleId]

  useEffect(() => {
    if (!mod) { router.replace('/dashboard'); return }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      supabase.from('quiz_questions').select('*').eq('user_id', user.id).eq('module_id', moduleId as ModuleId).order('created_at')
        .then(({ data }) => { setQuestions(data ?? []); setLoading(false) })
    })
  }, [moduleId, mod, router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, padding: '60px 20px 0' }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <Skel h={24} />
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skel h={120} /><Skel h={64} /><Skel h={64} /><Skel h={64} /><Skel h={64} />
      </div>
    </div>
  )

  if (!questions?.length) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: A.text, marginBottom: 8 }}>Aucune question</div>
      <div style={{ fontSize: 14, color: A.textMuted }}>Ajoutez des cours pour le module {mod?.label} pour générer un quiz.</div>
    </div>
  )

  return <QuizClient questions={questions} moduleId={moduleId} userId={userId!} />
}
