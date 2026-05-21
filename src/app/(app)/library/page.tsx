'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppData } from '@/lib/app-context'
import { MODULES, FASCICULES } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import { readFlashQuestions } from '@/lib/flash-store'
import { createClient } from '@/lib/supabase/client'
import ModuleParcours from '@/components/library/ModuleParcours'

function fasciculeN(title: string): number | null {
  const m = title.match(/Fascicule\s+(\d+)/i)
  return m ? parseInt(m[1]) : null
}

export default function LibraryPage() {
  const { data, loading } = useAppData()
  const courses = data?.courses ?? []
  const [flashQCount, setFlashQCount] = useState(0)
  const [courseProgress, setCourseProgress] = useState<Map<string, { total: number; attempted: number }>>(new Map())
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const initialExpandRef = useRef(false)

  useEffect(() => { setFlashQCount(readFlashQuestions().length) }, [])

  const moduleIds = [...new Set(courses.map(c => c.module_id))]
  const attemptedModuleIds = new Set((data?.attempts ?? []).map(a => a.module_id))
  const allModulesQuizzed = moduleIds.length > 0 && moduleIds.every(id => attemptedModuleIds.has(id))
  const globalUnlocked = flashQCount >= 5 && allModulesQuizzed
  const missingModules = moduleIds.filter(id => !attemptedModuleIds.has(id))

  // Charge le compte de questions par (module_id:course_id) pour les leçons par module
  const loadProgress = useCallback(async () => {
    if (!data?.userId) return
    const supabase = createClient()
    const { data: qq } = await supabase.from('quiz_questions').select('id,course_id,module_id').eq('user_id', data.userId)
    if (!qq) return
    // key = "moduleId:courseId"
    const questionToKey = new Map(qq.map(q => [q.id as string, `${q.module_id}:${q.course_id}`]))
    const qCountByKey = new Map<string, number>()
    for (const q of qq) {
      const key = `${q.module_id}:${q.course_id}`
      qCountByKey.set(key, (qCountByKey.get(key) ?? 0) + 1)
    }
    const attemptedByKey = new Map<string, Set<string>>()
    for (const at of data.attempts ?? []) {
      const key = questionToKey.get(at.question_id)
      if (!key) continue
      const s = attemptedByKey.get(key) ?? new Set<string>()
      s.add(at.question_id)
      attemptedByKey.set(key, s)
    }
    const prog = new Map<string, { total: number; attempted: number }>()
    for (const [key, total] of qCountByKey) prog.set(key, { total, attempted: attemptedByKey.get(key)?.size ?? 0 })
    setCourseProgress(prog)
  }, [data?.userId, data?.attempts])

  useEffect(() => { loadProgress() }, [loadProgress])

  // Expand le premier module qui a des cours scannés — uniquement au premier chargement
  useEffect(() => {
    if (initialExpandRef.current || !data) return
    initialExpandRef.current = true
    const firstWithCourses = MODULES.find(m => courses.some(c => c.module_id === m.id))
    if (firstWithCourses) setExpandedModule(firstWithCourses.id)
  }, [data, courses])

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes parcours-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes parcours-fade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ padding: '62px 20px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Bibliothèque</div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Mon parcours</div>
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

      {/* Modules avec parcours accordéon */}
      <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading && !data
          ? [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: 76, borderRadius: 18, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))
          : MODULES.map(m => {
              const mFascicules = FASCICULES.filter(f => f.modules.includes(m.id))
              const mFasNums = new Set(mFascicules.map(f => f.n))
              const mCourses = courses.filter(c => {
                if (c.module_id === m.id) return true
                const n = c.title.match(/Fascicule\s+(\d+)/i)
                return n !== null && mFasNums.has(parseInt(n[1]))
              })
              const scannedCount = mFascicules.filter(f => mCourses.some(c => fasciculeN(c.title) === f.n)).length
              const isExpanded = expandedModule === m.id
              const allScanned = scannedCount === mFascicules.length && mFascicules.length > 0

              // Compte des leçons faites/totales pour ce module (clé "moduleId:courseId")
              const moduleLessons = mCourses.reduce((acc, c) => {
                const p = courseProgress.get(`${m.id}:${c.id}`)
                if (!p || p.total === 0) return acc
                return {
                  total: acc.total + Math.ceil(p.total / 10),
                  done: acc.done + Math.floor(p.attempted / 10),
                }
              }, { total: 0, done: 0 })

              return (
                <div key={m.id} style={{
                  background: A.surface,
                  borderRadius: 20,
                  border: `0.5px solid ${A.border}`,
                  overflow: 'hidden',
                  boxShadow: isExpanded ? '0 8px 32px rgba(15,27,45,0.08)' : '0 1px 3px rgba(15,27,45,0.05)',
                  transition: 'box-shadow .3s',
                }}>
                  {/* Header cliquable */}
                  <button
                    onClick={() => setExpandedModule(isExpanded ? null : m.id)}
                    style={{
                      width: '100%', padding: '16px 16px', display: 'flex', alignItems: 'center', gap: 12,
                      background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: A.font,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: allScanned
                        ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                        : `linear-gradient(135deg, ${A.primary} 0%, #0850B8 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      boxShadow: allScanned
                        ? '0 4px 12px rgba(22,163,74,0.3)'
                        : '0 4px 12px rgba(10,102,224,0.3)',
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{m.id}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: A.textMuted, marginTop: 2 }}>
                        {mFascicules.length > 0 && (
                          <>
                            {scannedCount}/{mFascicules.length} fascicule{mFascicules.length > 1 ? 's' : ''}
                            {moduleLessons.total > 0 && ` · ${moduleLessons.done}/${moduleLessons.total} leçons`}
                          </>
                        )}
                      </div>
                    </div>
                    {allScanned && (
                      <Link
                        href={`/quiz/${m.id}?mode=smart`}
                        onClick={e => e.stopPropagation()}
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 10, background: A.primarySoft, border: `1px solid ${A.primary}30`, flexShrink: 0, marginRight: 6 }}
                      >
                        <Icon name="bolt" size={12} color={A.primary} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: A.primary }}>Smart</span>
                      </Link>
                    )}
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform .25s',
                      background: '#F3F4F6',
                      flexShrink: 0,
                    }}>
                      <Icon name="chevronD" size={16} color={A.textMuted} />
                    </div>
                  </button>

                  {/* Parcours déployable */}
                  {isExpanded && (
                    <div style={{
                      padding: '20px 16px 28px',
                      borderTop: `0.5px solid ${A.border}`,
                      animation: 'parcours-fade .3s ease-out',
                    }}>
                      <ModuleParcours
                        moduleId={m.id}
                        fascicules={mFascicules}
                        courses={mCourses}
                        courseProgress={courseProgress}
                      />
                    </div>
                  )}
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
