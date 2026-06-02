'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import { useThemeBg, themeBgStyle } from '@/lib/theme-bg'
import Icon from '@/components/ui/Icon'

type Exercise = { id: string; n: number; title: string; category: string }
type Attempt = { exercise_id: string; score: number; created_at: string }

const LESSON_SIZE = 5

export default function LessonSummaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonKey = searchParams?.get('lesson') ?? null
  const [themeId] = useThemeBg()

  const [exos, setExos] = useState<Exercise[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonKey) { router.replace('/practice'); return }
    const dash = lessonKey.lastIndexOf('-')
    const category = lessonKey.slice(0, dash)
    const lessonIdx = parseInt(lessonKey.slice(dash + 1), 10)
    const startN = lessonIdx * LESSON_SIZE + 1
    const endN = startN + LESSON_SIZE - 1

    const supabase = createClient() as any
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      Promise.all([
        supabase.from('practical_exercises')
          .select('id,n,title,category')
          .eq('user_id', user.id).eq('category', category)
          .gte('n', startN).lte('n', endN).order('n'),
        supabase.from('practical_attempts')
          .select('exercise_id,score,created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }),
      ]).then(([exRes, atRes]: any) => {
        setExos(exRes.data ?? [])
        setAttempts(atRes.data ?? [])
        setLoading(false)
      })
    })
  }, [lessonKey, router])

  const enriched = useMemo(() => {
    return exos.map(e => {
      const xs = attempts.filter(a => a.exercise_id === e.id)
      const best = xs.length > 0 ? Math.max(...xs.map(a => a.score)) : null
      return { ...e, score: best }
    })
  }, [exos, attempts])

  const completedCount = enriched.filter(e => (e.score ?? 0) >= 1).length
  const totalCount = enriched.length
  const failedExos = enriched.filter(e => e.score !== null && e.score < 1)
  const allPerfect = completedCount === totalCount && totalCount > 0

  const lessonIdx = lessonKey ? parseInt(lessonKey.slice(lessonKey.lastIndexOf('-') + 1), 10) : 0
  const lessonNumber = lessonIdx + 1

  if (loading) return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${A.primary}`, borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', ...themeBgStyle(themeId), fontFamily: A.font, paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 16px 16px', textAlign: 'center' }}>
        {/* Médaille */}
        <div style={{
          width: 96, height: 96, borderRadius: 32,
          background: allPerfect
            ? `linear-gradient(135deg, #16A34A 0%, #0E8C3E 100%)`
            : `linear-gradient(135deg, ${A.primary} 0%, #0850B8 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
        }}>
          <Icon name={allPerfect ? 'check' : 'target'} size={48} color="#fff" strokeWidth={2.4} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: A.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          Récap exercice {lessonNumber}
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: A.text, marginTop: 4, letterSpacing: -0.6 }}>
          {allPerfect ? 'Sans-faute !' : 'Exercice terminé'}
        </div>
        <div style={{ fontSize: 14, color: A.textMuted, marginTop: 6 }}>
          {completedCount} <span style={{ color: A.text, fontWeight: 700 }}>/ {totalCount}</span> cas validés à 100%
        </div>
      </div>

      {/* Liste des 5 cas avec score */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 12px' }}>
        <div style={{
          background: '#fff', borderRadius: 16,
          border: `1px solid ${A.border}`, overflow: 'hidden',
        }}>
          {enriched.map((e, i) => {
            const isDone = (e.score ?? 0) >= 1
            const isStarted = e.score !== null && !isDone
            const color = isDone ? '#16A34A' : isStarted ? '#D97706' : A.textMuted
            const bg    = isDone ? '#DCFCE7' : isStarted ? '#FEF3C7' : '#F4F6FA'
            return (
              <Link key={e.id} href={`/practice/${e.id}?lesson=${lessonKey}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  borderTop: i > 0 ? `1px solid ${A.border}` : 'none',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900, color,
                    flexShrink: 0,
                  }}>
                    {isDone ? '✓' : isStarted ? '!' : e.n}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700, color: A.text,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {e.title}
                    </div>
                    <div style={{
                      fontSize: 11, color, fontWeight: 700, marginTop: 2,
                    }}>
                      {e.score === null ? 'Non tenté' : `${Math.round(e.score * 100)}%`}
                    </div>
                  </div>
                  <Icon name="chevronR" size={16} color={A.textMuted} />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Boutons */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 12px' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/practice" style={{ flex: 1, textDecoration: 'none' }}>
            <button style={{
              width: '100%', height: 50, borderRadius: 14,
              background: '#fff', border: `1.5px solid ${A.primary}`,
              color: A.primary, fontSize: 15, fontWeight: 700, fontFamily: A.font, cursor: 'pointer',
            }}>
              Quitter
            </button>
          </Link>
          {failedExos.length > 0 && (
            <Link href={`/practice/${failedExos[0].id}?lesson=${lessonKey}`} style={{ flex: 1, textDecoration: 'none' }}>
              <button style={{
                width: '100%', height: 50, borderRadius: 14,
                background: A.primary, border: 'none',
                color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: A.font, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(10,102,224,0.28)',
              }}>
                Refaire {failedExos.length === 1 ? 'le cas raté' : `les ${failedExos.length} ratés`}
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
