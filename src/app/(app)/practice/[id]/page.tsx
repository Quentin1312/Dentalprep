'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import { useThemeBg, themeBgStyle } from '@/lib/theme-bg'
import Icon from '@/components/ui/Icon'
import FeuilleSoins, { scoreFeuille, type FsRow } from '@/components/practice/FeuilleSoins'

type Exercise = {
  id: string
  n: number
  category: string
  title: string
  prompt: string
  rows: FsRow[]
  explanation: string | null
}

export default function PracticeExercisePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [themeId] = useThemeBg()
  const [exo, setExo] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRows, setUserRows] = useState<FsRow[]>([])
  const [validated, setValidated] = useState(false)
  const [result, setResult] = useState<{ cellsCorrect: number; cellsTotal: number; score: number } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      supabase.from('practical_exercises')
        .select('id,n,category,title,prompt,rows,explanation')
        .eq('id', id).single()
        .then(({ data }) => {
          if (data) setExo(data as Exercise)
          setLoading(false)
        })
    })
  }, [id, router])

  async function handleValidate() {
    if (!exo || !userId) return
    const r = scoreFeuille(userRows, exo.rows)
    setResult(r)
    setValidated(true)
    const supabase = createClient()
    await supabase.from('practical_attempts').insert({
      user_id: userId,
      exercise_id: exo.id,
      answers: userRows,
      cells_correct: r.cellsCorrect,
      cells_total: r.cellsTotal,
      score: r.score,
    })
  }

  function handleRetry() {
    setValidated(false)
    setResult(null)
    setUserRows(exo!.rows.map(() => ({})))
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: A.textMuted }}>Chargement…</div>
  if (!exo)   return <div style={{ padding: 24, textAlign: 'center', color: A.textMuted }}>Exercice introuvable.</div>

  return (
    <div style={{ minHeight: '100%', ...themeBgStyle(themeId), paddingBottom: 120 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 12px 8px' }}>
        <Link href="/practice" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, color: A.textMuted, fontSize: 13, fontWeight: 700 }}>
          <Icon name="chevronL" size={16} color={A.textMuted} /> Retour
        </Link>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 12px' }}>
        {/* Énoncé */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 18,
          border: `1px solid ${A.border}`, marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: A.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' }}>
            Exercice #{exo.n}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: A.text, marginTop: 4, letterSpacing: -0.3 }}>
            {exo.title}
          </div>
          {exo.prompt && exo.prompt !== exo.title && (
            <div style={{ fontSize: 13, color: A.text, marginTop: 10, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {exo.prompt}
            </div>
          )}
        </div>

        {/* Feuille de soins */}
        <FeuilleSoins
          expected={exo.rows}
          showCorrection={validated}
          onChange={setUserRows}
        />

        {/* Résultat */}
        {validated && result && (
          <div style={{
            background: result.score >= 1 ? '#DCFCE7' : result.score >= 0.5 ? '#FEF3C7' : '#FEE2E2',
            borderRadius: 14, padding: 16, marginTop: 14,
            border: `1px solid ${result.score >= 1 ? '#86EFAC' : result.score >= 0.5 ? '#FDE68A' : '#FCA5A5'}`,
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: A.text }}>
              {result.score >= 1 ? '✅ Bravo, tout est bon !' : `Score : ${result.cellsCorrect}/${result.cellsTotal} (${Math.round(result.score * 100)}%)`}
            </div>
            {exo.explanation && (
              <div style={{ fontSize: 12, color: A.text, marginTop: 8, lineHeight: 1.5 }}>{exo.explanation}</div>
            )}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {!validated ? (
            <button onClick={handleValidate} style={{
              flex: 1, background: A.primary, color: '#fff', border: 'none',
              padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 800,
              fontFamily: A.font, cursor: 'pointer',
            }}>
              Valider
            </button>
          ) : (
            <>
              <button onClick={handleRetry} style={{
                flex: 1, background: '#fff', color: A.primary, border: `1.5px solid ${A.primary}`,
                padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                fontFamily: A.font, cursor: 'pointer',
              }}>
                Recommencer
              </button>
              <Link href="/practice" style={{ flex: 1, textDecoration: 'none' }}>
                <button style={{
                  width: '100%', background: A.primary, color: '#fff', border: 'none',
                  padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                  fontFamily: A.font, cursor: 'pointer',
                }}>
                  Continuer
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
