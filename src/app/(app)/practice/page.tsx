'use client'

import { useEffect, useState } from 'react'
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
  { id: 'actes_isoles',       label: 'Actes isolés',         emoji: '🦷', description: 'Coder un acte simple sur la feuille de soins' },
  { id: 'procedures',         label: 'Procédures',           emoji: '🔧', description: 'Regroupements d\'actes isolés' },
  { id: 'gestes_compl',       label: 'Gestes complémentaires', emoji: '➕', description: 'Actes associés (radios endo, etc.)' },
  { id: 'associations',       label: 'Associations d\'actes', emoji: '🔗', description: 'Plusieurs actes en même séance' },
  { id: 'modificateurs',      label: 'Modificateurs',        emoji: '⚡', description: 'N, E, U, F, M, MCD, 9...' },
  { id: 'prothese_fixe',      label: 'Prothèse fixe',        emoji: '👑', description: 'Couronnes, inlay-cores, bridges' },
  { id: 'cmu_css',            label: 'CMU / CSS',            emoji: '💳', description: 'Patients bénéficiaires CSS' },
]

export default function PracticePage() {
  const router = useRouter()
  const [themeId] = useThemeBg()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div style={{ minHeight: '100%', ...themeBgStyle(themeId), paddingBottom: 100 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' }}>
          Entraînement CCAM
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: A.text, letterSpacing: -0.6, marginTop: 4 }}>
          Cas pratiques
        </div>
        <div style={{ fontSize: 13, color: A.textMuted, marginTop: 4 }}>
          Coder les actes sur la feuille de soins, comme à l'examen.
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 12px' }}>
        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: A.textMuted }}>Chargement…</div>
        )}

        {!loading && CATEGORIES.map(cat => {
          const catExs = exercises.filter(e => e.category === cat.id)
          if (catExs.length === 0) return null
          const done = catExs.filter(e => (bestScore(e.id) ?? 0) >= 1).length
          return (
            <div key={cat.id} style={{
              background: '#fff', borderRadius: 16, marginBottom: 12,
              border: `1px solid ${A.border}`, overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 16px', borderBottom: `1px solid ${A.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24 }}>{cat.emoji}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: A.text }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: A.textMuted, marginTop: 2 }}>{cat.description}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 800, color: done === catExs.length ? '#16A34A' : A.textMuted,
                  background: done === catExs.length ? '#DCFCE7' : '#F4F6FA',
                  padding: '4px 10px', borderRadius: 999,
                }}>
                  {done}/{catExs.length}
                </div>
              </div>
              <div>
                {catExs.map(ex => {
                  const score = bestScore(ex.id)
                  const isDone = (score ?? 0) >= 1
                  return (
                    <Link key={ex.id} href={`/practice/${ex.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderTop: `1px solid ${A.border}`, cursor: 'pointer',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: 8,
                            background: isDone ? '#DCFCE7' : '#EEF2F7',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 900, color: isDone ? '#16A34A' : A.textMuted,
                          }}>
                            {ex.n}
                          </div>
                          <div style={{ fontSize: 13, color: A.text, fontWeight: 600 }}>{ex.title}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {score !== null && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: isDone ? '#16A34A' : '#D97706' }}>
                              {Math.round(score * 100)}%
                            </div>
                          )}
                          <Icon name="chevronR" size={16} color={A.textMuted} />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {!loading && exercises.length === 0 && (
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
