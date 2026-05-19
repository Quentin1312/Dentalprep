'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MODULES } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Course = { id: string; module_id: string; title: string; page_count: number | null }

export default function LibraryPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      supabase.from('courses').select('id,module_id,title,page_count').eq('user_id', user.id).order('created_at', { ascending: false })
        .then(({ data }) => { setCourses(data ?? []); setLoading(false) })
    })
  }, [router])

  async function deleteCourse(courseId: string) {
    if (!userId) return
    setDeletingId(courseId)
    const supabase = createClient()
    try {
      const { data: files } = await supabase.storage.from('course-images').list(`${userId}/${courseId}`)
      if (files?.length) {
        await supabase.storage.from('course-images').remove(files.map(f => `${userId}/${courseId}/${f.name}`))
      }
    } catch { /* storage optional */ }
    await supabase.from('courses').delete().eq('id', courseId)
    setCourses(prev => prev.filter(c => c.id !== courseId))
    setDeletingId(null)
    setConfirmId(null)
  }

  const grouped = MODULES.map(m => ({
    module: m,
    courses: courses.filter(c => c.module_id === m.id),
  })).filter(g => g.courses.length > 0)

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ padding: '62px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Bibliothèque</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Mes cours</div>
          </div>
          <Link href="/upload" style={{ width: 40, height: 40, borderRadius: 12, background: A.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
            <Icon name="plus" size={20} color="#fff" strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ height: 70, borderRadius: 16, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)}
        </div>
      ) : !grouped.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon name="fileText" size={32} color={A.primary} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: A.text, marginBottom: 8 }}>Aucun cours</div>
          <div style={{ fontSize: 14, color: A.textMuted, marginBottom: 28 }}>Scannez vos fascicules pour commencer.</div>
          <Link href="/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: A.primary, color: '#fff', fontFamily: A.font, fontSize: 15, fontWeight: 600, padding: '14px 24px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
            <Icon name="plus" size={16} color="#fff" /> Ajouter un cours
          </Link>
        </div>
      ) : (
        <div style={{ padding: '20px 20px 0' }}>
          {grouped.map(({ module: m, courses: mCourses }) => (
            <div key={m.id} style={{ marginBottom: 20 }}>
              <Link href={`/module/${m.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: A.primary, padding: '2px 7px', borderRadius: 6, background: A.primarySoft }}>{m.id}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: A.textMuted }}>{m.label}</div>
                <Icon name="chevronR" size={12} color={A.textDim} />
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mCourses.map(course => (
                  <div key={course.id} style={{ background: A.surface, borderRadius: 16, padding: 14, boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="fileText" size={18} color={A.primary} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</div>
                      <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2 }}>{course.page_count ?? 0} page{(course.page_count ?? 0) > 1 ? 's' : ''}</div>
                    </div>
                    {confirmId === course.id ? (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => setConfirmId(null)} style={{ padding: '6px 10px', borderRadius: 8, border: `0.5px solid ${A.border}`, background: A.bg, fontSize: 12, fontWeight: 600, color: A.textMuted, cursor: 'pointer', fontFamily: A.font }}>Annuler</button>
                        <button onClick={() => deleteCourse(course.id)} disabled={deletingId === course.id} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: A.red, fontSize: 12, fontWeight: 600, color: '#fff', cursor: deletingId === course.id ? 'default' : 'pointer', fontFamily: A.font, opacity: deletingId === course.id ? 0.6 : 1 }}>
                          {deletingId === course.id ? '…' : 'Supprimer'}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(course.id)} style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <Icon name="trash" size={14} color={A.red} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
