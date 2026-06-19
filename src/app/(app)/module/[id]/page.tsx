'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MODULE_MAP, FASCICULES } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'

type Course = { id: string; title: string; page_count: number | null }

function fasciculeN(title: string): number | null {
  const m = title.match(/Fascicule\s+(\d+)/i)
  return m ? parseInt(m[1]) : null
}

const MODULE_ACCENT: Record<ModuleId, string> = {
  M1: '#0A66E0', M2: '#0D9488', M3: '#7C3AED',
  M4: '#E11D48', M5: '#D97706', M6: '#5B21B6',
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: A.text, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: A.textMuted, fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function ModulePage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [flashcardCount, setFlashcardCount] = useState(0)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [loading, setLoading] = useState(true)

  const mod = MODULE_MAP[id as ModuleId]
  const accent = mod ? MODULE_ACCENT[id as ModuleId] : A.primary
  const mFascicules = FASCICULES.filter(f => f.modules.includes(id as ModuleId))

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }
    const mid = id as ModuleId

    const [{ data: c }, { data: f }, { data: a }] = await Promise.all([
      supabase.from('courses').select('id,title,page_count').order('created_at', { ascending: false }),
      supabase.from('flashcards').select('id').eq('module_id', mid),
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

  if (!mod) return null

  const scannedFascicules = mFascicules.filter(f => courses.some(c => fasciculeN(c.title) === f.n))

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* Header */}
      <div style={{ padding: '54px 20px 0' }}>
        <Link href="/library" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.textMuted, fontWeight: 500, textDecoration: 'none', marginBottom: 16 }}>
          <Icon name="chevronL" size={14} color={A.textMuted} /> Bibliothèque
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${accent}30` }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: accent }}>{mod.id}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Module</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, marginTop: 1, lineHeight: 1.2 }}>{mod.label}</div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E4E8EE', padding: '16px 20px', boxShadow: '0 1px 4px rgba(15,27,45,0.06)', display: 'flex', alignItems: 'center' }}>
          {loading ? (
            <div style={{ width: '100%', height: 42, borderRadius: 8, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
          ) : (
            <>
              <Stat label="fascicules" value={`${scannedFascicules.length}/${mFascicules.length}`} />
              <div style={{ width: 1, height: 32, background: '#E4E8EE' }} />
              <Stat label="questions" value={totalAttempts > 0 ? String(totalAttempts) : '—'} />
              <div style={{ width: 1, height: 32, background: '#E4E8EE' }} />
              <Stat label="réussite" value={accuracy !== null ? `${accuracy}%` : '—'} />
              <div style={{ width: 1, height: 32, background: '#E4E8EE' }} />
              <Stat label="flashcards" value={String(flashcardCount)} />
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link href={`/quiz/${id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}CC 100%)`,
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: `0 8px 20px -6px ${accent}55`,
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="target" size={22} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>Quiz du module</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Toutes les questions · mode intelligent</div>
            </div>
            <Icon name="chevronR" size={16} color="rgba(255,255,255,0.7)" />
          </div>
        </Link>

        <Link href={`/flashcards/${id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            border: '1px solid #E4E8EE',
            boxShadow: '0 2px 8px rgba(15,27,45,0.06)',
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="cards" size={22} color={accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: A.text, letterSpacing: -0.3 }}>Flashcards</div>
              <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2 }}>
                {loading ? '…' : `${flashcardCount} carte${flashcardCount > 1 ? 's' : ''} du module`}
              </div>
            </div>
            <Icon name="chevronR" size={16} color={A.textDim} />
          </div>
        </Link>
      </div>

      {/* Fascicule list */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>
          Fascicules · {scannedFascicules.length}/{mFascicules.length} scannés
        </div>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E4E8EE', overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,27,45,0.06)' }}>
          {mFascicules.map((f, fi) => {
            const course = courses.find(c => fasciculeN(c.title) === f.n)
            const isLast = fi === mFascicules.length - 1
            if (course) {
              return (
                <Link key={f.n} href={`/quiz/${id}?courseId=${course.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: isLast ? 'none' : '1px solid #E4E8EE' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: accent }}>{f.n}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                    <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 500, marginTop: 1 }}>{course.page_count ?? 0} pages</div>
                  </div>
                  <Icon name="chevronR" size={14} color={A.textDim} />
                </Link>
              )
            }
            return (
              <div key={f.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: isLast ? 'none' : '1px solid #E4E8EE', opacity: 0.4 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: A.textDim }}>{f.n}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: A.textDim, fontWeight: 500, marginTop: 1 }}>Non scanné</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
