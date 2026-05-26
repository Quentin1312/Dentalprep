'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MODULES, type Module } from '@/lib/modules'
import type { ModuleId } from '@/types/database'
import { useThemeBg, themeBgStyle, THEMES } from '@/lib/theme-bg'
import { PathSystemStyles, SectionLabel, shade } from '@/components/ui/PathSystem'
import { quizCompletionCount, quizCompletionPct } from '@/lib/quiz-progress'

type Attempt = { module_id: string; is_correct: boolean; created_at: string; question_id: string }
type Question = { id: string; module_id: string; course_id: string }
type Session = { date: string; minutes_studied: number }

const MODULE_ACCENT: Record<ModuleId, string> = {
  M1: '#0A66E0', M2: '#0D9488', M3: '#7C3AED',
  M4: '#E11D48', M5: '#D97706', M6: '#5B21B6',
}

export default function StatsPage() {
  const router = useRouter()
  const [themeId] = useThemeBg()
  const theme = THEMES[themeId]
  const [streak, setStreak] = useState(0)
  const [examDate, setExamDate] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [today] = useState(() => new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      Promise.all([
        supabase.from('profiles').select('streak,exam_date').eq('id', user.id).single(),
        supabase.from('quiz_attempts').select('module_id,is_correct,created_at,question_id').eq('user_id', user.id),
        supabase.from('daily_sessions').select('date,minutes_studied').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
        supabase.from('quiz_questions').select('id,module_id,course_id').eq('user_id', user.id),
      ]).then(([p, a, s, q]) => {
        setStreak(p.data?.streak ?? 0)
        setExamDate(p.data?.exam_date ?? null)
        setAttempts((a.data ?? []) as Attempt[])
        setSessions((s.data ?? []) as Session[])
        setQuestions((q.data ?? []) as Question[])
        setLoading(false)
      })
    })
  }, [router])

  // Unique-question metric: a question counts as correct if answered correctly at least once
  const uniqueAttempted = new Set(attempts.map(a => a.question_id))
  const uniqueCorrect = new Set(attempts.filter(a => a.is_correct).map(a => a.question_id))
  const totalOk = uniqueCorrect.size
  const totalBad = uniqueAttempted.size - uniqueCorrect.size
  const accuracy = uniqueAttempted.size > 0 ? Math.round((totalOk / uniqueAttempted.size) * 100) : 0

  const moduleStats = MODULES.map(m => {
    const moduleQuestions = questions.filter(q => q.module_id === m.id)
    const completion = quizCompletionCount(moduleQuestions, attempts)
    const pct = quizCompletionPct(moduleQuestions, attempts)
    return { ...m, pct, doneQuestions: completion.done, totalQuestions: completion.total, accent: MODULE_ACCENT[m.id] }
  })

  // Build the week chart (oldest → newest = today)
  function localDateKey(date: Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const dayLetters = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const sessionByDate = new Map(sessions.map(s => [s.date, s.minutes_studied]))
  const monday = new Date(today)
  const dayIndex = (today.getDay() + 6) % 7
  monday.setDate(today.getDate() - dayIndex)
  monday.setHours(12, 0, 0, 0)
  const week = dayLetters.map((d, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const key = localDateKey(date)
    return { d, min: sessionByDate.get(key) ?? 0, today: key === localDateKey(today) }
  })
  const weekTotal = week.reduce((s, w) => s + w.min, 0)

  // Days until exam
  const daysToExam = (() => {
    if (!examDate) return null
    const t = new Date(examDate).getTime()
    if (isNaN(t)) return null
    const diff = Math.round((t - today.getTime()) / 86400000)
    return diff >= 0 ? diff : null
  })()

  if (loading) {
    return (
      <div style={{
        minHeight: '100%', ...themeBgStyle(themeId),
        fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
        paddingBottom: 120,
      }}>
        <PathSystemStyles />
        <div style={{ padding: '54px 16px 6px' }}>
          <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Tes progrès</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, color: theme.text, marginTop: 1 }}>Statistiques</div>
        </div>
        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[160, 80, 180, 100, 180].map((h, i) => (
            <div key={i} style={{
              height: h, borderRadius: 18,
              background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)',
              backgroundSize: '200% 100%', animation: 'dp-shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100%', ...themeBgStyle(themeId),
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      paddingBottom: 120,
    }}>
      <PathSystemStyles />

      <div style={{ padding: '54px 16px 6px' }}>
        <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Tes progrès</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, color: theme.text, marginTop: 1 }}>Statistiques</div>
      </div>

      {/* Streak card */}
      <StreakCard streak={streak} weekMinutes={weekTotal} />

      {/* Exam countdown */}
      {daysToExam !== null && examDate && (
        <ExamCountdown days={daysToExam} examDate={examDate} />
      )}

      {/* Weekly chart */}
      <WeeklyChart days={week} total={weekTotal} />

      {/* Accuracy + question count */}
      <AccuracyRow accuracy={accuracy} totalOk={totalOk} totalBad={totalBad} />

      {/* Per-module mastery */}
      <ModuleMastery modules={moduleStats} />

      {uniqueAttempted.size === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>
            Fais tes premiers quiz pour voir tes statistiques ici.
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function StreakCard({ streak, weekMinutes }: { streak: number; weekMinutes: number }) {
  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div style={{
        position: 'relative',
        borderRadius: 22,
        background: 'linear-gradient(135deg, #FF8A4C 0%, #E0533C 100%)',
        padding: '18px 18px 16px',
        color: '#fff',
        overflow: 'hidden',
        boxShadow: '0 14px 30px -12px rgba(224,83,60,0.45), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 0 rgba(139,42,30,0.25)',
      }}>
        <div style={{
          position: 'absolute', right: -8, bottom: -16,
          fontSize: 120, lineHeight: 1, opacity: 0.45, transform: 'rotate(-8deg)',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.20))',
        }}>🔥</div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 9px', borderRadius: 999,
          background: 'rgba(255,255,255,0.20)',
          border: '1px solid rgba(255,255,255,0.25)',
          fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 3, background: '#fff' }} />
          Régularité
        </div>

        <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{
            fontSize: 56, fontWeight: 900, letterSpacing: -2, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}>{streak}</div>
          <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9, marginBottom: 4 }}>
            jour{streak > 1 ? 's' : ''} d&apos;affilée
          </div>
        </div>
        <div style={{
          fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: 600,
          maxWidth: '60%',
        }}>
          {weekMinutes > 0 ? (
            <><span style={{ fontWeight: 800 }}>{weekMinutes} min</span> cette semaine — continue !</>
          ) : (
            <>Commence ton premier quiz pour démarrer le streak.</>
          )}
        </div>
      </div>
    </div>
  )
}

