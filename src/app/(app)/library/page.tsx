'use client'

import Link from 'next/link'
import { useAppData } from '@/lib/app-context'
import { MODULES, FASCICULES } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

function fasciculeN(title: string): number | null {
  const m = title.match(/Fascicule\s+(\d+)/i)
  return m ? parseInt(m[1]) : null
}

export default function LibraryPage() {
  const { data, loading } = useAppData()
  const courses = data?.courses ?? []

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

      {/* Quick scan banner */}
      <Link href="/quick-scan" style={{ textDecoration: 'none', display: 'block', margin: '16px 20px 0' }}>
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
              <div key={i} style={{ height: 88, borderRadius: 16, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))
          : MODULES.map(m => {
              const mFascicules = FASCICULES.filter(f => f.modules.includes(m.id))
              const mCourses = courses.filter(c => c.module_id === m.id)

              return (
                <div key={m.id} style={{ background: A.surface, borderRadius: 16, border: `0.5px solid ${A.border}`, overflow: 'hidden', boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)' }}>
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `0.5px solid ${A.border}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: A.primary }}>{m.id}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: A.textMuted, marginTop: 1 }}>{mFascicules.length} fascicule{mFascicules.length > 1 ? 's' : ''} · {mCourses.length} scanné{mCourses.length > 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {mFascicules.map((f, fi) => {
                    const course = mCourses.find(c => fasciculeN(c.title) === f.n)
                    const isLast = fi === mFascicules.length - 1
                    return (
                      <div key={f.n} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: isLast ? 'none' : `0.5px solid ${A.border}` }}>
                        <div style={{ width: 24, height: 24, borderRadius: 7, background: course ? A.greenSoft : '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: course ? A.green : A.textDim }}>{f.n}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                          {course
                            ? <div style={{ fontSize: 11, color: A.green, marginTop: 1 }}>{course.page_count ?? 0} page{(course.page_count ?? 0) > 1 ? 's' : ''} · scanné</div>
                            : <div style={{ fontSize: 11, color: A.textDim, marginTop: 1 }}>Non scanné</div>}
                        </div>
                        {course ? (
                          <Link href={`/module/${m.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: A.primarySoft, border: `0.5px solid ${A.primary}20` }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: A.primary }}>Réviser</span>
                            <Icon name="chevronR" size={10} color={A.primary} />
                          </Link>
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
