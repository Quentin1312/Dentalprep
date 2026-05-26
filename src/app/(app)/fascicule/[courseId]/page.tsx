'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FASCICULES, MODULE_MAP } from '@/lib/modules'
import { useAppData } from '@/lib/app-context'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'

type Stats = { flashcards: number; questions: number; attempts: number; accuracy: number | null; toReview: number }

function fasciculeN(title: string): number | null {
  const m = title.match(/Fascicule\s+(\d+)/i)
  return m ? parseInt(m[1]) : null
}

function FasciculeInner() {
  const { courseId } = useParams() as { courseId: string }
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: appData, refresh } = useAppData()

  // The "viewing module" — set when navigating from a specific module path in the library.
  // Falls back to the course's stored module_id. This lets fascicule pages show module-specific
  // counts even though one course can be shared across multiple modules.
  const viewModuleId = (searchParams.get('module') as ModuleId | null) ?? null

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const course = appData?.courses.find(c => c.id === courseId)
  const fN = course ? fasciculeN(course.title) : null
  const fascicule = fN !== null ? FASCICULES.find(f => f.n === fN) : null
  // Prefer URL module (so M2/M3/M4 views show their own data); fall back to course's stored module
  const modId = viewModuleId ?? (course?.module_id as ModuleId | undefined)
  const mod = modId ? MODULE_MAP[modId] : null

  useEffect(() => {
    if (!modId) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      Promise.all([
        // Filter by both course AND module so each module shows only its own slice
        supabase.from('flashcards').select('id').eq('course_id', courseId).eq('module_id', modId),
        supabase.from('quiz_questions').select('id').eq('course_id', courseId).eq('module_id', modId),
      ]).then(async ([fc, qq]) => {
        const qids = (qq.data ?? []).map((q: { id: string }) => q.id)
        let attempts: { question_id: string; is_correct: boolean }[] = []
        if (qids.length > 0) {
          const { data: atts } = await supabase.from('quiz_attempts').select('question_id,is_correct')
            .eq('user_id', user.id).in('question_id', qids).order('created_at', { ascending: true })
          attempts = atts ?? []
        }
        const ok = attempts.filter(a => a.is_correct).length

        // Track the most recent attempt per question (atts ordered asc, last wins)
        const lastAttempt = new Map<string, boolean>()
        for (const a of attempts) {
          lastAttempt.set(a.question_id, a.is_correct)
        }
        // "to review" = questions where last attempt was wrong
        const toReview = qids.filter(id => {
          const last = lastAttempt.get(id)
          return last !== undefined && last === false
        }).length

        setStats({
          flashcards: fc.data?.length ?? 0,
          questions: qq.data?.length ?? 0,
          attempts: attempts.length,
          accuracy: attempts.length > 0 ? Math.round((ok / attempts.length) * 100) : null,
          toReview,
        })
        setLoading(false)
      })
    })
  }, [courseId, modId, router])

  if (!course && appData) {
    router.replace('/library')
    return null
  }

  const toReview = stats?.toReview ?? 0

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Compact header */}
      <div style={{ padding: '54px 20px 0' }}>
        <Link href="/library" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: A.textMuted, fontWeight: 500, textDecoration: 'none', marginBottom: 12 }}>
          <Icon name="chevronL" size={13} color={A.textMuted} /> Bibliothèque
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: A.primarySoft, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: A.primary, letterSpacing: 0.4 }}>{mod?.id}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: A.primary, lineHeight: 1 }}>{fN}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: A.text, letterSpacing: -0.4, lineHeight: 1.2 }}>
              {fascicule?.title ?? course?.title ?? '…'}
            </div>
          </div>
        </div>
      </div>

      {/* Big action cards */}
      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Quiz complet — main action */}
        {mod && (
          <Link href={`/quiz/${mod.id}?courseId=${courseId}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: `linear-gradient(135deg, ${A.primary} 0%, #0850B8 100%)`,
              borderRadius: 18, padding: '20px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 10px 24px -6px rgba(10,102,224,0.45), inset 0 1px 0 rgba(255,255,255,0.20)',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.18)' }}>
                <Icon name="target" size={26} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>Quiz</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.78)', marginTop: 2, fontWeight: 600 }}>
                  {loading ? '…' : `${stats?.questions ?? 0} questions · QCM, V/F, ordre, association`}
                </div>
              </div>
              <Icon name="chevronR" size={18} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />
            </div>
          </Link>
        )}

        {/* Flashcards */}
        {mod && (
          <Link href={`/flashcards/${mod.id}?courseId=${courseId}&lesson=0`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: A.surface, borderRadius: 18, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              border: `1px solid ${A.border}`,
              boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.12)',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 13, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="cards" size={22} color={A.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: A.text, letterSpacing: -0.2 }}>Flashcards</div>
                <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2, fontWeight: 600 }}>
                  {loading ? '…' : `${stats?.flashcards ?? 0} carte${(stats?.flashcards ?? 0) > 1 ? 's' : ''}`}
                </div>
              </div>
              <Icon name="chevronR" size={16} color={A.textDim} strokeWidth={2.2} />
            </div>
          </Link>
        )}
      </div>

    </div>
  )
}

export default function FasciculePage() {
  return <Suspense><FasciculeInner /></Suspense>
}
