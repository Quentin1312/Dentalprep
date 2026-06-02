'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import { useThemeBg, themeBgStyle } from '@/lib/theme-bg'
import Icon from '@/components/ui/Icon'

type Exercise = {
  id: string
  n: number
  category: string
  title: string
}

type Attempt = {
  exercise_id: string
  score: number
  created_at: string
}

const LESSON_SIZE = 5

const CATEGORIES: { id: string; label: string; icon: string; description: string; accent: string }[] = [
  { id: 'actes_isoles',       label: 'Actes isolés',      icon: 'tooth',       description: 'Coder un acte simple sur la feuille de soins', accent: '#0A66E0' },
  { id: 'procedures',         label: 'Procédures',        icon: 'layers',      description: "Regroupements d'actes isolés",                  accent: '#0D9488' },
  { id: 'gestes_compl',       label: 'Gestes compl.',     icon: 'plus',        description: 'Actes associés (radios endo, etc.)',            accent: '#7C3AED' },
  { id: 'associations',       label: 'Associations',      icon: 'link2',       description: 'Plusieurs actes en même séance',                accent: '#E11D48' },
  { id: 'modificateurs',      label: 'Modificateurs',     icon: 'bolt',        description: 'N, E, U, F, M, MCD, 9...',                      accent: '#D97706' },
  { id: 'prothese_fixe',      label: 'Prothèse fixe',     icon: 'crown',       description: 'Couronnes, inlay-cores, bridges',               accent: '#5B21B6' },
  { id: 'cmu_css',            label: 'CMU / CSS',         icon: 'creditCard',  description: 'Patients bénéficiaires CSS',                    accent: '#0D9488' },
  { id: 'ebd',                label: 'EBD',               icon: 'stethoscope', description: 'Examen bucco-dentaire de prévention',           accent: '#0A66E0' },
  { id: 'devis',              label: 'Devis',             icon: 'edit',        description: 'Établir un devis dentaire',                     accent: '#D97706' },
  { id: 'calculs_amo_amc',    label: 'Calculs AMO/AMC',   icon: 'calculator',  description: 'Calcul des remboursements',                     accent: '#16A34A' },
  { id: 'cas_complet',        label: 'Cas complets',      icon: 'clipboard',   description: 'Admin + schéma + feuille + devis',              accent: '#5B21B6' },
]

type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed'

