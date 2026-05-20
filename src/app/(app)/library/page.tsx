'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAppData } from '@/lib/app-context'
import { MODULES, FASCICULES } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import { readFlashQuestions } from '@/lib/flash-store'

function fasciculeN(title: string): number | null {
  const m = title.match(/Fascicule\s+(\d+)/i)
  return m ? parseInt(m[1]) : null
}

export default function LibraryPage() {
  const { data, loading } = useAppData()
  const courses = data?.courses ?? []
  const [flashQCount, setFlashQCount] = useState(0)
  useEffect(() => { setFlashQCount(readFlashQuestions().length) }, [])

  const moduleIds = [...new Set(courses.map(c => c.module_id))]
  const attemptedModuleIds = new Set((data?.attempts ?? []).map(a => a.module_id))
  const allModulesQuizzed = moduleIds.length > 0 && moduleIds.every(id => attemptedModuleIds.has(id))
  const globalUnlocked = flashQCount >= 5 && allModulesQuizzed
  const missingModules = moduleIds.filter(id => !attemptedModuleIds.has(id))

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div style={{ padding: '62px 20px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Bibliothèque</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Mes fascicules</div>
        </div>
        <Link href="/quick-scan" style={{ width: 44, height: 44, borderRadius: 14, background: A.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
          <Icon name="plus" size={22} color="#fff" strokeWidth={2.2} />
        </Link>
      </div>

      {/* Quiz Global banner */}
      <Link href="/global-quiz" style={{ textDecoration: 'none', display: 'block', margin: '16px 20px 0' }}>
        <div style={{ background: globalUnlocked ? `linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)` : A.surface, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: globalUnlocked ? '0 4px 20px rgba(124,58,237,0.28)' : 'none', border: globalUnlocked ? 'none' : `0.5px solid ${A.border}` }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: globalUnlocked ? 'rgba(255,255,255,0.18)' : '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="sparkle" size={20} color={globalUnlocked ? '#fff' : '#7C3AED'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: globalUnlocked ? '#fff' : A.text }}>Quiz Global {globalUnlocked ? '' : '🔒'}</div>
            <div style={{ fontSize: 12, color: globalUnlocked ? 'rgba(255,255,255,0.75)' : A.textMuted, marginTop: 1 }}>
              {globalUnlocked
                ? `${flashQCount} questions · tous modules débloqué`
                : missingModules.length > 0
                  ? `Quiz manquant : ${missingModules.join(', ')}`
                  : flashQCount < 5
                    ? `Fais des Quiz Flash (${flashQCount}/5 questions)`
                    : 'Fais le quiz de chaque module'}
            </div>
          </div>
          <Icon name="chevronR" size={16} color={globalUnlocked ? 'rgba(255,255,255,0.7)' : A.textDim} />
        </div>
      </Link>

      {/* Quick scan banner */}
      <Link href="/quick-scan" style={{ textDecoration: 'none', display: 'block', margin: '10px 20px 0' }}>
        <div style={{ background: `linear-gradient(135deg, ${A.primary} 0%, #0850B8 100%)`, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 14px rgba(10,102,224,0.22)' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="camera" size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Quiz Flash</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>Photo → quiz instantané par IA</div>
          </div>
          <Icon name="chevronR" size={16} color="rgba(255,255,255,0.7)" />
        </div>
      </Link>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && !data
          ? [1,2,3,4,5,6].map(i => (
              <div key={i} style={{ height: 100, borderRadius: 16, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))
          : MODULES.map(m => {
              const mFascicules = FASCICULES.filter(f => f.modules.includes(m.id))
              const mCourses = courses.filter(c => c.module_id === m.id)
              const scannedCount = mFascicules.filter(f => mCourses.some(c => fasciculeN(c.title) === f.n)).length

              return (
                <div key={m.id} style={{ background: A.surface, borderRadius: 16, border: `0.5px solid ${A.border}`, overflow: 'hidden', boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)' }}>
                  {/* Module header */}
                  <Link href={`/module/${m.id}`} style={{ textDecoration: 'none', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `0.5px solid ${A.border}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: A.primary }}>{m.id}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: A.textMuted, marginTop: 1 }}>{scannedCount}/{mFascicules.length} scanné{scannedCount > 1 ? 's' : ''}</div>
                    </div>
                    {scannedCount === mFascicules.length && mFascicules.length > 0 && (
                      <Link
                        href={`/quiz/${m.id}?mode=smart`}
                        onClick={e => e.stopPropagation()}
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: A.primarySoft, border: `1px solid ${A.primary}30`, flexShrink: 0 }}
                      >
                        <Icon name="bolt" size={11} color={A.primary} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: A.primary }}>Quiz complet</span>
                      </Link>
                    )}
                    {scannedCount < mFascicules.length && <Icon name="chevronR" size={14} color={A.textDim} />}
                  </Link>

                  {/* Fascicules */}
                  {mFascicules.map((f, fi) => {
                    const course = mCourses.find(c => fasciculeN(c.title) === f.n)
                    const isLast = fi === mFascicules.length - 1

                    return (
                      <div key={f.n} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: isLast ? 'none' : `0.5px solid ${A.border}` }}>
                        <div style={{ width: 24, height: 24, borderRadius: 7, background: course ? A.greenSoft : '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: course ? A.green : A.textDim }}>{f.n}</span>
                        </div>

                        {/* Title cliquable → détail fascicule */}
                        {course ? (
                          <Link href={`/fascicule/${course.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                            <div style={{ fontSize: 11, color: A.green, marginTop: 1 }}>{course.page_count ?? 0} page{(course.page_count ?? 0) > 1 ? 's' : ''} · scanné</div>
                          </Link>
                        ) : (
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                            <div style={{ fontSize: 11, color: A.textDim, marginTop: 1 }}>Non scanné</div>
                          </div>
                        )}

                        {/* Actions */}
                        {course ? (
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <Link href={`/quiz/${m.id}?courseId=${course.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 8, background: A.primarySoft, border: `0.5px solid ${A.primary}20` }}>
                              <Icon name="target" size={11} color={A.primary} />
                              <span style={{ fontSize: 11, fontWeight: 600, color: A.primary }}>Quiz</span>
                            </Link>
                            <Link href={`/fascicule/${course.id}`} style={{ textDecoration: 'none', width: 28, height: 28, borderRadius: 8, background: '#F0F2F5', border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="chevronR" size={12} color={A.textMuted} />
                            </Link>
                          </div>
                        ) : (
                          <Link href={`/upload?fascicule=${f.n}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: '#F0F2F5', border: `0.5px solid ${A.border}` }}>
                            <Icon name="camera" size={11} color={A.textMuted} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: A.textMuted }}>Scanner</span>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
