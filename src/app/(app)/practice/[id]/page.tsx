'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import { useAppData } from '@/lib/app-context'
import { useThemeBg, themeBgStyle } from '@/lib/theme-bg'
import { recordSession } from '@/lib/recordSession'
import { addFlashXP } from '@/lib/flash-store'
import { computeXP, xpToLevel } from '@/lib/xp'
import Icon from '@/components/ui/Icon'
import PetCompanion from '@/components/pet/PetCompanion'
import type { PetType, PetState } from '@/components/pet/PetCompanion'
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

type LessonExo = { id: string; n: number; score: number | null }

export default function PracticeExercisePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [themeId] = useThemeBg()
  const { data: appData, refresh } = useAppData()
  const startRef = useRef<number>(Date.now())

  const [exo, setExo] = useState<Exercise | null>(null)
  const [nextExoId, setNextExoId] = useState<string | null>(null)
  const [lessonExos, setLessonExos] = useState<LessonExo[]>([])
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
  const [petState, setPetState] = useState<PetState>('idle')
  const [xpAnim, setXpAnim] = useState<number>(0)

  // 1. Charge l'exo
  useEffect(() => {
    const supabase = createClient() as any
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      startRef.current = Date.now()
      supabase.from('practical_exercises')
        .select('id,n,category,title,prompt,rows,extra,explanation')
        .eq('id', id).single()
        .then(({ data }: any) => {
          if (data) setExo(data as Exercise)
          setLoading(false)
        })
    })
  }, [id, router])

  // 2. Charge les exos de la leçon (groupe de 5) + leurs scores
  useEffect(() => {
    if (!exo || !userId) return
    const supabase = createClient() as any
    const lessonIdx = Math.floor((exo.n - 1) / 5)
    const startN = lessonIdx * 5 + 1
    const endN = startN + 4
    Promise.all([
      supabase.from('practical_exercises')
        .select('id,n')
        .eq('user_id', userId).eq('category', exo.category)
        .gte('n', startN).lte('n', endN).order('n', { ascending: true }),
      supabase.from('practical_attempts')
        .select('exercise_id,score').eq('user_id', userId),
    ]).then(([exRes, atRes]: any) => {
      const exos = exRes.data ?? []
      const attempts = atRes.data ?? []
      const enriched: LessonExo[] = exos.map((e: any) => {
        const xs = attempts.filter((a: any) => a.exercise_id === e.id)
        const best = xs.length > 0 ? Math.max(...xs.map((a: any) => a.score)) : null
        return { id: e.id, n: e.n, score: best }
      })
      setLessonExos(enriched)
    })
    // Exo suivant (n+1 dans la catégorie)
    supabase.from('practical_exercises')
      .select('id,n').eq('user_id', userId).eq('category', exo.category)
      .gt('n', exo.n).order('n', { ascending: true }).limit(1)
      .then(({ data }: any) => {
        setNextExoId(data && data.length > 0 ? data[0].id : null)
      })
  }, [exo, userId])

  async function handleValidate() {
    if (!exo || !userId) return
    setPetState('thinking')

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

    // Pet réagit
    setTimeout(() => setPetState(score >= 1 ? 'correct' : 'wrong'), 100)

    // XP — donne 10 XP par cellule correcte, 2 par incorrecte (cohérent avec quiz)
    const earnedXP = r.cellsCorrect * 10 + (r.cellsTotal - r.cellsCorrect) * 2
    if (earnedXP > 0) {
      addFlashXP(earnedXP)
      setXpAnim(earnedXP)
    }

    // Enregistre minutes étudiées (fait remonter streak)
    const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
    void recordSession(userId, elapsed)

    // Insert attempt
    const supabase = createClient() as any
    await supabase.from('practical_attempts').insert({
      user_id: userId,
      exercise_id: exo.id,
      answers: { rows: userRows, schema_dentaire: userSchema, questions: userAnswers, calculs: userCalculs, devis: userDevis },
      cells_correct: r.cellsCorrect,
      cells_total: r.cellsTotal,
      score: r.score,
    })

    // Met à jour appData pour refléter XP/minutes/streak partout
    void refresh()
  }

  function handleRetry() {
    setValidated(false)
    setResult(null)
    setUserRows([])
    setUserSchema({})
    setUserAnswers({})
    setUserCalculs({})
    setUserDevis([])
    setRetryKey(k => k + 1)
    setPetState('idle')
    setXpAnim(0)
    startRef.current = Date.now()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${A.primary}`, borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!exo) return <div style={{ padding: 24, textAlign: 'center', color: A.textMuted }}>Exercice introuvable.</div>

  const hasSchema = !!exo.extra?.schema_dentaire
  const hasQuestions = !!(exo.extra?.questions && exo.extra.questions.length > 0)
  const hasCalculs = !!exo.extra?.calculs
  const hasDevis = !!(exo.extra?.devis && exo.extra.devis.length > 0)

  // Position dans la leçon (groupe de 5)
  const lessonIdx = Math.floor((exo.n - 1) / 5)
  const startN = lessonIdx * 5 + 1
  const positionInLesson = exo.n - startN

  // Pet props : on récupère depuis appData
  const petType = (appData?.profile.pet_type as PetType) ?? 'cat'
  const xpFromAttempts = appData ? computeXP(appData.attempts) : 0
  const totalXP = xpFromAttempts + (appData?.flashXpBonus ?? 0)
  const level = xpToLevel(totalXP)

  return (
    <div style={{ minHeight: '100%', ...themeBgStyle(themeId), paddingBottom: 100, fontFamily: A.font }}>
      <style>{`
        @keyframes xp-float{0%{opacity:1;transform:translateY(0) scale(1)}30%{opacity:1;transform:translateY(-18px) scale(1.25)}100%{opacity:0;transform:translateY(-64px) scale(0.8)}}
      `}</style>

      {/* +XP float */}
      {xpAnim > 0 && (
        <div key={`xp-${xpAnim}`} style={{
          position: 'fixed', bottom: 184, right: 28, zIndex: 30, pointerEvents: 'none',
          fontSize: 22, fontWeight: 900, color: '#FFD84A',
          textShadow: '0 0 14px rgba(255,216,74,0.7), 0 2px 4px rgba(0,0,0,0.4)',
          animation: 'xp-float 1.6s ease-out forwards',
          fontFamily: A.font,
        }}>+{xpAnim} XP</div>
      )}

      {/* Pet companion — peek bottom-right */}
      <div style={{
        position: 'fixed', bottom: 72, right: 12, zIndex: 25, pointerEvents: 'none',
        transform: (petState === 'idle' || petState === 'thinking') ? 'translateY(62px)' : 'translateY(0)',
        transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <PetCompanion petType={petType} state={petState} size={84} level={level} />
      </div>

      {/* Top bar : close + segmented progress + N/5 */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/practice')}
            aria-label="Quitter"
            style={{
              width: 36, height: 36, borderRadius: 12, background: '#fff',
              border: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, cursor: 'pointer',
            }}>
            <Icon name="x" size={14} color={A.text} strokeWidth={2.2} />
          </button>

          {/* Segments — un par cas de la leçon */}
          <div style={{ flex: 1, display: 'flex', gap: 3 }}>
            {Array.from({ length: Math.max(lessonExos.length, 1) }).map((_, i) => {
              const e = lessonExos[i]
              const isCurrent = i === positionInLesson
              const done = e && (e.score ?? 0) >= 1
              const started = e && e.score !== null && !done
              const bg = isCurrent
                ? A.primary
                : done   ? '#16A34A'
                : started ? '#F59E0B'
                : '#E4E8EE'
              return (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 3,
                  background: bg,
                  boxShadow: isCurrent ? `0 0 0 2px ${A.primary}33` : 'none',
                  transition: 'background .3s ease',
                }} />
              )
            })}
          </div>

          <div style={{
            fontSize: 13, fontWeight: 800, color: A.text,
            fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right',
          }}>
            {positionInLesson + 1}<span style={{ color: '#9CA3AF', fontWeight: 500 }}>/{Math.max(lessonExos.length, 1)}</span>
          </div>
        </div>
      </div>

      {/* Énoncé + sections */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 12px' }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: 18,
          border: `1px solid ${A.border}`, marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: A.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' }}>
            Cas #{exo.n}
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

        {exo.rows && exo.rows.length > 0 && (
          <FeuilleSoins
            key={`feuille-${retryKey}`}
            expected={exo.rows}
            showCorrection={validated}
            onChange={setUserRows}
          />
        )}

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
                    Cas suivant
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
