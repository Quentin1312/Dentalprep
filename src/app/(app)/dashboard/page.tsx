'use client'

import Link from 'next/link'
import { useAppData } from '@/lib/app-context'
import { MODULES, FASCICULES } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import PetCompanion from '@/components/pet/PetCompanion'
import type { PetType } from '@/components/pet/PetCompanion'
import { computeXP, xpProgress } from '@/lib/xp'
import { quizCompletionPct, quizCompletionCount } from '@/lib/quiz-progress'

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
      <div style={{ padding: '62px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>
            {loading && !data ? <Skeleton w={80} h={13} /> : `Bonjour${firstName ? ` ${firstName}` : ''} 👋`}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>DentalPrep</div>
        </div>
        <Link href="/profile" style={{ width: 40, height: 40, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <Icon name="user" size={18} color={A.text} />
        </Link>
      </div>

      {/* Hero countdown */}
      <div style={{ padding: '16px 20px 0' }}>
        {loading && !data ? (
          <div style={{ borderRadius: 20, height: 130, background: '#C8D8F5' }} />
        ) : (
          <Link href={profile?.exam_date ? '/profile' : '/setup'} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ background: `linear-gradient(135deg, ${A.primary} 0%, ${A.primaryDark} 100%)`, borderRadius: 20, padding: '18px 20px', color: '#fff', boxShadow: '0 10px 30px rgba(10,102,224,0.28)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, border: '20px solid rgba(255,255,255,0.07)', borderRadius: '50%' }} />
              <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="calendar" size={12} color="#fff" />
                {profile?.exam_date
                  ? `Examen CNQAOS · ${new Date(profile.exam_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Configurer la date →'}
              </div>
              <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -2, lineHeight: 1, marginTop: 6 }}>
                {days !== null ? `J−${days}` : '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{overallProgress}% de progression</div>
              </div>
              <div style={{ marginTop: 8, height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${overallProgress}%`, height: '100%', background: '#fff', borderRadius: 4, transition: 'width 0.8s ease' }} />
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

      {/* Module progress */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' }}>Progression par module</div>
          <Link href="/library" style={{ fontSize: 12, color: A.primary, fontWeight: 600, textDecoration: 'none' }}>Bibliothèque →</Link>
        </div>
        {loading && !data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} w="100%" h={60} r={14} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {moduleStats.map(m => {
              const color = m.pct >= 100 ? A.green : m.pct > 0 ? A.amber : A.textDim
              return (
                <Link key={m.id} href={`/module/${m.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: A.surface, borderRadius: 14, padding: '12px 14px', border: `0.5px solid ${A.border}`, boxShadow: '0 1px 3px rgba(15,27,45,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: m.pct >= 100 ? A.greenSoft : m.pct > 0 ? A.amberSoft : '#F1F3F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color }}>{m.id}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
                        {m.totalQuestions > 0
                          ? <div style={{ fontSize: 11, color, marginTop: 1, fontWeight: 600 }}>{m.doneQuestions}/{m.totalQuestions} questions validées</div>
                          : <div style={{ fontSize: 11, color: A.textDim, marginTop: 1 }}>{m.uploaded}/{m.total} fascicules scannés</div>}
                      </div>
                      <div style={{ width: 36, height: 36, position: 'relative', flexShrink: 0 }}>
                        <svg width="36" height="36" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#E9ECF2" strokeWidth="3" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
                            strokeDasharray={`${(m.pct / 100) * 88} 88`} strokeLinecap="round"
                            transform="rotate(-90 18 18)" />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color }}>{m.pct}%</div>
                      </div>
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
