'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MODULES, BLOCS } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Profile = { full_name: string | null; exam_date: string | null; streak: number }
type Course = { id: string; module_id: string }
type Attempt = { module_id: string; is_correct: boolean }

function daysUntil(d: string | null) {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      Promise.all([
        supabase.from('profiles').select('full_name,exam_date,streak').eq('id', user.id).single(),
        supabase.from('courses').select('id,module_id').eq('user_id', user.id),
        supabase.from('quiz_attempts').select('module_id,is_correct').eq('user_id', user.id),
      ]).then(([p, c, a]) => {
        const prof = p.data
        // Redirect new users to setup if name not configured
        if (!prof?.full_name) { router.replace('/setup'); return }
        setProfile(prof)
        setCourses(c.data ?? [])
        setAttempts(a.data ?? [])
        setLoading(false)
      })
    })
  }, [router])

  const days = daysUntil(profile?.exam_date ?? null)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'toi'

  const moduleStats = MODULES.map(m => {
    const mAttempts = attempts.filter(a => a.module_id === m.id)
    const correct = mAttempts.filter(a => a.is_correct).length
    const quiz = mAttempts.length > 0 ? Math.round((correct / mAttempts.length) * 100) : null
    const hasCourses = courses.some(c => c.module_id === m.id)
    const status = !hasCourses ? 'empty' : quiz !== null && quiz >= 75 ? 'mastered' : quiz !== null ? 'weak' : 'empty'
    return { ...m, quiz, hasCourses, status, courseCount: courses.filter(c => c.module_id === m.id).length }
  })

  const masteredCount = moduleStats.filter(m => m.status === 'mastered').length
  const overallProgress = attempts.length > 0
    ? Math.round((attempts.filter(a => a.is_correct).length / attempts.length) * 100) : 0

  const byBloc = BLOCS.map(b => ({ ...b, mods: moduleStats.filter(m => m.bloc === b.n) }))

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 100 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ padding: '62px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>
              {loading ? <Skeleton w={80} h={13} /> : `Bonjour ${firstName}`}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>DentalPrep</div>
          </div>
          <Link href="/profile" style={{ width: 40, height: 40, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <Icon name="user" size={18} color={A.text} />
          </Link>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ padding: '20px 20px 0' }}>
        {loading ? (
          <div style={{ borderRadius: 20, height: 160, background: '#C8D8F5' }} />
        ) : (
          <Link href={profile?.exam_date ? '/profile' : '/setup'} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ background: `linear-gradient(135deg, ${A.primary} 0%, ${A.primaryDark} 100%)`, borderRadius: 20, padding: 18, color: '#fff', boxShadow: '0 10px 30px rgba(10,102,224,0.32)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, border: '20px solid rgba(255,255,255,0.07)', borderRadius: '50%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, opacity: 0.85, fontWeight: 500 }}>
                <Icon name="calendar" size={14} color="#fff" />
                {profile?.exam_date ? `Examen CNQAOS · ${new Date(profile.exam_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Examen CNQAOS'}
              </div>
              <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1, marginTop: 8 }}>
                {days !== null ? `J−${days}` : 'Configurer →'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>Progression globale</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{overallProgress}%</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, textAlign: 'right' }}>{masteredCount}/6 modules<br />maîtrisés</div>
              </div>
              <div style={{ marginTop: 10, height: 6, background: 'rgba(255,255,255,0.22)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${overallProgress}%`, height: '100%', background: '#fff', borderRadius: 6 }} />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Quick action */}
      <div style={{ padding: '14px 20px 0' }}>
        <Link href="/upload" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: A.surface, borderRadius: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}`, textDecoration: 'none' }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bolt" size={20} color={A.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: A.text }}>Ajouter un fascicule</div>
            <div style={{ fontSize: 12, color: A.textMuted }}>Scan → flashcards + quiz auto</div>
          </div>
          <Icon name="chevronR" size={16} color={A.textDim} />
        </Link>
      </div>

      {/* Blocs */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>Modules · 4 blocs</div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} style={{ borderRadius: 16, height: 72, background: A.surface, border: `0.5px solid ${A.border}` }} />)}
          </div>
        ) : byBloc.map(b => (
          <div key={b.n} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: A.textMuted, marginBottom: 8, paddingLeft: 2 }}>
              <span style={{ width: 18, height: 18, borderRadius: 6, background: A.text, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{b.n}</span>
              {b.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {b.mods.map(m => {
                const statusColor = m.status === 'mastered' ? A.green : m.status === 'weak' ? A.amber : A.textDim
                return (
                  <Link key={m.id} href={m.hasCourses ? `/module/${m.id}` : '/upload'} style={{ textDecoration: 'none' }}>
                    <div style={{ background: A.surface, borderRadius: 16, padding: 14, boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: m.status === 'mastered' ? A.greenSoft : m.status === 'weak' ? A.amberSoft : '#F1F3F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{m.id}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: statusColor, flexShrink: 0 }} />
                            <div style={{ fontSize: 15, fontWeight: 600, color: A.text, letterSpacing: -0.2 }}>{m.label}</div>
                          </div>
                          {!m.hasCourses ? (
                            <div style={{ fontSize: 12, color: A.primary, marginTop: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="plus" size={12} color={A.primary} /> Ajouter des cours
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: 12, color: A.textMuted, marginTop: 4 }}>
                                {m.courseCount} cours{m.quiz !== null && ` · Quiz ${m.quiz}%`}
                              </div>
                              {m.quiz !== null && (
                                <div style={{ marginTop: 8, height: 4, background: '#E9ECF2', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ width: `${m.quiz}%`, height: '100%', background: statusColor, borderRadius: 4 }} />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <Icon name="chevronR" size={14} color={A.textDim} style={{ marginTop: 11, flexShrink: 0 }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Link href="/upload" style={{ position: 'fixed', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28, background: A.text, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(15,27,45,0.35)', zIndex: 25, textDecoration: 'none' }}>
        <Icon name="plus" size={22} color="#fff" strokeWidth={2.2} />
      </Link>
    </div>
  )
}
