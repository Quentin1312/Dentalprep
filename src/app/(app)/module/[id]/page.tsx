'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MODULE_MAP } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'

type Course = { id: string; title: string; page_count: number | null }

const BLOC_LABELS: Record<number, string> = {
  1: 'Prise en charge du patient',
  2: 'Assistance au praticien',
  3: 'Gestion du risque infectieux',
  4: 'Gestion des données',
}

function Skel({ h }: { h: number }) {
  return <div style={{ height: h, borderRadius: 14, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

export default function ModulePage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [flashcardCount, setFlashcardCount] = useState(0)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const mod = MODULE_MAP[id as ModuleId]

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }
    setUserId(user.id)
    const mid = id as ModuleId
    const [{ data: c }, { data: f }, { data: a }] = await Promise.all([
      supabase.from('courses').select('id,title,page_count').eq('user_id', user.id).eq('module_id', mid).order('created_at', { ascending: false }),
      supabase.from('flashcards').select('id').eq('user_id', user.id).eq('module_id', mid),
      supabase.from('quiz_attempts').select('is_correct').eq('user_id', user.id).eq('module_id', mid),
    ])
    setCourses(c ?? [])
    setFlashcardCount(f?.length ?? 0)
    const att = a ?? []
    setTotalAttempts(att.length)
    setAccuracy(att.length > 0 ? Math.round((att.filter(x => x.is_correct).length / att.length) * 100) : null)
    setLoading(false)
  }, [id, router])

  useEffect(() => {
    if (!mod) { router.replace('/dashboard'); return }
    load()
  }, [mod, load, router])

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

  if (!mod) return null

  const r = (84 - 7) / 2
  const circ = 2 * Math.PI * r

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div style={{ padding: '62px 20px 0' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.textMuted, fontWeight: 500, textDecoration: 'none', marginBottom: 16 }}>
          <Icon name="chevronL" size={14} color={A.textMuted} /> Accueil
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: A.primary }}>{mod.id}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Bloc {mod.bloc} · {BLOC_LABELS[mod.bloc]}</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, marginTop: 2 }}>{mod.label}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        {loading ? <Skel h={120} /> : (
          <div style={{ background: A.surface, borderRadius: 16, padding: 18, boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
              <svg width={84} height={84} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={42} cy={42} r={r} fill="none" stroke="#E9ECF2" strokeWidth={7} />
                <circle cx={42} cy={42} r={r} fill="none"
                  stroke={accuracy !== null && accuracy >= 75 ? A.green : accuracy !== null ? A.amber : A.border}
                  strokeWidth={7} strokeDasharray={circ}
                  strokeDashoffset={circ * (1 - (accuracy ?? 0) / 100)}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: A.text }}>{accuracy !== null ? `${accuracy}%` : '—'}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: A.text, marginBottom: 4 }}>
                {accuracy === null ? 'Pas encore tenté' : accuracy >= 75 ? 'Module maîtrisé' : 'En progression'}
              </div>
              <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 2 }}>{totalAttempts} questions tentées</div>
              <div style={{ fontSize: 12, color: A.textMuted }}>{flashcardCount} flashcards disponibles</div>
            </div>
          </div>
        )}
      </div>

      {!loading && accuracy !== null && accuracy < 75 && (
        <div style={{ padding: '10px 20px 0' }}>
          <div style={{ background: A.amberSoft, borderRadius: 14, padding: 12, border: `0.5px solid ${A.amber}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="warn" size={18} color={A.amber} />
            <div style={{ flex: 1, fontSize: 13, color: A.text, fontWeight: 500 }}>Score en dessous de 75% — continuez à réviser ce module.</div>
          </div>
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>Modes de révision</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href={`/flashcards/${id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: A.surface, borderRadius: 16, padding: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon name="cards" size={20} color={A.primary} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 3 }}>Flashcards</div>
              <div style={{ fontSize: 11, color: A.textMuted }}>{loading ? '…' : `${flashcardCount} cartes`}</div>
            </div>
          </Link>
          <Link href={`/quiz/${id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: A.surface, borderRadius: 16, padding: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon name="target" size={20} color={A.primary} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 3 }}>Quiz QCM</div>
              <div style={{ fontSize: 11, color: A.textMuted }}>{loading ? '…' : accuracy !== null ? `${accuracy}% réussite` : 'Non tenté'}</div>
            </div>
          </Link>
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' }}>Cours importés</div>
          <Link href="/upload" style={{ fontSize: 12, color: A.primary, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="plus" size={12} color={A.primary} /> Ajouter
          </Link>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><Skel h={66} /><Skel h={66} /></div>
        ) : courses.length ? (
          <div style={{ background: A.surface, borderRadius: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04),0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}`, overflow: 'hidden' }}>
            {courses.map((c, i) => (
              <div key={c.id} style={{ padding: '14px 16px', borderBottom: i < courses.length - 1 ? `0.5px solid ${A.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="fileText" size={16} color={A.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: A.textMuted, marginTop: 1 }}>{c.page_count ?? 0} page{(c.page_count ?? 0) > 1 ? 's' : ''}</div>
                </div>
                {confirmId === c.id ? (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => setConfirmId(null)} style={{ padding: '6px 10px', borderRadius: 8, border: `0.5px solid ${A.border}`, background: A.bg, fontSize: 12, fontWeight: 600, color: A.textMuted, cursor: 'pointer', fontFamily: A.font }}>Annuler</button>
                    <button onClick={() => deleteCourse(c.id)} disabled={deletingId === c.id} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: A.red, fontSize: 12, fontWeight: 600, color: '#fff', cursor: deletingId === c.id ? 'default' : 'pointer', fontFamily: A.font, opacity: deletingId === c.id ? 0.6 : 1 }}>
                      {deletingId === c.id ? '…' : 'Supprimer'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmId(c.id)} style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <Icon name="trash" size={14} color={A.red} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: A.surface, borderRadius: 16, padding: 24, textAlign: 'center', border: `0.5px solid ${A.border}` }}>
            <div style={{ fontSize: 13, color: A.textMuted, marginBottom: 12 }}>Aucun cours importé pour ce module.</div>
            <Link href="/upload" style={{ fontSize: 13, color: A.primary, fontWeight: 600, textDecoration: 'none' }}>+ Ajouter un cours</Link>
          </div>
        )}
      </div>
    </div>
  )
}
