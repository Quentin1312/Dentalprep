'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MODULE_MAP, FASCICULES } from '@/lib/modules'
import { useAppData } from '@/lib/app-context'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'

type Course = { id: string; title: string; page_count: number | null }
type QuizQuestion = { id: string; course_id: string }

function fasciculeN(title: string): number | null {
  const m = title.match(/Fascicule\s+(\d+)/i)
  return m ? parseInt(m[1]) : null
}

function Skel({ h }: { h: number }) {
  return <div style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

export default function ModulePage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { data: appData, refresh } = useAppData()

  const [courses, setCourses] = useState<Course[]>([])
  const [flashcardCount, setFlashcardCount] = useState(0)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [toReviewCount, setToReviewCount] = useState(0)
  const [courseProgress, setCourseProgress] = useState<Map<string, { total: number; attempted: number }>>(new Map())
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const mod = MODULE_MAP[id as ModuleId]
  const mFascicules = FASCICULES.filter(f => f.modules.includes(id as ModuleId))

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }
    const mid = id as ModuleId

    const [{ data: c }, { data: f }, { data: a }, { data: qq }, { data: atts }] = await Promise.all([
      supabase.from('courses').select('id,title,page_count').eq('user_id', user.id).eq('module_id', mid).order('created_at', { ascending: false }),
      supabase.from('flashcards').select('id').eq('user_id', user.id).eq('module_id', mid),
      supabase.from('quiz_attempts').select('is_correct').eq('user_id', user.id).eq('module_id', mid),
      supabase.from('quiz_questions').select('id,course_id').eq('user_id', user.id).eq('module_id', mid),
      supabase.from('quiz_attempts').select('question_id,is_correct').eq('user_id', user.id).eq('module_id', mid),
    ])

    setCourses(c ?? [])
    setFlashcardCount(f?.length ?? 0)
    const att = a ?? []
    setTotalAttempts(att.length)
    setAccuracy(att.length > 0 ? Math.round((att.filter(x => x.is_correct).length / att.length) * 100) : null)

    // Calcul des questions à revoir (accuracy < 60%)
    const statsByQ = new Map<string, { ok: number; total: number }>()
    for (const at of atts ?? []) {
      const s = statsByQ.get(at.question_id) ?? { ok: 0, total: 0 }
      statsByQ.set(at.question_id, { ok: s.ok + (at.is_correct ? 1 : 0), total: s.total + 1 })
    }
    const qqData = (qq ?? []) as QuizQuestion[]
    const toReview = qqData.filter(q => {
      const s = statsByQ.get(q.id)
      return !s || s.total === 0 || s.ok / s.total < 0.6
    }).length
    setToReviewCount(toReview)

    // Calcul progression leçons par cours
    const questionToCourse = new Map(qqData.map(q => [q.id, q.course_id]))
    const qCountByCourse = new Map<string, number>()
    for (const q of qqData) qCountByCourse.set(q.course_id, (qCountByCourse.get(q.course_id) ?? 0) + 1)
    const attemptedByCourse = new Map<string, Set<string>>()
    for (const at of atts ?? []) {
      const cid = questionToCourse.get(at.question_id)
      if (!cid) continue
      const s = attemptedByCourse.get(cid) ?? new Set<string>()
      s.add(at.question_id)
      attemptedByCourse.set(cid, s)
    }
    const prog = new Map<string, { total: number; attempted: number }>()
    for (const [cid, total] of qCountByCourse) prog.set(cid, { total, attempted: attemptedByCourse.get(cid)?.size ?? 0 })
    setCourseProgress(prog)

    setLoading(false)
  }, [id, router])

  useEffect(() => {
    if (!mod) { router.replace('/dashboard'); return }
    load()
  }, [mod, load, router])

  async function deleteCourse(courseId: string) {
    if (!appData) return
    setDeletingId(courseId)
    const supabase = createClient()
    try {
      const { data: files } = await supabase.storage.from('course-images').list(`${appData.userId}/${courseId}`)
      if (files?.length) {
        await supabase.storage.from('course-images').remove(files.map(f => `${appData.userId}/${courseId}/${f.name}`))
      }
    } catch {}
    await supabase.from('courses').delete().eq('id', courseId)
    setCourses(prev => prev.filter(c => c.id !== courseId))
    setDeletingId(null)
    setConfirmId(null)
    refresh()
  }

  if (!mod) return null

  const r = (84 - 7) / 2
  const circ = 2 * Math.PI * r
  const accuracyColor = accuracy !== null && accuracy >= 75 ? A.green : accuracy !== null ? A.amber : A.border
  const scannedFascicules = mFascicules.filter(f => courses.some(c => fasciculeN(c.title) === f.n))
  const allScanned = scannedFascicules.length === mFascicules.length && mFascicules.length > 0

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 0 0 rgba(10,102,224,0.45)}50%{box-shadow:0 0 0 14px rgba(10,102,224,0)}}
      `}</style>

      <div style={{ padding: '62px 20px 0' }}>
        <Link href="/library" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.textMuted, fontWeight: 500, textDecoration: 'none', marginBottom: 16 }}>
          <Icon name="chevronL" size={14} color={A.textMuted} /> Bibliothèque
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: A.primary }}>{mod.id}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{mod.description}</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginTop: 2 }}>{mod.label}</div>
          </div>
        </div>
      </div>

      {/* Stats ring */}
      <div style={{ padding: '16px 20px 0' }}>
        {loading ? <Skel h={116} /> : (
          <div style={{ background: A.surface, borderRadius: 16, padding: 18, border: `0.5px solid ${A.border}`, boxShadow: '0 1px 3px rgba(15,27,45,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
              <svg width={84} height={84} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={42} cy={42} r={r} fill="none" stroke="#E9ECF2" strokeWidth={7} />
                <circle cx={42} cy={42} r={r} fill="none" stroke={accuracyColor} strokeWidth={7}
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - (accuracy ?? 0) / 100)}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: A.text }}>{accuracy !== null ? `${accuracy}%` : '—'}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: A.text, marginBottom: 4 }}>
                {accuracy === null ? 'Pas encore tenté' : accuracy >= 75 ? 'Module maîtrisé ✓' : 'En progression'}
              </div>
              <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 2 }}>{totalAttempts} questions tentées</div>
              <div style={{ fontSize: 12, color: A.textMuted }}>{flashcardCount} flashcards · {scannedFascicules.length}/{mFascicules.length} fascicules</div>
            </div>
          </div>
        )}
      </div>

      {/* Quiz intelligent — affiché si questions à revoir */}
      {!loading && toReviewCount > 0 && (
        <div style={{ padding: '12px 20px 0' }}>
          <Link href={`/quiz/${id}?mode=smart`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: `linear-gradient(135deg, ${A.amber} 0%, #B45309 100%)`, borderRadius: 16, boxShadow: '0 4px 14px rgba(180,83,9,0.28)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="refresh" size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Quiz intelligent</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                {toReviewCount} question{toReviewCount > 1 ? 's' : ''} à retravailler en priorité
              </div>
            </div>
            <Icon name="chevronR" size={16} color="rgba(255,255,255,0.7)" />
          </Link>
        </div>
      )}

      {/* Quiz complet si tout est scanné */}
      {!loading && allScanned && toReviewCount === 0 && (
        <div style={{ padding: '12px 20px 0' }}>
          <Link href={`/quiz/${id}?mode=smart`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: `linear-gradient(135deg, ${A.primary} 0%, #0850B8 100%)`, borderRadius: 16, boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="bolt" size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Quiz module complet</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Tous les fascicules · mode intelligent</div>
            </div>
            <Icon name="chevronR" size={16} color="rgba(255,255,255,0.7)" />
          </Link>
        </div>
      )}

      {/* Modes de révision */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>Révision</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href={`/flashcards/${id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: A.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${A.border}`, boxShadow: '0 1px 3px rgba(15,27,45,0.05)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon name="cards" size={20} color={A.primary} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 3 }}>Flashcards</div>
              <div style={{ fontSize: 11, color: A.textMuted }}>{loading ? '…' : `${flashcardCount} cartes`}</div>
            </div>
          </Link>
          <Link href={`/quiz/${id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: A.surface, borderRadius: 16, padding: 16, border: `0.5px solid ${A.border}`, boxShadow: '0 1px 3px rgba(15,27,45,0.05)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon name="target" size={20} color={A.primary} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 3 }}>Quiz QCM</div>
              <div style={{ fontSize: 11, color: A.textMuted }}>{loading ? '…' : accuracy !== null ? `${accuracy}% réussite` : 'Non tenté'}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Parcours */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 20 }}>Parcours</div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Skel h={72} /><Skel h={40} /><Skel h={72} /><Skel h={40} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {mFascicules.map((f, fi) => {
              const course = courses.find(c => fasciculeN(c.title) === f.n)
              const prog = course ? (courseProgress.get(course.id) ?? { total: 0, attempted: 0 }) : { total: 0, attempted: 0 }
              const totalLessons = prog.total > 0 ? Math.ceil(prog.total / 10) : 0
              const completedLessons = Math.floor(prog.attempted / 10)
              const allDone = totalLessons > 0 && completedLessons >= totalLessons
              const isCurrent = !allDone && !!course && totalLessons > 0
              const nextLesson = Math.min(completedLessons, Math.max(0, totalLessons - 1))

              const prevCourse = fi > 0 ? courses.find(c => fasciculeN(c.title) === mFascicules[fi - 1].n) : null
              const prevProg = prevCourse ? (courseProgress.get(prevCourse.id) ?? { total: 0, attempted: 0 }) : { total: 0, attempted: 0 }
              const prevDone = prevProg.total > 0 && Math.floor(prevProg.attempted / 10) >= Math.ceil(prevProg.total / 10)

              // Winding positions: 0 → droite → droite → 0 → gauche → gauche → 0 ...
              const xOffsets = [0, 64, 64, 0, -64, -64]
              const xOff = xOffsets[fi % xOffsets.length]
              const prevXOff = fi > 0 ? xOffsets[(fi - 1) % xOffsets.length] : 0

              const bg = allDone
                ? `linear-gradient(145deg, #16A34A 0%, #0E8C3E 100%)`
                : isCurrent
                  ? `linear-gradient(145deg, ${A.primary} 0%, #0850B8 100%)`
                  : '#EAECF0'

              return (
                <div key={f.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  {/* Connecteur */}
                  {fi > 0 && (
                    <div style={{
                      width: 4, height: 44, borderRadius: 2,
                      background: prevDone ? '#16A34A' : '#D1D5DB',
                      transform: `translateX(${(prevXOff + xOff) / 2}px)`,
                      marginBottom: 0,
                    }} />
                  )}
                  {/* Nœud */}
                  <div style={{ transform: `translateX(${xOff}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {course ? (
                      <Link href={`/quiz/${id}?courseId=${course.id}&lesson=${nextLesson}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          width: 76, height: 76, borderRadius: 38,
                          background: bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isCurrent
                            ? '0 0 0 6px rgba(10,102,224,0.15), 0 6px 24px rgba(10,102,224,0.35)'
                            : allDone
                              ? '0 4px 16px rgba(22,163,74,0.35)'
                              : '0 2px 8px rgba(0,0,0,0.1)',
                          animation: isCurrent ? 'pulse-glow 2.4s ease-in-out infinite' : 'none',
                          cursor: 'pointer',
                        }}>
                          {allDone
                            ? <Icon name="check" size={32} color="#fff" strokeWidth={2.5} />
                            : isCurrent
                              ? <Icon name="bolt" size={30} color="#fff" />
                              : <span style={{ fontSize: 20, fontWeight: 700, color: A.textMuted }}>{f.n}</span>
                          }
                        </div>
                      </Link>
                    ) : (
                      <Link href={`/upload?fascicule=${f.n}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          width: 76, height: 76, borderRadius: 38,
                          background: '#F3F4F6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `2.5px dashed #D1D5DB`,
                          cursor: 'pointer',
                        }}>
                          <Icon name="camera" size={28} color="#9CA3AF" />
                        </div>
                      </Link>
                    )}
                    {/* Label */}
                    <div style={{ marginTop: 10, textAlign: 'center', maxWidth: 130 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: A.text, lineHeight: 1.35 }}>{f.title}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 3,
                        color: allDone ? '#16A34A' : isCurrent ? A.primary : '#9CA3AF' }}>
                        {allDone ? '✓ Terminé' : course ? (totalLessons > 0 ? `${completedLessons}/${totalLessons} leçons` : 'Chargement…') : 'Non scanné'}
                      </div>
                      {/* Mini dots sous le label */}
                      {course && totalLessons > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 6 }}>
                          {Array.from({ length: totalLessons }).map((_, i) => (
                            <div key={i} style={{
                              width: i === (allDone ? totalLessons - 1 : completedLessons) ? 14 : 6,
                              height: 6, borderRadius: 3,
                              background: i < completedLessons ? '#16A34A' : i === completedLessons && !allDone ? A.primary : '#E5E7EB',
                              transition: 'all .3s',
                            }} />
                          ))}
                        </div>
                      )}
                      {/* Supprimer */}
                      {course && (
                        <div style={{ marginTop: 8 }}>
                          {confirmId === course.id ? (
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              <button onClick={() => setConfirmId(null)} style={{ padding: '3px 8px', borderRadius: 6, border: `0.5px solid ${A.border}`, background: A.bg, fontSize: 11, color: A.textMuted, cursor: 'pointer', fontFamily: A.font }}>✕</button>
                              <button onClick={() => deleteCourse(course.id)} disabled={deletingId === course.id} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', background: A.red, fontSize: 11, color: '#fff', cursor: 'pointer', fontFamily: A.font, opacity: deletingId === course.id ? 0.6 : 1 }}>
                                {deletingId === course.id ? '…' : 'Supprimer'}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmId(course.id)} style={{ fontSize: 10, color: '#D1D5DB', background: 'none', border: 'none', cursor: 'pointer', fontFamily: A.font }}>
                              supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
