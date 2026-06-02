'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import { useThemeBg, themeBgStyle } from '@/lib/theme-bg'
import Icon from '@/components/ui/Icon'
import FeuilleSoins, { scoreFeuille, type FsRow } from '@/components/practice/FeuilleSoins'
import SchemaDentaire, { scoreSchema, type ToothMap } from '@/components/practice/SchemaDentaire'
import TextQuestions, { scoreQuestions, type TextQuestion, type AnswerMap } from '@/components/practice/TextQuestions'
import CalculsAmoAmc, { scoreCalculs, type CalculsExpected, type CalculsAnswers } from '@/components/practice/CalculsAmoAmc'
import Devis, { scoreDevis, type DevisRowExpected, type DevisRowAnswer } from '@/components/practice/Devis'
import CcamHelp from '@/components/practice/CcamHelp'

type ExtraData = {
  schema_dentaire?: ToothMap
  questions?: TextQuestion[]
  calculs?: CalculsExpected
  devis?: DevisRowExpected[]
}

type Exercise = {
  id: string
  n: number
  category: string
  title: string
  prompt: string
  rows: FsRow[]
  extra: ExtraData | null
  explanation: string | null
}

export default function PracticeExercisePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [themeId] = useThemeBg()
  const [exo, setExo] = useState<Exercise | null>(null)
  const [nextExoId, setNextExoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRows, setUserRows] = useState<FsRow[]>([])
  const [userSchema, setUserSchema] = useState<ToothMap>({})
  const [userAnswers, setUserAnswers] = useState<AnswerMap>({})
  const [userCalculs, setUserCalculs] = useState<CalculsAnswers>({})
  const [userDevis, setUserDevis] = useState<DevisRowAnswer[]>([])
  const [validated, setValidated] = useState(false)
  const [result, setResult] = useState<{ cellsCorrect: number; cellsTotal: number; score: number } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const supabase = createClient() as any
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      supabase.from('practical_exercises')
        .select('id,n,category,title,prompt,rows,extra,explanation')
        .eq('id', id).single()
        .then(({ data }: any) => {
          if (data) setExo(data as Exercise)
          setLoading(false)
        })
    })
  }, [id, router])

  // Récupère l'exo suivant dans la même catégorie (n+1 ou plus)
  useEffect(() => {
    if (!exo || !userId) return
    const supabase = createClient() as any
    supabase.from('practical_exercises')
      .select('id,n')
      .eq('user_id', userId)
      .eq('category', exo.category)
      .gt('n', exo.n)
      .order('n', { ascending: true })
      .limit(1)
      .then(({ data }: any) => {
        setNextExoId(data && data.length > 0 ? data[0].id : null)
      })
  }, [exo, userId])

  async function handleValidate() {
    if (!exo || !userId) return
    const fs = scoreFeuille(userRows, exo.rows)
    let cellsCorrect = fs.cellsCorrect
    let cellsTotal = fs.cellsTotal
    if (exo.extra?.schema_dentaire) {
      const sc = scoreSchema(userSchema, exo.extra.schema_dentaire)
      cellsCorrect += sc.cellsCorrect
      cellsTotal += sc.cellsTotal
    }
    if (exo.extra?.questions && exo.extra.questions.length > 0) {
      const qs = scoreQuestions(userAnswers, exo.extra.questions)
      cellsCorrect += qs.cellsCorrect
      cellsTotal += qs.cellsTotal
    }
    if (exo.extra?.calculs) {
      const cs = scoreCalculs(userCalculs, exo.extra.calculs)
      cellsCorrect += cs.cellsCorrect
      cellsTotal += cs.cellsTotal
    }
    if (exo.extra?.devis && exo.extra.devis.length > 0) {
      const ds = scoreDevis(userDevis, exo.extra.devis)
      cellsCorrect += ds.cellsCorrect
      cellsTotal += ds.cellsTotal
    }
    const score = cellsTotal > 0 ? cellsCorrect / cellsTotal : 0
    const r = { cellsCorrect, cellsTotal, score }
    setResult(r)
    setValidated(true)
    const supabase = createClient() as any
    await supabase.from('practical_attempts').insert({
      user_id: userId,
      exercise_id: exo.id,
      answers: { rows: userRows, schema_dentaire: userSchema, questions: userAnswers, calculs: userCalculs, devis: userDevis },
      cells_correct: r.cellsCorrect,
      cells_total: r.cellsTotal,
      score: r.score,
    })
  }

  function handleRetry() {
    setValidated(false)
    setResult(null)
    setUserRows([])
    setUserSchema({})
    setUserAnswers({})
    setUserCalculs({})
    setUserDevis([])
    // Force un remount des sous-composants (qui ont leur état interne) :
    setRetryKey(k => k + 1)
    // Remonte en haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', color: A.textMuted }}>Chargement…</div>
  if (!exo)   return <div style={{ padding: 24, textAlign: 'center', color: A.textMuted }}>Exercice introuvable.</div>

  const hasSchema = !!exo.extra?.schema_dentaire
  const hasQuestions = !!(exo.extra?.questions && exo.extra.questions.length > 0)
  const hasCalculs = !!exo.extra?.calculs
  const hasDevis = !!(exo.extra?.devis && exo.extra.devis.length > 0)

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
          <div style={{ marginTop: 12 }}>
            <CcamHelp />
          </div>
        </div>

        {/* Schéma dentaire */}
        {hasSchema && (
          <div style={{ marginBottom: 14 }}>
            <SchemaDentaire
              key={`schema-${retryKey}`}
              expected={exo.extra!.schema_dentaire!}
              showCorrection={validated}
              onChange={setUserSchema}
            />
          </div>
        )}

        {/* Feuille de soins */}
        {exo.rows && exo.rows.length > 0 && (
          <FeuilleSoins
            key={`feuille-${retryKey}`}
            expected={exo.rows}
            showCorrection={validated}
            onChange={setUserRows}
          />
        )}

        {/* Devis */}
        {hasDevis && (
          <div style={{ marginTop: 14 }}>
            <Devis
              key={`devis-${retryKey}`}
              rows={exo.extra!.devis!}
              showCorrection={validated}
              onChange={setUserDevis}
            />
          </div>
        )}

        {/* Calculs AMO/AMC */}
        {hasCalculs && (
          <div style={{ marginTop: 14 }}>
            <CalculsAmoAmc
              key={`calculs-${retryKey}`}
              expected={exo.extra!.calculs!}
              showCorrection={validated}
              onChange={setUserCalculs}
            />
          </div>
        )}

        {/* Questions ouvertes */}
        {hasQuestions && (
          <div style={{ marginTop: 14 }}>
            <TextQuestions
              key={`questions-${retryKey}`}
              questions={exo.extra!.questions!}
              showCorrection={validated}
              onChange={setUserAnswers}
            />
          </div>
        )}

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
              {nextExoId ? (
                <Link href={`/practice/${nextExoId}`} style={{ flex: 1, textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', background: A.primary, color: '#fff', border: 'none',
                    padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                    fontFamily: A.font, cursor: 'pointer',
                  }}>
                    Exercice suivant
                  </button>
                </Link>
              ) : (
                <Link href="/practice" style={{ flex: 1, textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', background: A.primary, color: '#fff', border: 'none',
                    padding: '14px 18px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                    fontFamily: A.font, cursor: 'pointer',
                  }}>
                    Retour
                  </button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
