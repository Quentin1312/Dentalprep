'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FASCICULES, MODULE_MAP } from '@/lib/modules'
import { useAppData } from '@/lib/app-context'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'

type Stats = { flashcards: number; questions: number; attempts: number; accuracy: number | null }

function fasciculeN(title: string): number | null {
  const m = title.match(/Fascicule\s+(\d+)/i)
  return m ? parseInt(m[1]) : null
}

export default function FasciculePage() {
  const { courseId } = useParams() as { courseId: string }
  const router = useRouter()
  const { data: appData, refresh } = useAppData()

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const course = appData?.courses.find(c => c.id === courseId)
  const fN = course ? fasciculeN(course.title) : null
  const fascicule = fN !== null ? FASCICULES.find(f => f.n === fN) : null
  const mod = course ? MODULE_MAP[course.module_id as ModuleId] : null

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      Promise.all([
        supabase.from('flashcards').select('id').eq('course_id', courseId),
        supabase.from('quiz_questions').select('id').eq('course_id', courseId),
      ]).then(async ([fc, qq]) => {
        const qids = (qq.data ?? []).map((q: { id: string }) => q.id)
        let attempts: { is_correct: boolean }[] = []
        if (qids.length > 0) {
          const { data: atts } = await supabase.from('quiz_attempts').select('is_correct')
            .eq('user_id', user.id).in('question_id', qids)
          attempts = atts ?? []
        }
        const ok = attempts.filter(a => a.is_correct).length
        setStats({
          flashcards: fc.data?.length ?? 0,
          questions: qq.data?.length ?? 0,
          attempts: attempts.length,
          accuracy: attempts.length > 0 ? Math.round((ok / attempts.length) * 100) : null,
        })
        setLoading(false)
      })
    })
  }, [courseId, router])

  async function handleDelete() {
    if (!appData) return
    setDeleting(true)
    const supabase = createClient()
    try {
      const { data: files } = await supabase.storage.from('course-images')
        .list(`${appData.userId}/${courseId}`)
      if (files?.length) {
        await supabase.storage.from('course-images')
          .remove(files.map(f => `${appData.userId}/${courseId}/${f.name}`))
      }
    } catch {}
    await supabase.from('courses').delete().eq('id', courseId)
    await refresh()
    router.push('/library')
  }

  if (!course && appData) {
    router.replace('/library')
    return null
  }

  const accuracy = stats?.accuracy
  const accuracyColor = accuracy !== null && accuracy !== undefined
    ? accuracy >= 75 ? A.green : A.amber
    : A.textDim

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Header */}
      <div style={{ padding: '62px 20px 0' }}>
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.textMuted, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: A.font, marginBottom: 16, padding: 0 }}>
          <Icon name="chevronL" size={14} color={A.textMuted} /> Bibliothèque
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: A.primarySoft, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: A.primary }}>{mod?.id}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: A.primary, lineHeight: 1 }}>{fN}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{mod?.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2, marginTop: 2 }}>
              {fascicule?.title ?? course?.title ?? '…'}
            </div>
            <div style={{ fontSize: 12, color: A.textMuted, marginTop: 3 }}>{course?.page_count ?? 0} page{(course?.page_count ?? 0) > 1 ? 's' : ''} scannée{(course?.page_count ?? 0) > 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '16px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Flashcards', value: loading ? '…' : String(stats?.flashcards ?? 0), color: A.primary },
          { label: 'Questions', value: loading ? '…' : String(stats?.questions ?? 0), color: A.primary },
          { label: 'Score quiz', value: loading ? '…' : accuracy !== null && accuracy !== undefined ? `${accuracy}%` : '—', color: accuracyColor },
        ].map(s => (
          <div key={s.label} style={{ background: A.surface, borderRadius: 14, padding: '14px 10px', textAlign: 'center', border: `0.5px solid ${A.border}` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: A.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mod && (
          <Link href={`/quiz/${mod.id}?courseId=${courseId}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: A.primary, borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="target" size={22} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Quiz fascicule</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  {loading ? '…' : `${stats?.questions ?? 0} questions`}
                </div>
              </div>
              <Icon name="chevronR" size={16} color="rgba(255,255,255,0.7)" />
            </div>
          </Link>
        )}

        {mod && (
          <Link href={`/flashcards/${mod.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: A.surface, borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, border: `0.5px solid ${A.border}`, boxShadow: '0 1px 3px rgba(15,27,45,0.06)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="cards" size={22} color={A.primary} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: A.text }}>Flashcards</div>
                <div style={{ fontSize: 12, color: A.textMuted }}>
                  {loading ? '…' : `${stats?.flashcards ?? 0} cartes`}
                </div>
              </div>
              <Icon name="chevronR" size={16} color={A.textDim} />
            </div>
          </Link>
        )}
      </div>

      {/* Score history hint */}
      {!loading && stats && stats.attempts > 0 && (
        <div style={{ margin: '14px 20px 0', padding: '12px 14px', borderRadius: 12, background: accuracy !== null && accuracy !== undefined && accuracy >= 75 ? A.greenSoft : A.amberSoft, border: `0.5px solid ${accuracyColor}30` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: accuracyColor }}>
            {accuracy !== null && accuracy !== undefined && accuracy >= 75 ? '✓ Fascicule maîtrisé' : '↗ En cours de révision'}
          </div>
          <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2 }}>
            {stats.attempts} réponse{stats.attempts > 1 ? 's' : ''} enregistrée{stats.attempts > 1 ? 's' : ''} · {accuracy}% de réussite
          </div>
        </div>
      )}

      {/* Delete */}
      <div style={{ padding: '24px 20px 0' }}>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: A.red, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: A.font, padding: 0 }}>
            <Icon name="trash" size={14} color={A.red} /> Supprimer ce fascicule
          </button>
        ) : (
          <div style={{ background: '#FEF2F2', borderRadius: 14, padding: '14px 16px', border: `0.5px solid ${A.red}30` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: A.red, marginBottom: 10 }}>
              Supprimer ce fascicule et toutes ses données ?
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, height: 40, borderRadius: 10, border: `0.5px solid ${A.border}`, background: A.surface, fontSize: 13, fontWeight: 600, color: A.textMuted, cursor: 'pointer', fontFamily: A.font }}>Annuler</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, height: 40, borderRadius: 10, border: 'none', background: A.red, fontSize: 13, fontWeight: 600, color: '#fff', cursor: deleting ? 'default' : 'pointer', fontFamily: A.font, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
