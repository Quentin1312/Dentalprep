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

const CATEGORIES: { id: string; label: string; emoji: string; description: string }[] = [
  { id: 'actes_isoles',       label: 'Actes isolés',           emoji: '🦷', description: 'Coder un acte simple sur la feuille de soins' },
  { id: 'procedures',         label: 'Procédures',             emoji: '🔧', description: "Regroupements d'actes isolés" },
  { id: 'gestes_compl',       label: 'Gestes compl.',          emoji: '➕', description: 'Actes associés (radios endo, etc.)' },
  { id: 'associations',       label: 'Associations',           emoji: '🔗', description: 'Plusieurs actes en même séance' },
  { id: 'modificateurs',      label: 'Modificateurs',          emoji: '⚡', description: 'N, E, U, F, M, MCD, 9...' },
  { id: 'prothese_fixe',      label: 'Prothèse fixe',          emoji: '👑', description: 'Couronnes, inlay-cores, bridges' },
  { id: 'cmu_css',            label: 'CMU / CSS',              emoji: '💳', description: 'Patients bénéficiaires CSS' },
  { id: 'ebd',                label: 'EBD',                    emoji: '🩺', description: 'Examen bucco-dentaire de prévention' },
  { id: 'devis',              label: 'Devis',                  emoji: '📝', description: 'Établir un devis dentaire' },
  { id: 'calculs_amo_amc',    label: 'Calculs AMO/AMC',        emoji: '💰', description: 'Calcul des remboursements' },
  { id: 'cas_complet',        label: 'Cas complets',           emoji: '📋', description: 'Admin + schéma + feuille + devis' },
]

export default function PracticePage() {
  const router = useRouter()
  const [themeId] = useThemeBg()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

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

  // Stats par catégorie (calcul une seule fois)
  const stats = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catExs = exercises.filter(e => e.category === cat.id)
      const done = catExs.filter(e => (bestScore(e.id) ?? 0) >= 1).length
      const started = catExs.filter(e => bestScore(e.id) !== null).length
      return { ...cat, total: catExs.length, done, started, exercises: catExs }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, attempts])

  // Catégories qui ont au moins 1 exo
  const visibleCats = stats.filter(c => c.total > 0)

  // Catégorie active = première non-complète par défaut, sinon première
  const activeCatId = selectedCat ?? (
    visibleCats.find(c => c.done < c.total)?.id ?? visibleCats[0]?.id ?? null
  )
  const activeCat = visibleCats.find(c => c.id === activeCatId)

  // Stats globales
  const totalExos = exercises.length
  const totalDone = exercises.filter(e => (bestScore(e.id) ?? 0) >= 1).length

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

      {/* Sélecteur compact de catégorie */}
      {!loading && activeCat && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '4px 16px 8px' }}>
          <button
            onClick={() => setSheetOpen(true)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              borderRadius: 12,
              border: `1px solid ${A.border}`,
              background: '#fff',
              fontFamily: A.font, cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 18 }}>{activeCat.emoji}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: A.text }}>
              {activeCat.label}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800,
              padding: '2px 8px', borderRadius: 999,
              background: activeCat.done === activeCat.total ? '#DCFCE7' : '#F4F6FA',
              color: activeCat.done === activeCat.total ? '#16A34A' : A.textMuted,
            }}>
              {activeCat.done}/{activeCat.total}
            </span>
            <Icon name="chevronD" size={16} color={A.textMuted} />
          </button>
        </div>
      )}

      {/* Bottom sheet sélecteur de catégorie */}
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
                    border: active ? `2px solid ${A.primary}` : `1px solid ${A.border}`,
                    background: active ? '#EEF4FF' : '#fff',
                    fontFamily: A.font, cursor: 'pointer', textAlign: 'left',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{cat.emoji}</span>
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

      {/* Contenu de la catégorie active */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '14px 12px' }}>
        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: A.textMuted }}>Chargement…</div>
        )}

        {!loading && activeCat && (
          <>
            {/* Liste des exos de la catégorie active */}
            <div style={{
              background: '#fff', borderRadius: 16,
              border: `1px solid ${A.border}`, overflow: 'hidden',
            }}>
              {activeCat.exercises.map((ex, i) => {
                const score = bestScore(ex.id)
                const isDone = (score ?? 0) >= 1
                const started = score !== null && !isDone
                return (
                  <Link key={ex.id} href={`/practice/${ex.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderTop: i > 0 ? `1px solid ${A.border}` : 'none',
                      cursor: 'pointer',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10,
                          background: isDone ? '#DCFCE7' : started ? '#FEF3C7' : '#EEF2F7',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 900,
                          color: isDone ? '#16A34A' : started ? '#D97706' : A.textMuted,
                          flexShrink: 0,
                        }}>
                          {isDone ? '✓' : ex.n}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: 13, color: A.text, fontWeight: 600,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {ex.title}
                          </div>
                          {score !== null && (
                            <div style={{ fontSize: 11, color: isDone ? '#16A34A' : '#D97706', fontWeight: 700, marginTop: 2 }}>
                              Meilleur score {Math.round(score * 100)}%
                            </div>
                          )}
                        </div>
                      </div>
                      <Icon name="chevronR" size={16} color={A.textMuted} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

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
