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

      {/* Pills horizontales — catégories */}
      {!loading && visibleCats.length > 0 && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 5,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: `1px solid ${A.border}`,
          padding: '10px 0',
        }}>
          <div style={{
            display: 'flex', gap: 8, padding: '0 16px',
            overflowX: 'auto', scrollbarWidth: 'none',
          }}
            // Hide webkit scrollbar
          >
            <style>{`.pills-row::-webkit-scrollbar { display: none; }`}</style>
            <div className="pills-row" style={{ display: 'flex', gap: 8 }}>
              {visibleCats.map(cat => {
                const active = cat.id === activeCatId
                const complete = cat.done === cat.total && cat.total > 0
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    style={{
                      flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px',
                      borderRadius: 999,
                      border: active ? `2px solid ${A.primary}` : `1px solid ${A.border}`,
                      background: active ? A.primary : '#fff',
                      color: active ? '#fff' : A.text,
                      fontSize: 13, fontWeight: 700,
                      fontFamily: A.font, cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                    {cat.label}
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      padding: '2px 6px', borderRadius: 999,
                      background: active ? 'rgba(255,255,255,0.25)' : (complete ? '#DCFCE7' : '#F4F6FA'),
                      color: active ? '#fff' : (complete ? '#16A34A' : A.textMuted),
                    }}>
                      {cat.done}/{cat.total}
                    </span>
                  </button>
                )
              })}
            </div>
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
            {/* Bannière de la catégorie */}
            <div style={{
              background: '#fff', borderRadius: 16, padding: '14px 16px',
              border: `1px solid ${A.border}`, marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#EEF4FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {activeCat.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: A.text, letterSpacing: -0.2 }}>
                  {activeCat.label}
                </div>
                <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2 }}>
                  {activeCat.description}
                </div>
              </div>
              {/* Mini barre de progression */}
              <div style={{ minWidth: 70 }}>
                <div style={{
                  height: 6, borderRadius: 999, background: '#F4F6FA', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: activeCat.total > 0 ? `${(activeCat.done / activeCat.total) * 100}%` : '0%',
                    background: activeCat.done === activeCat.total ? '#16A34A' : A.primary,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: A.textMuted, marginTop: 4, textAlign: 'right', fontWeight: 700 }}>
                  {activeCat.done}/{activeCat.total}
                </div>
              </div>
            </div>

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