function ExamCountdown({ days, examDate }: { days: number; examDate: string }) {
  const formatted = (() => {
    try {
      return new Date(examDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch { return examDate }
  })()
  return (
    <div style={{ padding: '14px 16px 0' }}>
      <div style={{
        background: '#fff', border: `1px solid #E4E8EE`, borderRadius: 18,
        padding: '14px 16px',
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.15)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: '#FCE8E8', color: '#DC2626',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.05), 0 2px 6px rgba(220,38,38,0.18)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 10.5, color: '#5A6675', fontWeight: 800,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>Examen CNQAOS</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
            <div style={{
              fontSize: 22, fontWeight: 900, color: '#0F1B2D', letterSpacing: -0.7,
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>J−{days}</div>
            <div style={{ fontSize: 12.5, color: '#5A6675', fontWeight: 600 }}>{formatted}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WeeklyChart({ days, total }: { days: { d: string; min: number; today: boolean }[]; total: number }) {
  const max = Math.max(...days.map(d => d.min), 1)
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <SectionLabel right={`${total} min`}>Cette semaine</SectionLabel>
      <div style={{
        background: '#fff', border: `1px solid #E4E8EE`, borderRadius: 18,
        padding: '16px 16px 14px',
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.15)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          height: 132, gap: 8,
        }}>
          {days.map((d, i) => {
            const isToday = d.today
            const isEmpty = d.min === 0
            const barH = Math.max(8, (d.min / max) * 110)
            return (
              <div key={i} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
              }}>
                {isToday && d.min > 0 && (
                  <div style={{
                    fontSize: 10.5, fontWeight: 900, color: '#0A66E0',
                    fontVariantNumeric: 'tabular-nums',
                    background: '#E6EFFC', padding: '2px 6px', borderRadius: 6,
                    boxShadow: '0 2px 4px rgba(10,102,224,0.20)',
                  }}>{d.min}m</div>
                )}
                <div style={{
                  width: '100%', height: barH, borderRadius: 8,
                  background: isEmpty
                    ? '#EEF1F5'
                    : isToday
                      ? 'linear-gradient(180deg, #1D7AF0 0%, #0A66E0 100%)'
                      : 'linear-gradient(180deg, #BFD5F5 0%, #94B6E8 100%)',
                  boxShadow: isEmpty
                    ? 'inset 0 1px 1px rgba(15,27,45,0.06)'
                    : isToday
                      ? 'inset 0 -3px 0 rgba(8,80,181,0.45), inset 0 1px 0 rgba(255,255,255,0.30), 0 4px 10px -4px rgba(10,102,224,0.45)'
                      : 'inset 0 -2px 0 rgba(15,27,45,0.10), inset 0 1px 0 rgba(255,255,255,0.30)',
                }} />
                <div style={{
                  fontSize: 11, fontWeight: isToday ? 800 : 600,
                  color: isToday ? '#0A66E0' : '#5A6675',
                  letterSpacing: 0.4,
                }}>{d.d}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AccuracyRow({ accuracy, totalOk, totalBad }: { accuracy: number; totalOk: number; totalBad: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const color = accuracy >= 80 ? '#16A34A' : accuracy >= 60 ? '#0A66E0' : accuracy >= 40 ? '#D97706' : '#DC2626'
  const total = totalOk + totalBad

  return (
    <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8 }}>
      {/* Accuracy ring */}
      <div style={{
        flex: 1, background: '#fff', border: `1px solid #E4E8EE`, borderRadius: 18,
        padding: '14px 14px 12px',
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.15)',
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 800, color: '#5A6675',
          letterSpacing: 0.6, textTransform: 'uppercase',
        }}>Précision</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <div style={{ position: 'relative', width: 70, height: 70, flexShrink: 0 }}>
            <svg width="70" height="70" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r={r} fill="none" stroke="#EEF1F5" strokeWidth="9" />
              <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${(accuracy / 100) * circ} ${circ}`} />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, color, letterSpacing: -0.5,
              fontVariantNumeric: 'tabular-nums',
            }}>{accuracy}%</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#5A6675' }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: '#16A34A' }} />
              <span style={{ color: '#0F1B2D', fontVariantNumeric: 'tabular-nums' }}>{totalOk}</span> bonnes
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#5A6675' }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: '#DC2626' }} />
              <span style={{ color: '#0F1B2D', fontVariantNumeric: 'tabular-nums' }}>{totalBad}</span> erreurs
            </div>
          </div>
        </div>
      </div>

      {/* Total */}
      <div style={{
        flex: 1, background: '#fff', border: `1px solid #E4E8EE`, borderRadius: 18,
        padding: '14px 14px 12px',
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.15)',
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 800, color: '#5A6675',
          letterSpacing: 0.6, textTransform: 'uppercase',
        }}>Questions</div>
        <div style={{
          fontSize: 36, fontWeight: 900, color: '#0F1B2D', letterSpacing: -1.5,
          marginTop: 6, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>{total}</div>
        <div style={{
          fontSize: 11.5, color: '#5A6675', marginTop: 4, fontWeight: 600,
        }}>tentées au total</div>
      </div>
    </div>
  )
}

function ModuleMastery({ modules }: { modules: Array<Module & { pct: number; doneQuestions: number; totalQuestions: number; accent: string }> }) {
  return (
    <div style={{ padding: '14px 16px 0' }}>
      <SectionLabel>Progression par module</SectionLabel>
      <div style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden',
        border: `1px solid #E4E8EE`,
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.15)',
      }}>
        {modules.map((m, i) => {
          const notStarted = m.totalQuestions === 0
          const statusColor = notStarted ? '#8A95A5' : m.pct >= 100 ? '#16A34A' : m.pct >= 50 ? '#0A66E0' : '#D97706'
          const isLast = i === modules.length - 1
          return (
            <div key={m.id} style={{
              padding: '12px 14px',
              borderBottom: isLast ? 'none' : `1px solid #E4E8EE`,
              opacity: notStarted ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: notStarted ? 0 : 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: notStarted
                    ? '#E4E8EE'
                    : `linear-gradient(135deg, ${m.accent} 0%, ${shade(m.accent, -20)} 100%)`,
                  color: notStarted ? '#8A95A5' : '#fff', fontSize: 10.5, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  letterSpacing: 0.3, flexShrink: 0,
                  boxShadow: notStarted ? 'none' : `inset 0 -1px 0 rgba(0,0,0,0.10), 0 2px 4px ${m.accent}55`,
                }}>{m.id}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13.5, fontWeight: 700, color: '#0F1B2D',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{m.label}</div>
                  <div style={{ fontSize: 10.5, color: '#5A6675', fontWeight: 600, marginTop: 1 }}>
                    {notStarted ? 'Pas encore commencé' : `${m.doneQuestions}/${m.totalQuestions} questions validées`}
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 800, color: statusColor,
                  fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
                }}>{m.pct}%</div>
              </div>
              <div style={{
                height: 8, background: '#EEF1F5', borderRadius: 5, overflow: 'hidden',
                boxShadow: 'inset 0 1px 1px rgba(15,27,45,0.06)',
              }}>
                <div style={{
                  width: `${m.pct}%`, height: '100%',
                  background: `linear-gradient(90deg, ${statusColor} 0%, ${shade(statusColor, 20)} 100%)`,
                  borderRadius: 5,
                  boxShadow: m.pct > 0 ? `0 0 6px ${statusColor}55` : 'none',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
