'use client'

import Link from 'next/link'
import { useAppData } from '@/lib/app-context'
import { MODULES, FASCICULES } from '@/lib/modules'
import { A, PALETTE, RADIUS, SHADOW, sp, monoStyle, displayStyle, typeStyle } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import PetCompanion from '@/components/pet/PetCompanion'
import type { PetType } from '@/components/pet/PetCompanion'
import { computeXP, xpProgress } from '@/lib/xp'
import { quizCompletionPct, quizCompletionCount } from '@/lib/quiz-progress'
import { buildStudyPlan, planTotalMinutes } from '@/lib/study-plan'
import type { ModuleId } from '@/types/database'

function daysUntil(d: string | null) {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

// Mini circular progress ring
function Ring({ pct, size = 44, stroke = 4, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct / 100, 1) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E9ECF2" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  )
}

export default function DashboardPage() {
  const { data, loading } = useAppData()

  const profile = data?.profile ?? null
  const attempts = data?.attempts ?? []
  const todayMin = data?.todayMinutes ?? 0
  const goalMin = profile?.daily_goal_minutes ?? 10
  const streak = profile?.streak ?? 0
  const petType = (profile?.pet_type ?? 'cat') as PetType
  const goalDone = todayMin >= goalMin
  const goalPct = Math.min(100, Math.round((todayMin / goalMin) * 100))
  const xp = computeXP(attempts) + (data?.flashXpBonus ?? 0)
  const xpInfo = xpProgress(xp)

  const days = daysUntil(profile?.exam_date ?? null)
  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const questions = data?.questions ?? []
  const overallProgress = quizCompletionPct(questions, attempts)

  const courses = data?.courses ?? []

  function fasciculeN(title: string): number | null {
    const m = title.match(/Fascicule\s+(\d+)/i)
    return m ? parseInt(m[1]) : null
  }

  const moduleStats = MODULES.map(m => {
    const mFascicules = FASCICULES.filter(f => f.modules.includes(m.id))
    const uploadedFascicules = mFascicules.filter(f => courses.some(c => fasciculeN(c.title) === f.n)).length
    const moduleQuestions = questions.filter(q => q.module_id === m.id)
    const completion = quizCompletionCount(moduleQuestions, attempts)
    const pct = quizCompletionPct(moduleQuestions, attempts)
    return { ...m, pct, uploaded: uploadedFascicules, total: mFascicules.length, doneQuestions: completion.done, totalQuestions: completion.total }
  })

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 100 }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes flame-pulse { 0%,100%{transform:scaleY(1) rotate(-2deg)} 50%{transform:scaleY(1.1) rotate(2deg)} }
        @keyframes goal-glow  { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0)} 50%{box-shadow:0 0 16px 4px rgba(22,163,74,0.22)} }
      `}</style>

      {/* Header */}
      <div style={{ padding: `${sp(12)}px ${sp(5)}px 0`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            ...monoStyle('xs', 'med', PALETTE.brand),
            textTransform: 'uppercase', letterSpacing: 1.4,
          }}>
            {loading && !data ? <Skeleton w={80} h={13} /> : `Bonjour${firstName ? `, ${firstName}` : ''}`}
          </div>
          <div style={{ ...displayStyle('3xl', 'bold'), marginTop: sp(1) }}>DentalPrep</div>
        </div>
        <Link href="/profile" style={{
          width: 40, height: 40, borderRadius: RADIUS.md,
          background: PALETTE.surface, border: `1px solid ${PALETTE.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          boxShadow: SHADOW.sm,
        }}>
          <Icon name="user" size={18} color={PALETTE.ink} />
        </Link>
      </div>

      {/* Hero countdown */}
      <div style={{ padding: '16px 20px 0' }}>
        {loading && !data ? (
          <div style={{ borderRadius: 20, height: 130, background: '#C8D8F5' }} />
        ) : (
          <Link href={profile?.exam_date ? '/profile' : '/setup'} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: `linear-gradient(135deg, ${PALETTE.brand} 0%, ${PALETTE.brandDeep} 100%)`,
              borderRadius: RADIUS.xl, padding: '18px 20px', color: '#fff',
              boxShadow: `0 10px 30px ${PALETTE.brandDeep}55`,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Pattern décoratif sable */}
              <div style={{
                position: 'absolute', top: -20, right: -20, width: 200, height: 200,
                backgroundImage: `radial-gradient(circle, ${PALETTE.accent}66 1.5px, transparent 1.5px)`,
                backgroundSize: '12px 12px', opacity: 0.4, pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    ...monoStyle('xs', 'med', 'rgba(255,255,255,0.7)'),
                    textTransform: 'uppercase', letterSpacing: 1.4,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Icon name="calendar" size={11} color="#fff" />
                    {profile?.exam_date
                      ? `CNQAOS · ${new Date(profile.exam_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                      : 'Configurer la date →'}
                  </div>
                  <div style={{
                    ...displayStyle('4xl', 'bold', '#fff'),
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: sp(1), lineHeight: 1,
                  }}>
                    {days !== null ? <>J<span style={{ opacity: 0.6 }}>−</span>{days}</> : '—'}
                  </div>
                </div>

                {/* Pet companion en sticker */}
                {!loading && (
                  <div style={{
                    width: 64, height: 64, flexShrink: 0,
                    filter: `drop-shadow(0 6px 14px ${PALETTE.brandDeep}99)`,
                  }}>
                    <PetCompanion petType={petType} state="idle" size={64} hideName level={xpInfo.level} />
                  </div>
                )}
              </div>

              {/* Barre de progression globale */}
              <div style={{ marginTop: sp(3), position: 'relative' }}>
                <div style={{ ...monoStyle('xs', 'med', 'rgba(255,255,255,0.75)'), marginBottom: 6 }}>
                  {overallProgress}% de progression
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${overallProgress}%`, height: '100%', background: '#fff', borderRadius: 999, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Streak + Daily goal widget */}
      <div style={{ padding: '12px 20px 0' }}>
        {loading && !data ? (
          <div style={{ display: 'flex', gap: 10 }}><Skeleton w="50%" h={96} r={16} /><Skeleton w="50%" h={96} r={16} /></div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>

            {/* Streak card */}
            <div style={{
              flex: 1, background: streak > 0 ? 'linear-gradient(135deg,#FF6B1A 0%,#FF9500 100%)' : A.surface,
              borderRadius: 16, padding: '14px 16px',
              border: streak > 0 ? 'none' : `0.5px solid ${A.border}`,
              boxShadow: streak > 0 ? '0 6px 20px rgba(255,107,26,0.32)' : 'none',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: streak > 0 ? 'rgba(255,255,255,0.8)' : A.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Streak</div>
                <span style={{
                  fontSize: 22,
                  display: 'inline-block',
                  animation: streak > 0 ? 'flame-pulse 1.4s ease-in-out infinite' : undefined,
                  transformOrigin: 'bottom center',
                }}>🔥</span>
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1.5, color: streak > 0 ? '#fff' : A.textDim, lineHeight: 1 }}>{streak}</div>
                <div style={{ fontSize: 11, color: streak > 0 ? 'rgba(255,255,255,0.75)' : A.textDim, marginTop: 2, fontWeight: 500 }}>
                  {streak === 0 ? 'Pas encore commencé' : streak === 1 ? 'jour de suite' : 'jours de suite'}
                </div>
              </div>
            </div>

            {/* Daily goal card */}
            <div style={{
              flex: 1, background: goalDone ? `linear-gradient(135deg, ${A.green} 0%, #14a358 100%)` : A.surface,
              borderRadius: 16, padding: '14px 16px',
              border: goalDone ? 'none' : `0.5px solid ${A.border}`,
              boxShadow: goalDone ? '0 6px 20px rgba(22,163,74,0.28)' : 'none',
              animation: goalDone ? 'goal-glow 2.5s ease-in-out infinite' : undefined,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: goalDone ? 'rgba(255,255,255,0.8)' : A.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Aujourd&apos;hui</div>
                <Ring pct={goalPct} size={38} stroke={4} color={goalDone ? '#fff' : A.primary} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color: goalDone ? '#fff' : A.text, lineHeight: 1 }}>
                  {todayMin}<span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>/{goalMin}</span>
                </div>
                <div style={{ fontSize: 11, color: goalDone ? 'rgba(255,255,255,0.75)' : A.textMuted, marginTop: 2, fontWeight: 500 }}>
                  {goalDone ? 'Objectif atteint !' : 'min étudiées'}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* XP mini widget */}
      {!loading && (
        <div style={{ padding: '10px 20px 0' }}>
          <div style={{ background: A.surface, borderRadius: 16, border: `0.5px solid ${A.border}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flexShrink: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PetCompanion petType={petType} state="idle" size={40} hideName level={xpInfo.level} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: xpInfo.color }}>Niv. {xpInfo.level}</div>
                  <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 500 }}>{xpInfo.name}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: A.textMuted }}>{xp} XP</div>
              </div>
              <div style={{ height: 6, background: '#E9ECF2', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${xpInfo.pct}%`,
                  background: `linear-gradient(90deg, ${xpInfo.color}, ${xpInfo.color}CC)`,
                  borderRadius: 3, transition: 'width 0.8s ease',
                  boxShadow: `0 0 6px ${xpInfo.color}55`,
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carte Reprendre — la prochaine action recommandée mise en avant */}
      {!loading && data && (() => {
        const plan = buildStudyPlan({
          daysUntilExam: days,
          dailyGoalMinutes: goalMin,
          flashcardsDueCount: data.flashcardsDueCount,
          attempts,
          moduleStats: moduleStats.map(m => ({
            id: m.id as ModuleId,
            label: m.label,
            pct: m.pct,
            doneQuestions: m.doneQuestions,
            totalQuestions: m.totalQuestions,
          })),
          practiceTodoCount: data.practiceTodoCount,
          recentWrongQuestionCount: data.recentWrongQuestionCount,
          totalQuestionsCount: data.questions.length,
        })
        const top = plan[0]
        if (!top) return null
        return (
          <div style={{ padding: `${sp(4)}px ${sp(5)}px 0` }}>
            <Link href={top.href} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                background: PALETTE.surface,
                borderRadius: RADIUS.lg,
                border: `1px solid ${PALETTE.rule}`,
                padding: sp(4),
                boxShadow: SHADOW.md,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: sp(1) }}>
                  <div style={{
                    ...monoStyle('xs', 'med', PALETTE.accent),
                    textTransform: 'uppercase', letterSpacing: 1.4,
                  }}>
                    Reprendre
                  </div>
                  <div style={{
                    ...monoStyle('xs', 'med', PALETTE.inkDim),
                    background: PALETTE.surfaceAlt, padding: '2px 8px', borderRadius: RADIUS.sm,
                  }}>
                    ≈ {top.estimatedMin} min
                  </div>
                </div>
                <div style={displayStyle('xl', 'bold')}>{top.title}</div>
                <div style={{ ...typeStyle('sm', 'body', PALETTE.inkMute), marginTop: 2 }}>
                  {top.detail}
                </div>
                <div style={{
                  marginTop: sp(3),
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: `${sp(2)}px ${sp(4)}px`,
                  background: PALETTE.brand, color: '#fff',
                  borderRadius: RADIUS.pill,
                  ...monoStyle('xs', 'med', '#fff'),
                  letterSpacing: 0.4,
                }}>
                  Continuer
                  <Icon name="chevronR" size={12} color="#fff" strokeWidth={2.4} />
                </div>
              </div>
            </Link>
          </div>
        )
      })()}

      {/* Pet celebration banner — only when goal done */}
      {!loading && goalDone && (
        <div style={{ padding: '10px 20px 0' }}>
          <div style={{ background: A.greenSoft, borderRadius: 16, border: `1px solid ${A.green}30`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PetCompanion petType={petType} state="correct" size={48} hideName level={xpInfo.level} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.green }}>Objectif du jour atteint !</div>
              <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2 }}>Tu as étudié {todayMin} min. Continue comme ça !</div>
            </div>
          </div>
        </div>
      )}

      {/* Modules tiles — 2 colonnes style ModuleTile du DS */}
      <div style={{ padding: `${sp(5)}px ${sp(5)}px 0` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: sp(2) }}>
          <div style={displayStyle('base', 'bold')}>Tes modules</div>
          <Link href="/library" style={{
            ...monoStyle('xs', 'med', PALETTE.brand),
            textTransform: 'uppercase', letterSpacing: 0.6, textDecoration: 'none',
          }}>
            Bibliothèque →
          </Link>
        </div>
        {loading && !data ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp(2) }}>
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} w="100%" h={88} r={14} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp(2) }}>
            {moduleStats.map(m => {
              // Statut couleur cohérent DS
              const status = m.pct >= 80 ? 'mastered' : m.pct >= 40 ? 'progress' : m.pct > 0 ? 'weak' : 'todo'
              const c = status === 'mastered' ? { bg: PALETTE.greenSoft, fg: PALETTE.green,  ring: PALETTE.green  }
                      : status === 'progress' ? { bg: PALETTE.brandSoft, fg: PALETTE.brand,  ring: PALETTE.brand  }
                      : status === 'weak'     ? { bg: PALETTE.amberSoft, fg: PALETTE.amber,  ring: PALETTE.amber  }
                      :                         { bg: PALETTE.surfaceAlt, fg: PALETTE.inkDim, ring: PALETTE.rule  }
              return (
                <Link key={m.id} href={`/module/${m.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: PALETTE.surface, border: `1px solid ${PALETTE.rule}`,
                    borderRadius: RADIUS.md, padding: sp(3),
                    display: 'flex', flexDirection: 'column', gap: sp(1),
                    minWidth: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp(1) }}>
                      <div style={{
                        ...monoStyle('xs', 'med', c.fg),
                        background: c.bg, padding: '2px 6px',
                        borderRadius: RADIUS.sm, letterSpacing: 0.6,
                      }}>{m.id}</div>
                      <div style={{ ...monoStyle('xs', 'med', PALETTE.inkDim), fontVariantNumeric: 'tabular-nums' }}>
                        {m.pct}%
                      </div>
                    </div>
                    <div style={{
                      ...typeStyle('sm', 'med'),
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{m.label}</div>
                    <div style={{
                      height: 4, background: PALETTE.ruleSoft,
                      borderRadius: RADIUS.pill, overflow: 'hidden', marginTop: 2,
                    }}>
                      <div style={{
                        width: `${m.pct}%`, height: '100%', background: c.ring,
                        borderRadius: RADIUS.pill, transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
