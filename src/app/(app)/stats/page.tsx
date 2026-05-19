import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MODULES } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

export const revalidate = 30

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: attempts }, { data: sessions }] = await Promise.all([
    supabase.from('profiles').select('streak, daily_goal_minutes').eq('id', user.id).single(),
    supabase.from('quiz_attempts').select('module_id, is_correct, created_at').eq('user_id', user.id),
    supabase.from('daily_sessions').select('date, minutes_studied').eq('user_id', user.id).order('date', { ascending: false }).limit(7),
  ])

  const totalAttempts = attempts?.length ?? 0
  const totalOk = attempts?.filter(a => a.is_correct).length ?? 0
  const totalBad = totalAttempts - totalOk
  const accuracy = totalAttempts > 0 ? Math.round((totalOk / totalAttempts) * 100) : 0

  const moduleStats = MODULES.map(m => {
    const mAttempts = attempts?.filter(a => a.module_id === m.id) ?? []
    const correct = mAttempts.filter(a => a.is_correct).length
    const pct = mAttempts.length > 0 ? Math.round((correct / mAttempts.length) * 100) : null
    const status = pct === null ? 'empty' : pct >= 75 ? 'mastered' : 'weak'
    return { ...m, quiz: pct, status, count: mAttempts.length }
  }).filter(m => m.count > 0)

  // Build week from sessions or dummy
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const week = days.map((d, i) => {
    const s = sessions?.[6 - i]
    return { d, min: s?.minutes_studied ?? 0 }
  }).reverse()
  const maxMin = Math.max(...week.map(w => w.min), 1)
  const totalMin = week.reduce((s, d) => s + d.min, 0)

  const r = (84 - 7) / 2
  const circ = 2 * Math.PI * r
  const streakVal = profile?.streak ?? 0

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <div style={{ padding: '62px 20px 0' }}>
        <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Tes progrès</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Statistiques</div>
      </div>

      {/* Streak hero */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: A.surface, borderRadius: 16, padding: 18, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #FF8A4C 0%, #E0533C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(224,83,60,0.32)' }}>
              <Icon name="flame" size={28} color="#fff" strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>{streakVal}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted }}>jours d&apos;affilée</div>
              </div>
              <div style={{ fontSize: 12, color: A.textMuted, marginTop: 3 }}>Continuez comme ça !</div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ background: A.surface, borderRadius: 16, padding: 18, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' }}>Cette semaine</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8 }}>{totalMin}</div>
                <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>min</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, gap: 6 }}>
            {week.map((d, i) => {
              const barH = Math.max(4, (d.min / maxMin) * 108)
              const today = i === 6
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: '100%', height: barH, background: today ? A.primary : d.min === 0 ? '#E9ECF2' : A.primarySoft, border: today ? 'none' : `0.5px solid ${A.border}`, borderRadius: 6, position: 'relative' }}>
                    {today && d.min > 0 && (
                      <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, color: A.primary }}>{d.min}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: today ? 700 : 500, color: today ? A.primary : A.textMuted }}>{d.d}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Accuracy + cards */}
      <div style={{ padding: '14px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: A.surface, borderRadius: 16, padding: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' }}>Précision</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ position: 'relative', width: 60, height: 60 }}>
              <svg width={60} height={60} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={30} cy={30} r={r} fill="none" stroke="#E9ECF2" strokeWidth={6} />
                <circle cx={30} cy={30} r={r} fill="none" stroke={A.green} strokeWidth={6} strokeDasharray={circ} strokeDashoffset={circ * (1 - accuracy / 100)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: A.text }}>{accuracy}%</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: A.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: A.green }} /> {totalOk} ok</div>
              <div style={{ fontSize: 11, color: A.textMuted, display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: A.red }} /> {totalBad} erreurs</div>
            </div>
          </div>
        </div>
        <div style={{ background: A.surface, borderRadius: 16, padding: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' }}>Questions</div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.8, marginTop: 8 }}>{totalAttempts}</div>
          <div style={{ fontSize: 11, color: A.green, fontWeight: 600, marginTop: 4 }}>tentées au total</div>
        </div>
      </div>

      {/* Per-module */}
      {moduleStats.length > 0 && (
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>Niveau par module</div>
          <div style={{ background: A.surface, borderRadius: 16, padding: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
            {moduleStats.map((m, i) => {
              const statusColor = m.status === 'mastered' ? A.green : A.amber
              const statusBg = m.status === 'mastered' ? A.greenSoft : A.amberSoft
              return (
                <div key={m.id} style={{ padding: '10px 0', borderBottom: i < moduleStats.length - 1 ? `0.5px solid ${A.border}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: statusColor, padding: '2px 6px', borderRadius: 5, background: statusBg }}>{m.id}</div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: A.text }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>{m.quiz}%</div>
                  </div>
                  <div style={{ height: 5, background: '#E9ECF2', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${m.quiz}%`, height: '100%', background: statusColor, borderRadius: 5 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Predictive */}
      {totalAttempts > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ background: A.primarySoft, borderRadius: 14, padding: 14, border: `0.5px solid ${A.primary}30`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name="sparkle" size={20} color={A.primary} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>Estimation IA : {accuracy}% au CNQAOS</div>
              <div style={{ fontSize: 11, color: A.textMuted, marginTop: 2 }}>{totalAttempts} questions analysées</div>
            </div>
          </div>
        </div>
      )}

      {totalAttempts === 0 && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: A.textMuted }}>Faites vos premiers quiz pour voir vos statistiques ici.</div>
        </div>
      )}
    </div>
  )
}
