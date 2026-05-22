'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recordSession } from '@/lib/recordSession'
import { useAppData } from '@/lib/app-context'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'
import PetCompanion from '@/components/pet/PetCompanion'
import type { PetType, PetState } from '@/components/pet/PetCompanion'
import QuizSummary from './QuizSummary'

type QuestionType = 'qcm' | 'vf' | 'ordre' | 'association'
type Question = {
  id: string
  question: string
  choices: unknown
  correct_index: number
  explanation: string
  module_id: string
  page_image_url?: string | null
  type?: QuestionType
  correct_answer?: unknown
}

const ITEM_H = 60 // hauteur d'un item + gap (pour calcul drag)

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr]
  let h = seed.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0x7fffffff, 0)
  for (let i = result.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) & 0x7fffffff
    const j = h % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export default function QuizClient({
  questions,
  moduleId,
  userId,
  mode = 'normal',
  attemptStats = new Map(),
  petType = 'cat',
  level = 1,
  backHref,
  headerLabel,
  lesson,
  totalLessons,
  nextLessonHref,
}: {
  questions: Question[]
  moduleId: string
  userId: string
  mode?: 'normal' | 'smart'
  attemptStats?: Map<string, { ok: number; total: number }>
  petType?: PetType
  level?: number
  backHref?: string
  headerLabel?: string
  lesson?: number
  totalLessons?: number
  nextLessonHref?: string
}) {
  const router = useRouter()
  const { refresh } = useAppData()
  const startRef = useRef(Date.now())

  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [scoreOk, setScoreOk] = useState(0)
  const [scoreBad, setScoreBad] = useState(0)
  const [finished, setFinished] = useState(false)
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([])
  const [xpAnim, setXpAnim] = useState(0)
  const [nonQcmCorrect, setNonQcmCorrect] = useState<boolean | null>(null)

  // ── ORDRE : drag-to-reorder ───────────────────────────────────────────────
  const [ordreItems, setOrdreItems] = useState<number[]>(() => {
    const c = (questions[0]?.choices as string[]) ?? []
    return seededShuffle(Array.from({ length: c.length }, (_, i) => i), questions[0]?.id ?? '')
  })
  const [activeDrag, setActiveDrag] = useState<{
    fromPos: number
    startY: number
    dy: number
  } | null>(null)

  // ── ASSOCIATION : style Duolingo ──────────────────────────────────────────
  const [assocSelected, setAssocSelected] = useState<{
    side: 'left' | 'right'
    origIdx: number
  } | null>(null)
  const [assocEliminated, setAssocEliminated] = useState<Set<number>>(new Set())
  const [assocFlashWrong, setAssocFlashWrong] = useState<{ left: number; right: number } | null>(null)
  const [assocFlashCorrect, setAssocFlashCorrect] = useState<number | null>(null)

  // ── Question courante ─────────────────────────────────────────────────────
  const q = questions[idx]
  const qType: QuestionType = (q?.type as QuestionType) ?? 'qcm'
  const choices = (q?.choices as string[]) ?? []
  const correctAnswer = (q?.correct_answer as string[]) ?? []
  const total = questions.length

  // Shuffles stables pour l'association (recalcul si question change)
  const assocLeftShuffle = useMemo(
    () => seededShuffle(Array.from({ length: choices.length }, (_, i) => i), (q?.id ?? '') + 'l'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q?.id]
  )
  const assocRightShuffle = useMemo(
    () => seededShuffle(Array.from({ length: correctAnswer.length }, (_, i) => i), (q?.id ?? '') + 'r'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q?.id]
  )

  const canSubmit = !showResult && (() => {
    if (qType === 'qcm' || qType === 'vf') return picked !== null
    if (qType === 'ordre') return true
    if (qType === 'association') return assocEliminated.size === choices.length
    return false
  })()

  const isCurrentCorrect: boolean = showResult
    ? (qType === 'qcm' || qType === 'vf' ? picked === q?.correct_index : nonQcmCorrect === true)
    : false

  const petState: PetState = showResult
    ? (isCurrentCorrect ? 'correct' : 'wrong')
    : canSubmit ? 'thinking' : 'idle'

  const stat = attemptStats.get(q?.id ?? '')
  const wasTricky = stat && stat.total > 0 && stat.ok / stat.total < 0.6

  // ── ORDRE handlers ────────────────────────────────────────────────────────
  function handleOrdreStart(e: React.TouchEvent, displayPos: number) {
    if (showResult) return
    e.preventDefault()
    setActiveDrag({ fromPos: displayPos, startY: e.touches[0].clientY, dy: 0 })
  }
  function handleOrdreMove(e: React.TouchEvent) {
    if (!activeDrag) return
    e.preventDefault()
    setActiveDrag(prev => prev ? { ...prev, dy: e.touches[0].clientY - prev.startY } : null)
  }
  function handleOrdreEnd() {
    if (!activeDrag) return
    const { fromPos, dy } = activeDrag
    const targetPos = Math.max(0, Math.min(ordreItems.length - 1, fromPos + Math.round(dy / ITEM_H)))
    if (targetPos !== fromPos) {
      setOrdreItems(prev => {
        const next = [...prev]
        const [item] = next.splice(fromPos, 1)
        next.splice(targetPos, 0, item)
        return next
      })
    }
    setActiveDrag(null)
  }
  function getOrdreTranslateY(pos: number): number {
    if (!activeDrag) return 0
    const { fromPos, dy } = activeDrag
    if (pos === fromPos) return dy
    const target = Math.max(0, Math.min(ordreItems.length - 1, fromPos + Math.round(dy / ITEM_H)))
    if (fromPos < target && pos > fromPos && pos <= target) return -ITEM_H
    if (fromPos > target && pos >= target && pos < fromPos) return ITEM_H
    return 0
  }

  // ── ASSOCIATION handlers ──────────────────────────────────────────────────
  function handleAssocTap(side: 'left' | 'right', origIdx: number) {
    if (showResult || assocEliminated.has(origIdx) || assocFlashWrong !== null || assocFlashCorrect !== null) return
    if (!assocSelected) {
      setAssocSelected({ side, origIdx })
      return
    }
    if (assocSelected.side === side) {
      setAssocSelected(assocSelected.origIdx === origIdx ? null : { side, origIdx })
      return
    }
    // Deux côtés différents → vérifier la paire
    const leftOI = side === 'left' ? origIdx : assocSelected.origIdx
    const rightOI = side === 'right' ? origIdx : assocSelected.origIdx
    setAssocSelected(null)
    if (leftOI === rightOI) {
      // ✅ Correct : flash vert puis disparaît
      setAssocFlashCorrect(leftOI)
      setTimeout(() => {
        setAssocEliminated(prev => new Set([...prev, leftOI]))
        setAssocFlashCorrect(null)
      }, 380)
    } else {
      // ❌ Faux : flash rouge puis reset
      setAssocFlashWrong({ left: leftOI, right: rightOI })
      setTimeout(() => setAssocFlashWrong(null), 600)
    }
  }

  // ── submit ────────────────────────────────────────────────────────────────
  async function submit() {
    if (!canSubmit) return
    let correct = false
    if (qType === 'qcm' || qType === 'vf') {
      correct = picked === q.correct_index
    } else if (qType === 'ordre') {
      correct = ordreItems.every((choiceIdx, pos) => choiceIdx === pos)
      setNonQcmCorrect(correct)
    } else if (qType === 'association') {
      correct = true // on ne peut soumettre que quand tout est correctement associé
      setNonQcmCorrect(true)
    }
    setShowResult(true)
    if (correct) { setScoreOk(s => s + 1); setXpAnim(n => n + 1) }
    else { setScoreBad(s => s + 1); setWrongQuestions(prev => [...prev, q]) }
    const supabase = createClient()
    supabase.from('quiz_attempts').insert({
      user_id: userId,
      module_id: (q.module_id || moduleId) as ModuleId,
      question_id: q.id,
      selected_index: (qType === 'qcm' || qType === 'vf') ? (picked ?? 0) : (correct ? 1 : 0),
      is_correct: correct,
    }).then(() => refresh())
  }

  // ── next ──────────────────────────────────────────────────────────────────
  async function next() {
    if (idx + 1 >= total) {
      setFinished(true)
      const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
      await recordSession(userId, elapsed)
      return
    }
    const ni = idx + 1
    const nq = questions[ni]
    const nChoices = (nq?.choices as string[]) ?? []
    setIdx(ni)
    setPicked(null); setShowResult(false); setNonQcmCorrect(null)
    setOrdreItems(seededShuffle(Array.from({ length: nChoices.length }, (_, i) => i), nq?.id ?? ''))
    setActiveDrag(null)
    setAssocSelected(null); setAssocEliminated(new Set())
    setAssocFlashWrong(null); setAssocFlashCorrect(null)
  }

  // ── restart ───────────────────────────────────────────────────────────────
  function restart(questionsOverride?: Question[]) {
    if (questionsOverride) {
      sessionStorage.setItem('quiz_retry', JSON.stringify(questionsOverride))
      window.location.reload()
    } else {
      const firstChoices = (questions[0]?.choices as string[]) ?? []
      setIdx(0); setPicked(null); setShowResult(false)
      setScoreOk(0); setScoreBad(0); setFinished(false); setWrongQuestions([])
      setNonQcmCorrect(null)
      setOrdreItems(seededShuffle(Array.from({ length: firstChoices.length }, (_, i) => i), questions[0]?.id ?? ''))
      setActiveDrag(null)
      setAssocSelected(null); setAssocEliminated(new Set())
      setAssocFlashWrong(null); setAssocFlashCorrect(null)
      startRef.current = Date.now()
    }
  }

  // ── Fin du quiz ───────────────────────────────────────────────────────────
  if (finished) return (
    <QuizSummary
      scoreOk={scoreOk} scoreBad={scoreBad} total={total} moduleId={moduleId}
      wrongQuestions={wrongQuestions} onRestart={() => restart()}
      onRestartWrong={(qs) => restart(qs)} backHref={backHref}
      lesson={lesson} totalLessons={totalLessons} nextLessonHref={nextLessonHref}
    />
  )

  const toReviewCount = mode === 'smart' ? questions.filter(q => {
    const s = attemptStats.get(q.id)
    return s && s.total > 0 && s.ok / s.total < 0.5
  }).length : 0

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes xp-float{0%{opacity:1;transform:translateY(0) scale(1)}30%{opacity:1;transform:translateY(-18px) scale(1.25)}100%{opacity:0;transform:translateY(-64px) scale(0.8)}}`}</style>

      {/* +XP flottant */}
      {xpAnim > 0 && (
        <div key={xpAnim} style={{ position: 'fixed', bottom: 148, right: 28, zIndex: 30, pointerEvents: 'none', fontSize: 20, fontWeight: 900, color: '#FFD84A', textShadow: '0 0 14px rgba(255,216,74,0.7), 0 2px 4px rgba(0,0,0,0.4)', animation: 'xp-float 1.1s ease-out forwards', fontFamily: A.font }}>+10 XP</div>
      )}

      {/* Compagnon */}
      <div style={{ position: 'fixed', bottom: 56, right: 12, zIndex: 25, pointerEvents: 'none', transform: (petState === 'idle' || petState === 'thinking') ? 'translateY(62px)' : 'translateY(0)', transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <PetCompanion petType={petType} state={petState} size={84} level={level} />
      </div>

      {/* Barre du haut */}
      <div style={{ padding: '60px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={() => router.push(backHref ?? `/module/${moduleId}`)} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="x" size={16} color={A.text} />
          </button>
          <div style={{ flex: 1, height: 5, background: '#E9ECF2', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${((idx + (showResult ? 1 : 0)) / total) * 100}%`, height: '100%', background: A.primary, borderRadius: 5, transition: 'width .4s' }} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted }}>{idx + 1}<span style={{ color: A.textDim }}>/{total}</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: A.textMuted }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: A.green }} />{scoreOk} ✓</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: A.red }} />{scoreBad} ✗</span>
          </div>
          {mode === 'smart' && toReviewCount > 0 && (
            <div style={{ fontSize: 11, fontWeight: 600, color: A.amber, padding: '3px 8px', borderRadius: 6, background: A.amberSoft }}>🔁 {toReviewCount} à revoir</div>
          )}
        </div>
      </div>

      {/* Zone question */}
      <div style={{ padding: '8px 20px 24px', flex: 1 }}>
        {wasTricky && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: A.amber, background: A.amberSoft, borderRadius: 6, padding: '3px 8px', marginBottom: 8 }}>
            <Icon name="refresh" size={11} color={A.amber} /> Question difficile — déjà ratée
          </div>
        )}
        {qType !== 'qcm' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: A.primary, background: A.primarySoft, borderRadius: 6, padding: '3px 8px', marginBottom: 8 }}>
            {qType === 'vf' ? '⚖️ Vrai ou Faux ?' : qType === 'ordre' ? '↕️ Classe dans le bon ordre' : '🔗 Associe les paires'}
          </div>
        )}
        <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>
          Question {idx + 1} · {headerLabel ?? moduleId}
        </div>
        <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.3, marginBottom: q.page_image_url ? 14 : 20 }}>{q.question}</div>
        {q.page_image_url && (
          <div style={{ marginBottom: 18, borderRadius: 12, overflow: 'hidden', border: `0.5px solid ${A.border}`, background: '#fff', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={q.page_image_url} alt="Schéma" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
        )}

        {/* ── QCM ── */}
        {qType === 'qcm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {choices.map((c, i) => {
              const sel = picked === i
              const isCorr = showResult && i === q.correct_index
              const isWr = showResult && sel && i !== q.correct_index
              let bg = A.surface, border = A.border
              if (isCorr) { bg = A.greenSoft; border = A.green }
              else if (isWr) { bg = '#FEEBEB'; border = A.red }
              else if (sel) { bg = A.primarySoft; border = A.primary }
              return (
                <button key={i} onClick={() => !showResult && setPicked(i)} style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: showResult ? 'default' : 'pointer', textAlign: 'left', fontFamily: A.font, transition: 'all .15s', width: '100%' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, border: `1.5px solid ${sel || isCorr ? border : '#C8CFD9'}`, background: (sel || isCorr) ? border : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {(sel || isCorr) && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{c}</div>
                  {isCorr && <Icon name="check" size={16} color={A.green} strokeWidth={2.5} />}
                  {isWr && <Icon name="x" size={16} color={A.red} strokeWidth={2.5} />}
                </button>
              )
            })}
          </div>
        )}

        {/* ── VF ── */}
        {qType === 'vf' && (
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {['Vrai', 'Faux'].map((label, i) => {
              const sel = picked === i
              const isCorr = showResult && i === q.correct_index
              const isWr = showResult && sel && i !== q.correct_index
              let bg = A.surface, border = A.border, color = A.text
              if (isCorr) { bg = A.greenSoft; border = A.green; color = A.green }
              else if (isWr) { bg = '#FEEBEB'; border = A.red; color = A.red }
              else if (sel) { bg = A.primarySoft; border = A.primary; color = A.primary }
              return (
                <button key={i} onClick={() => !showResult && setPicked(i)} style={{ flex: 1, height: 88, borderRadius: 18, border: `2px solid ${border}`, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: showResult ? 'default' : 'pointer', fontFamily: A.font, transition: 'all .2s' }}>
                  <span style={{ fontSize: 32 }}>{i === 0 ? '✅' : '❌'}</span>
                  <span style={{ fontSize: 17, fontWeight: 700, color }}>{label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── ORDRE : drag pour classer ── */}
        {qType === 'ordre' && !showResult && (
          <div
            style={{ touchAction: 'none', position: 'relative' }}
            onTouchMove={handleOrdreMove}
            onTouchEnd={handleOrdreEnd}
            onTouchCancel={handleOrdreEnd}
          >
            <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 12 }}>
              Glisse les éléments pour les mettre dans le bon ordre ↕️
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
              {ordreItems.map((choiceIdx, displayPos) => {
                const isDragging = activeDrag?.fromPos === displayPos
                const translateY = getOrdreTranslateY(displayPos)
                return (
                  <div
                    key={choiceIdx}
                    onTouchStart={e => handleOrdreStart(e, displayPos)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 14px', borderRadius: 14,
                      background: isDragging ? A.primarySoft : A.surface,
                      border: `1.5px solid ${isDragging ? A.primary : A.border}`,
                      transform: `translateY(${translateY}px)`,
                      transition: isDragging ? 'none' : 'transform 0.18s ease',
                      zIndex: isDragging ? 10 : 1,
                      position: 'relative',
                      boxShadow: isDragging ? '0 8px 28px rgba(10,102,224,0.18)' : 'none',
                      userSelect: 'none',
                      cursor: 'grab',
                    }}
                  >
                    {/* Numéro de position */}
                    <div style={{ width: 28, height: 28, borderRadius: 14, background: isDragging ? A.primary : '#E9ECF2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isDragging ? '#fff' : A.textMuted }}>{displayPos + 1}</span>
                    </div>
                    {/* Texte */}
                    <span style={{ fontSize: 14, fontWeight: 500, flex: 1, color: A.text }}>{choices[choiceIdx]}</span>
                    {/* Poignée de drag */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, opacity: isDragging ? 0.8 : 0.35 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 18, height: 2, background: A.textMuted, borderRadius: 2 }} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ORDRE : résultat après validation */}
        {qType === 'ordre' && showResult && (
          <div>
            <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 10 }}>Ton classement :</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ordreItems.map((choiceIdx, pos) => {
                const ok = choiceIdx === pos
                return (
                  <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: ok ? A.greenSoft : '#FEEBEB', border: `1.5px solid ${ok ? A.green : A.red}` }}>
                    <div style={{ width: 26, height: 26, borderRadius: 13, background: ok ? A.green : A.red, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{pos + 1}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{choices[choiceIdx]}</span>
                    {ok ? <Icon name="check" size={15} color={A.green} strokeWidth={2.5} /> : <Icon name="x" size={15} color={A.red} strokeWidth={2.5} />}
                  </div>
                )
              })}
            </div>
            {!ordreItems.every((ci, pos) => ci === pos) && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 8 }}>Ordre correct :</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {choices.map((item, pos) => (
                    <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: A.greenSoft, border: `1px solid ${A.green}30` }}>
                      <div style={{ width: 22, height: 22, borderRadius: 11, background: A.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{pos + 1}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ASSOCIATION : style Duolingo ── */}
        {qType === 'association' && !showResult && (
          <div>
            <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 12 }}>
              {assocSelected
                ? (assocSelected.side === 'left' ? '→ Maintenant choisis à droite' : '← Maintenant choisis à gauche')
                : `Tape une paire · ${assocEliminated.size}/${choices.length} trouvées`}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {/* Colonne gauche */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assocLeftShuffle.map(origIdx => {
                  if (assocEliminated.has(origIdx)) return null
                  const isSel = assocSelected?.side === 'left' && assocSelected.origIdx === origIdx
                  const isFlashOk = assocFlashCorrect === origIdx
                  const isFlashBad = assocFlashWrong?.left === origIdx
                  let bg = A.surface, border = A.border
                  if (isFlashOk) { bg = A.greenSoft; border = A.green }
                  else if (isFlashBad) { bg = '#FEEBEB'; border = A.red }
                  else if (isSel) { bg = A.primarySoft; border = A.primary }
                  return (
                    <button key={origIdx} onClick={() => handleAssocTap('left', origIdx)} style={{ padding: '12px 12px', borderRadius: 12, background: bg, border: `2px solid ${border}`, cursor: 'pointer', fontFamily: A.font, textAlign: 'left', fontSize: 13, fontWeight: 600, color: A.text, width: '100%', transition: 'all .2s', lineHeight: 1.3 }}>
                      {choices[origIdx]}
                    </button>
                  )
                })}
              </div>
              {/* Colonne droite */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assocRightShuffle.map(origIdx => {
                  if (assocEliminated.has(origIdx)) return null
                  const isSel = assocSelected?.side === 'right' && assocSelected.origIdx === origIdx
                  const isFlashOk = assocFlashCorrect === origIdx
                  const isFlashBad = assocFlashWrong?.right === origIdx
                  let bg = A.surface, border = A.border
                  if (isFlashOk) { bg = A.greenSoft; border = A.green }
                  else if (isFlashBad) { bg = '#FEEBEB'; border = A.red }
                  else if (isSel) { bg = A.primarySoft; border = A.primary }
                  return (
                    <button key={origIdx} onClick={() => handleAssocTap('right', origIdx)} style={{ padding: '12px 12px', borderRadius: 12, background: bg, border: `2px solid ${border}`, cursor: 'pointer', fontFamily: A.font, textAlign: 'left', fontSize: 12, fontWeight: 500, color: A.text, width: '100%', transition: 'all .2s', lineHeight: 1.3 }}>
                      {correctAnswer[origIdx]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ASSOCIATION : résultat */}
        {qType === 'association' && showResult && (
          <div>
            <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 10 }}>Associations correctes :</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {choices.map((leftItem, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: A.greenSoft, border: `1.5px solid ${A.green}40`, fontSize: 13, fontWeight: 600, color: A.text, lineHeight: 1.3 }}>
                    {leftItem}
                  </div>
                  <div style={{ color: A.green, fontSize: 16, flexShrink: 0 }}>→</div>
                  <div style={{ flex: 1.2, padding: '10px 12px', borderRadius: 10, background: A.greenSoft, border: `1.5px solid ${A.green}40`, fontSize: 12, fontWeight: 500, color: A.text, lineHeight: 1.3 }}>
                    {correctAnswer[i]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explication */}
        {showResult && (
          <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: isCurrentCorrect ? A.greenSoft : '#FEEBEB', border: `0.5px solid ${isCurrentCorrect ? A.green + '40' : A.red + '40'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon name={isCurrentCorrect ? 'check' : 'x'} size={16} color={isCurrentCorrect ? A.green : A.red} strokeWidth={2.5} />
              <div style={{ fontSize: 14, fontWeight: 700, color: isCurrentCorrect ? A.green : A.red }}>
                {isCurrentCorrect ? 'Bravo !' : 'Pas tout à fait'}
              </div>
            </div>
            <div style={{ fontSize: 13, color: A.text, lineHeight: 1.45 }}>{q.explanation}</div>
          </div>
        )}
      </div>

      {/* Bouton bas */}
      <div style={{ padding: '12px 20px 36px' }}>
        {showResult ? (
          <button onClick={next} style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: A.primary, color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
            {idx + 1 >= total ? 'Voir les résultats' : 'Question suivante'} <Icon name="arrowR" size={16} color="#fff" />
          </button>
        ) : (
          <button onClick={submit} disabled={!canSubmit} style={{ width: '100%', height: 52, borderRadius: 14, border: `0.5px solid ${A.borderStrong}`, background: !canSubmit ? A.surface : A.primary, color: !canSubmit ? A.text : '#fff', fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: !canSubmit ? 'default' : 'pointer', opacity: !canSubmit ? 0.45 : 1, boxShadow: canSubmit ? '0 4px 14px rgba(10,102,224,0.28)' : 'none' }}>
            {qType === 'association' && !canSubmit
              ? `${assocEliminated.size}/${choices.length} paires trouvées…`
              : 'Valider'}
          </button>
        )}
      </div>
    </div>
  )
}