export default function PracticePage() {
  const router = useRouter()
  const [themeId] = useThemeBg()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('practice_active_cat')
  })
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (selectedCat) localStorage.setItem('practice_active_cat', selectedCat)
  }, [selectedCat])

  useEffect(() => {
    const supabase = createClient() as any
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.replace('/auth/login'); return }
      Promise.all([
        supabase.from('practical_exercises').select('id,n,category,title').eq('user_id', user.id).order('n'),
        supabase.from('practical_attempts').select('exercise_id,score,created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]).then(([ex, at]: any) => {
        setExercises(ex.data ?? [])
        setAttempts(at.data ?? [])
        setLoading(false)
      })
    })
  }, [router])

  function bestScore(exId: string): number | null {
    const xs = attempts.filter(a => a.exercise_id === exId)
    if (xs.length === 0) return null
    return Math.max(...xs.map(a => a.score))
  }

  const stats = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catExs = exercises.filter(e => e.category === cat.id)
      const done = catExs.filter(e => (bestScore(e.id) ?? 0) >= 1).length
      return { ...cat, total: catExs.length, done, exercises: catExs }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, attempts])

  const visibleCats = stats.filter(c => c.total > 0)
  const activeCatId = selectedCat ?? (visibleCats.find(c => c.done < c.total)?.id ?? visibleCats[0]?.id ?? null)
  const activeCat = visibleCats.find(c => c.id === activeCatId)

  const totalExos = exercises.length
  const totalDone = exercises.filter(e => (bestScore(e.id) ?? 0) >= 1).length

  // Découpe la catégorie active en leçons de LESSON_SIZE
  const lessons = useMemo(() => {
    if (!activeCat) return []
    const chunks: { idx: number; exercises: Exercise[]; done: number; started: number; status: LessonStatus }[] = []
    for (let i = 0; i < activeCat.exercises.length; i += LESSON_SIZE) {
      const slice = activeCat.exercises.slice(i, i + LESSON_SIZE)
      const doneCount = slice.filter(e => (bestScore(e.id) ?? 0) >= 1).length
      const startedCount = slice.filter(e => bestScore(e.id) !== null).length
      chunks.push({
        idx: chunks.length,
        exercises: slice,
        done: doneCount,
        started: startedCount,
        status: 'locked', // calculé après
      })
    }
    // status par cascade : 1ère leçon dispo, les suivantes débloquées si la précédente est completed
    for (let i = 0; i < chunks.length; i++) {
      const l = chunks[i]
      if (i === 0 || chunks[i - 1].done === chunks[i - 1].exercises.length) {
        l.status = l.done === l.exercises.length ? 'completed'
                 : l.started > 0 ? 'in_progress'
                 : 'available'
      } else {
        l.status = 'locked'
      }
    }
    return chunks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat, attempts])

  return (
    <div style={{ minHeight: '100%', ...themeBgStyle(themeId), paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          Entraînement CCAM
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: A.text, letterSpacing: -0.6 }}>
            Cas pratiques
          </div>
          {!loading && totalExos > 0 && (
            <div style={{ fontSize: 13, fontWeight: 700, color: A.textMuted }}>
              {totalDone}/{totalExos} <span style={{ fontSize: 11, color: A.textMuted }}>terminés</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA Drill codes — mémoriser les codes CCAM */}
      {!loading && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '4px 16px 8px' }}>
          <Link href="/practice/drill" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              background: `linear-gradient(135deg, ${A.primary} 0%, #0850B8 100%)`,
              boxShadow: '0 8px 18px -6px rgba(10,102,224,0.45)',
              cursor: 'pointer',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon name="target" size={22} color="#fff" strokeWidth={2} />
              </div>
              <div style={{ flex: 1, color: '#fff' }}>
                <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: -0.2 }}>
                  Drill codes CCAM
                </div>
                <div style={{ fontSize: 11, opacity: 0.92, marginTop: 2, fontWeight: 600 }}>
                  10 codes au pif · 1 minute · mémorise les 3 chiffres
                </div>
              </div>
              <Icon name="chevronR" size={18} color="#fff" strokeWidth={2.4} />
            </div>
          </Link>
        </div>
      )}

      {/* Sélecteur compact de catégorie */}
      {!loading && activeCat && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '4px 16px 8px' }}>
          <button
            onClick={() => setSheetOpen(true)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px',
              borderRadius: 14,
              border: `1px solid ${A.border}`,
              background: '#fff',
              fontFamily: A.font, cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${activeCat.accent}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name={activeCat.icon} size={20} color={activeCat.accent} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: A.text, letterSpacing: -0.2 }}>
                {activeCat.label}
              </div>
              <div style={{ fontSize: 11, color: A.textMuted, marginTop: 1 }}>{activeCat.description}</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 800,
              padding: '3px 10px', borderRadius: 999,
              background: activeCat.done === activeCat.total ? '#DCFCE7' : '#F4F6FA',
              color: activeCat.done === activeCat.total ? '#16A34A' : A.textMuted,
            }}>
              {activeCat.done}/{activeCat.total}
            </span>
            <Icon name="chevronD" size={16} color={A.textMuted} />
          </button>
        </div>
      )}

      {/* Bottom sheet sélecteur */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 50, display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxHeight: '75vh', overflowY: 'auto',
              background: '#fff',
              borderTopLeftRadius: 22, borderTopRightRadius: 22,
              padding: '12px 12px 28px',
              fontFamily: A.font,
              boxShadow: '0 -10px 30px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{
              width: 40, height: 4, background: '#D1D7E0',
              borderRadius: 999, margin: '0 auto 14px',
            }} />
            <div style={{ fontSize: 18, fontWeight: 900, color: A.text, padding: '0 4px 12px' }}>
              Catégories
            </div>
            {visibleCats.map(cat => {
              const active = cat.id === activeCatId
              const complete = cat.done === cat.total && cat.total > 0
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCat(cat.id); setSheetOpen(false) }}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: active ? `2px solid ${cat.accent}` : `1px solid ${A.border}`,
                    background: active ? `${cat.accent}10` : '#fff',
                    fontFamily: A.font, cursor: 'pointer', textAlign: 'left',
                    marginBottom: 6,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${cat.accent}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon name={cat.icon} size={20} color={cat.accent} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: A.text }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: A.textMuted, marginTop: 2 }}>{cat.description}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    padding: '3px 10px', borderRadius: 999,
                    background: complete ? '#DCFCE7' : '#F4F6FA',
                    color: complete ? '#16A34A' : A.textMuted,
                    flexShrink: 0,
                  }}>
                    {cat.done}/{cat.total}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Leçons */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 12px' }}>
        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: A.textMuted }}>Chargement…</div>
        )}

        {!loading && activeCat && lessons.map(lesson => (
          <LessonCard
            key={lesson.idx}
            n={lesson.idx + 1}
            status={lesson.status}
            done={lesson.done}
            total={lesson.exercises.length}
            exercises={lesson.exercises}
            accent={activeCat.accent}
            bestScore={bestScore}
          />
        ))}

        {!loading && totalExos === 0 && (
          <div style={{
            background: '#fff', borderRadius: 16, padding: 24,
            border: `1px solid ${A.border}`, textAlign: 'center',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: A.text }}>Aucun exercice disponible</div>
            <div style={{ fontSize: 12, color: A.textMuted, marginTop: 6 }}>Les cas pratiques seront bientôt disponibles.</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LessonCard : 1 carte par leçon de 5 exos
// ─────────────────────────────────────────────────────────────────────────────

function LessonCard({
  n, status, done, total, exercises, accent, bestScore,
}: {
  n: number
  status: LessonStatus
  done: number
  total: number
  exercises: Exercise[]
  accent: string
  bestScore: (id: string) => number | null
}) {
  const [open, setOpen] = useState(false)

  const isLocked = status === 'locked'
  const isComplete = status === 'completed'
  const isInProgress = status === 'in_progress'

  // Premier exo non-terminé (point d'entrée du tap)
  const nextExo = exercises.find(e => (bestScore(e.id) ?? 0) < 1) ?? exercises[0]
  const ctaLabel = isComplete ? 'Revoir' : isInProgress ? 'Continuer' : 'Commencer'

  return (
    <div style={{
      background: '#fff', borderRadius: 16, marginBottom: 10,
      border: `1px solid ${A.border}`,
      opacity: isLocked ? 0.55 : 1,
      overflow: 'hidden',
    }}>
      {/* Header carte */}
      <div
        onClick={() => !isLocked && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 16px',
          cursor: isLocked ? 'default' : 'pointer',
        }}
      >
        {/* Pastille n° */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: isComplete ? '#DCFCE7' : isLocked ? '#F4F6FA' : `${accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {isLocked ? (
            <Icon name="lock" size={20} color={A.textMuted} strokeWidth={2} />
          ) : isComplete ? (
            <Icon name="check" size={22} color="#16A34A" strokeWidth={3} />
          ) : (
            <span style={{ fontSize: 16, fontWeight: 900, color: accent }}>{n}</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: A.text, letterSpacing: -0.2 }}>
            Exercice {n}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            {exercises.map((e, i) => {
              const score = bestScore(e.id)
              const isDone = (score ?? 0) >= 1
              const isStarted = score !== null && !isDone
              const dotColor = isDone ? '#16A34A' : isStarted ? '#D97706' : '#D1D7E0'
              return (
                <span key={i} style={{
                  width: 8, height: 8, borderRadius: 999, background: dotColor,
                  display: 'inline-block',
                }} />
              )
            })}
            <span style={{ fontSize: 11, color: A.textMuted, fontWeight: 700, marginLeft: 4 }}>
              {done}/{total}
            </span>
          </div>
        </div>

        {!isLocked && (
          <Link
            href={`/practice/${nextExo.id}`}
            onClick={e => e.stopPropagation()}
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            <div style={{
              padding: '8px 16px', borderRadius: 999,
              background: isComplete ? '#F4F6FA' : accent,
              color: isComplete ? A.text : '#fff',
              fontSize: 12, fontWeight: 800,
              fontFamily: A.font,
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>
              {ctaLabel}
            </div>
          </Link>
        )}
      </div>

      {/* Liste déployable des 5 exos */}
      {open && !isLocked && (
        <div style={{ borderTop: `1px solid ${A.border}`, background: '#FBFCFE' }}>
          {exercises.map((e, i) => {
            const score = bestScore(e.id)
            const isDone = (score ?? 0) >= 1
            const isStarted = score !== null && !isDone
            return (
              <Link key={e.id} href={`/practice/${e.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px',
                  borderTop: i > 0 ? `1px solid ${A.border}` : 'none',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: isDone ? '#DCFCE7' : isStarted ? '#FEF3C7' : '#fff',
                    border: `1px solid ${A.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900,
                    color: isDone ? '#16A34A' : isStarted ? '#D97706' : A.textMuted,
                    flexShrink: 0,
                  }}>
                    {isDone ? '✓' : e.n}
                  </div>
                  <div style={{
                    fontSize: 13, color: A.text, flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {e.title}
                  </div>
                  <Icon name="chevronR" size={14} color={A.textMuted} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
