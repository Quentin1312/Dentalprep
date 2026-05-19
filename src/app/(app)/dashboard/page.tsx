'use client'

import Link from 'next/link'
import { useAppData } from '@/lib/app-context'
import { MODULES } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

function daysUntil(d: string | null) {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
}

function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

export default function DashboardPage() {
  const { data, loading } = useAppData()

  const profile = data?.profile ?? null
  const attempts = data?.attempts ?? []

  const days = daysUntil(profile?.exam_date ?? null)
  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const overallProgress = attempts.length > 0
    ? Math.round((attempts.filter(a => a.is_correct).length / attempts.length) * 100) : 0

  const moduleStats = MODULES.map(m => {
    const mAttempts = attempts.filter(a => a.module_id === m.id)
    const correct = mAttempts.filter(a => a.is_correct).length
    const score = mAttempts.length > 0 ? Math.round((correct / mAttempts.length) * 100) : null
    return { ...m, score, total: mAttempts.length }
  })

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 100 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div style={{ padding: '62px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>
            {loading && !data ? <Skeleton w={80} h={13} /> : `Bonjour${firstName ? ` ${firstName}` : ''}`}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>DentalPrep</div>
        </div>
        <Link href="/profile" style={{ width: 40, height: 40, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <Icon name="user" size={18} color={A.text} />
        </Link>
      </div>

      {/* Hero */}
      <div style={{ padding: '16px 20px 0' }}>
        {loading && !data ? (
          <div style={{ borderRadius: 20, height: 148, background: '#C8D8F5' }} />
        ) : (
          <Link href={profile?.exam_date ? '/profile' : '/setup'} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ background: `linear-gradient(135deg, ${A.primary} 0%, ${A.primaryDark} 100%)`, borderRadius: 20, padding: '18px 20px', color: '#fff', boxShadow: '0 10px 30px rgba(10,102,224,0.28)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, border: '20px solid rgba(255,255,255,0.07)', borderRadius: '50%' }} />
              <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="calendar" size={12} color="#fff" />
                {profile?.exam_date
                  ? `Examen CNQAOS · ${new Date(profile.exam_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Examen CNQAOS · configurer la date →'}
              </div>
              <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: -2, lineHeight: 1, marginTop: 6 }}>
                {days !== null ? `J−${days}` : '—'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{overallProgress}% de progression</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>🔥 {profile?.streak ?? 0} j</div>
              </div>
              <div style={{ marginTop: 8, height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${overallProgress}%`, height: '100%', background: '#fff', borderRadius: 4 }} />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Quiz Flash CTA */}
      <div style={{ padding: '12px 20px 0' }}>
        <Link href="/quick-scan" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: A.text, borderRadius: 16, textDecoration: 'none' }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera" size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Quiz Flash</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Photo → quiz instantané</div>
          </div>
          <Icon name="chevronR" size={16} color="rgba(255,255,255,0.5)" />
        </Link>
      </div>

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
              const color = m.score !== null && m.score >= 75 ? A.green : m.score !== null ? A.amber : A.textDim
              return (
                <Link key={m.id} href={`/module/${m.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: A.surface, borderRadius: 14, padding: '12px 14px', border: `0.5px solid ${A.border}`, boxShadow: '0 1px 3px rgba(15,27,45,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: m.score !== null && m.score >= 75 ? A.greenSoft : m.score !== null ? A.amberSoft : '#F1F3F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color }}>{m.id}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
                        {m.score !== null
                          ? <div style={{ fontSize: 11, color, marginTop: 1, fontWeight: 600 }}>{m.score}% · {m.total} questions</div>
                          : <div style={{ fontSize: 11, color: A.textDim, marginTop: 1 }}>Pas encore commencé</div>}
                      </div>
                      {m.score !== null && (
                        <div style={{ width: 36, height: 36, position: 'relative', flexShrink: 0 }}>
                          <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" fill="none" stroke="#E9ECF2" strokeWidth="3" />
                            <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
                              strokeDasharray={`${(m.score / 100) * 88} 88`} strokeLinecap="round"
                              transform="rotate(-90 18 18)" />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color }}>{m.score}%</div>
                        </div>
                      )}
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
