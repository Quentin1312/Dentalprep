import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MODULES, BLOCS } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'


function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: courses }, { data: attempts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('courses').select('id, module_id').eq('user_id', user.id),
    supabase.from('quiz_attempts').select('module_id, is_correct').eq('user_id', user.id),
  ])

  const days = daysUntil(profile?.exam_date ?? null)
  const firstName = profile?.full_name?.split(' ')[0] ?? 'toi'

  const moduleStats = MODULES.map(m => {
    const mAttempts = attempts?.filter(a => a.module_id === m.id) ?? []
    const correct = mAttempts.filter(a => a.is_correct).length
    const quiz = mAttempts.length > 0 ? Math.round((correct / mAttempts.length) * 100) : null
    const hasCourses = courses?.some(c => c.module_id === m.id) ?? false
    const status = !hasCourses ? 'empty' : quiz !== null && quiz >= 75 ? 'mastered' : quiz !== null ? 'weak' : 'empty'
    return { ...m, quiz, hasCourses, status, daysSince: null as number | null, courses: courses?.filter(c => c.module_id === m.id).length ?? 0 }
  })

  const masteredCount = moduleStats.filter(m => m.status === 'mastered').length
  const overallProgress = attempts && attempts.length > 0
    ? Math.round((attempts.filter(a => a.is_correct).length / attempts.length) * 100)
    : 0

  const byBloc = BLOCS.map(b => ({
    ...b,
    mods: moduleStats.filter(m => m.bloc === b.n),
  }))

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 100 }}>
      {/* Top */}
      <div style={{ padding: '62px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Bonjour {firstName}</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>DentalPrep</div>
          </div>
          <Link href="/upload" style={{
            width: 40, height: 40, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none',
          }}><Icon name="settings" size={18} color={A.text} /></Link>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          background: `linear-gradient(135deg, ${A.primary} 0%, ${A.primaryDark} 100%)`,
          borderRadius: 20, padding: 18, color: '#fff',
          boxShadow: '0 10px 30px rgba(10,102,224,0.32)',
          position: 'relative', overflow: 'hidden',
        }}>
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
            <div style={{ fontSize: 12, opacity: 0.85, textAlign: 'right' }}>
              {masteredCount}/7 modules<br />maîtrisés
            </div>
          </div>
          <div style={{ marginTop: 10, height: 6, background: 'rgba(255,255,255,0.22)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${overallProgress}%`, height: '100%', background: '#fff', borderRadius: 6, transition: 'width .4s' }} />
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div style={{ padding: '14px 20px 0' }}>
        <Link href="/upload" style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: 14,
          background: A.surface, borderRadius: 16,
          boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)',
          border: `0.5px solid ${A.border}`, cursor: 'pointer', textDecoration: 'none',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bolt" size={20} color={A.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: A.text }}>Ajouter un cours</div>
            <div style={{ fontSize: 12, color: A.textMuted }}>Photo → flashcards + quiz auto</div>
          </div>
          <Icon name="chevronR" size={16} color={A.textDim} />
        </Link>
      </div>

      {/* Blocs */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>
          Modules · 4 blocs
        </div>
        {byBloc.map(b => (
          <div key={b.n} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: A.textMuted, marginBottom: 8, paddingLeft: 2 }}>
              <span style={{ width: 18, height: 18, borderRadius: 6, background: A.text, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{b.n}</span>
              {b.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {b.mods.map(m => {
                const empty = m.status === 'empty'
                const statusColor = m.status === 'mastered' ? A.green : m.status === 'weak' ? A.amber : A.textDim
                const bg = m.status === 'mastered' ? A.greenSoft : m.status === 'weak' ? A.amberSoft : '#F1F3F7'
                return (
                  <Link key={m.id} href={empty ? '/upload' : `/module/${m.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: A.surface, borderRadius: 16, padding: 14, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: statusColor, letterSpacing: -0.3 }}>{m.id}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: statusColor, flexShrink: 0 }} />
                            <div style={{ fontSize: 15, fontWeight: 600, color: A.text, letterSpacing: -0.2 }}>{m.label}</div>
                          </div>
                          {empty ? (
                            <div style={{ fontSize: 12, color: A.primary, marginTop: 4, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="plus" size={12} color={A.primary} /> Ajouter des cours
                            </div>
                          ) : (
                            <>
                              <div style={{ fontSize: 12, color: A.textMuted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>{m.courses} cours</span>
                                {m.quiz !== null && <><span style={{ width: 2, height: 2, borderRadius: 1, background: A.textDim }} /><span>Quiz {m.quiz}%</span></>}
                              </div>
                              {m.quiz !== null && (
                                <div style={{ marginTop: 8, height: 4, background: '#E9ECF2', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ width: `${m.quiz}%`, height: '100%', background: statusColor, borderRadius: 4, transition: 'width .4s' }} />
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

      {/* FAB */}
      <Link href="/upload" style={{
        position: 'fixed', bottom: 100, right: 20, width: 56, height: 56, borderRadius: 28,
        background: A.text, color: '#fff', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 28px rgba(15,27,45,0.35)', zIndex: 25, textDecoration: 'none',
      }}>
        <Icon name="plus" size={22} color="#fff" strokeWidth={2.2} />
      </Link>
    </div>
  )
}
