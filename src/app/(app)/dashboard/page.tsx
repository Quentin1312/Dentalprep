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

      {/* Hero countdown — streak + objectif intégrés, pet sobre dans un cercle */}
      <div style={{ padding: `${sp(4)}px ${sp(5)}px 0` }}>
        {loading && !data ? (
          <div style={{ borderRadius: RADIUS.xl, height: 160, background: PALETTE.brandSoft }} />
        ) : (
          <Link href={profile?.exam_date ? '/profile' : '/setup'} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: `linear-gradient(135deg, ${PALETTE.brand} 0%, ${PALETTE.brandDeep} 100%)`,
              borderRadius: RADIUS.xl, padding: '20px 22px', color: '#fff',
              boxShadow: `0 10px 30px ${PALETTE.brandDeep}55`,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Décor cercle sobre top-right */}
              <div style={{
                position: 'absolute', right: -40, top: -40,
                width: 180, height: 180,
                border: `18px solid rgba(255,255,255,0.06)`,
                borderRadius: '50%', pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', gap: sp(3) }}>
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
                  <div style={{
                    ...monoStyle('xs', 'med', 'rgba(255,255,255,0.7)'),
                    marginTop: 4,
                  }}>
                    {overallProgress}% de progression
                  </div>
                </div>

                {/* Pet sobre dans un cercle propre — pas de couronne, pas de glow */}
                <div style={{
                  width: 72, height: 72, flexShrink: 0, position: 'relative',
                  background: 'rgba(255,255,255,0.12)',
                  border: `1px solid rgba(255,255,255,0.18)`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <PetCompanion petType={petType} state="idle" size={60} hideName level={xpInfo.level} equipped={data?.profile.equipped_accessories ?? {}} />
                </div>
              </div>

              {/* Streak + objectif intégrés dans une mini strip */}
              <div style={{
                marginTop: sp(4),
                background: 'rgba(255,255,255,0.10)',
                borderRadius: RADIUS.md,
                padding: `${sp(2)}px ${sp(3)}px`,
                display: 'flex', alignItems: 'center', gap: sp(4),
              }}>
                {/* Streak */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    ...monoStyle('xs', 'med', 'rgba(255,255,255,0.65)'),
                    textTransform: 'uppercase', letterSpacing: 1,
                  }}>
                    Série
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <div style={{
                      ...displayStyle('lg', 'bold', '#fff'),
                      fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                    }}>{streak}</div>
                    <div style={monoStyle('xs', 'body', 'rgba(255,255,255,0.65)')}>
                      {streak === 1 ? 'jour' : 'jours'}
                    </div>
                  </div>
                </div>

                {/* Séparateur */}
                <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.18)' }} />

                {/* Objectif quotidien */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    ...monoStyle('xs', 'med', 'rgba(255,255,255,0.65)'),
                    textTransform: 'uppercase', letterSpacing: 1,
                  }}>
                    Objectif
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <div style={{
                      ...displayStyle('lg', 'bold', goalDone ? PALETTE.accent : '#fff'),
                      fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                    }}>{todayMin}</div>
                    <div style={monoStyle('xs', 'body', 'rgba(255,255,255,0.65)')}>
                      /{goalMin} min
                    </div>
                  </div>
                </div>
              </div>

              {/* Barre de progression globale */}
              <div style={{ marginTop: sp(3), height: 5, background: 'rgba(255,255,255,0.18)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${overallProgress}%`, height: '100%', background: '#fff', borderRadius: 999, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Carte Reprendre — la prochaine action recommandée mise en avant */}
      {!loading && data && (() => {
        const plan = buildStudyPlan({
          daysUntilExam: days,
          dailyGoalMinutes: goalMin,
          flashcardsDueCount: data.flashcardsDueCount,
          quizDueCount: data.quizDueCount,
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
        if (plan.length === 0) return null
        return (
          <div style={{ padding: `${sp(4)}px ${sp(5)}px 0`, display: 'flex', flexDirection: 'column', gap: sp(2) }}>
            {plan.map((item, idx) => (
              <Link key={item.id} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  background: PALETTE.surface,
                  borderRadius: RADIUS.lg,
                  border: `1px solid ${PALETTE.rule}`,
                  padding: sp(4),
                  boxShadow: idx === 0 ? SHADOW.md : SHADOW.sm,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: sp(1) }}>
                    <div style={{
                      ...monoStyle('xs', 'med', idx === 0 ? PALETTE.accent : item.accent),
                      textTransform: 'uppercase', letterSpacing: 1.4,
                    }}>
                      {idx === 0 ? 'Reprendre' : 'Ensuite'}
                    </div>
                    <div style={{
                      ...monoStyle('xs', 'med', PALETTE.inkDim),
                      background: PALETTE.surfaceAlt, padding: '2px 8px', borderRadius: RADIUS.sm,
                    }}>
                      ≈ {item.estimatedMin} min
                    </div>
                  </div>
                  <div style={displayStyle('xl', 'bold')}>{item.title}</div>
                  <div style={{ ...typeStyle('sm', 'body', PALETTE.inkMute), marginTop: 2 }}>
                    {item.detail}
                  </div>
                  <div style={{
                    marginTop: sp(3),
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: `${sp(2)}px ${sp(4)}px`,
                    background: idx === 0 ? PALETTE.brand : PALETTE.surfaceAlt,
                    color: idx === 0 ? '#fff' : PALETTE.ink,
                    borderRadius: RADIUS.pill,
                    ...monoStyle('xs', 'med', idx === 0 ? '#fff' : PALETTE.ink),
                    letterSpacing: 0.4,
                  }}>
                    Continuer
                    <Icon name="chevronR" size={12} color={idx === 0 ? '#fff' : PALETTE.ink} strokeWidth={2.4} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      })()}

      {/* Banner d'objectif atteint retiré — info maintenant intégrée au hero */}

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
