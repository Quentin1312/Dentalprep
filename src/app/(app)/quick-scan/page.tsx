'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import PetCompanion from '@/components/pet/PetCompanion'
import type { PetType, PetState } from '@/components/pet/PetCompanion'
import Companion, { getMood } from '@/components/ui/Companion'
import { useAppData } from '@/lib/app-context'
import { computeXP, xpToLevel } from '@/lib/xp'
import { recordSession } from '@/lib/recordSession'
import { addFlashXP, saveFlashQuestions } from '@/lib/flash-store'

async function compressImage(file: File, maxPx = 600, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        blob => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file),
        'image/jpeg', quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ
  const color = pct >= 80 ? A.green : pct >= 60 ? A.primary : pct >= 40 ? A.amber : A.red
  return (
    <svg width="130" height="130" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke={A.border} strokeWidth="9" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`} transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="50" y="47" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{pct}%</text>
      <text x="50" y="62" textAnchor="middle" fontSize="10" fill={A.textMuted}>précision</text>
    </svg>
  )
}

function calcFlashXP(correct: number, total: number): number {
  const acc = total > 0 ? correct / total : 0
  return correct * 10 + (acc >= 0.8 ? 30 : acc >= 0.6 ? 15 : 0)
}

const MESSAGES = {
  perfect: { title: 'Parfait, tu déchires !',      sub: 'Session excellente — continue sur cette lancée !' },
  good:    { title: 'Bien joué !',                 sub: 'Tu progresses vraiment bien.'                    },
  okay:    { title: 'Pas mal !',                   sub: 'Encore un peu de pratique et ça viendra.'        },
  tough:   { title: 'Courage, tu vas y arriver !', sub: 'La régularité fait toute la différence.'         },
}

type Flashcard = { concept: string; definition: string }
type Question = { question: string; choices: string[]; correct_index: number; explanation: string }
type Phase = 'pick' | 'scanning' | 'flashcards' | 'quiz' | 'done'

export default function QuickScanPage() {
  const router = useRouter()
  const { data, refresh } = useAppData()
  const petType = (data?.profile?.pet_type ?? 'cat') as PetType
  const petLevel = xpToLevel(computeXP(data?.attempts ?? []) + (data?.flashXpBonus ?? 0))
  const fileRef = useRef<HTMLInputElement>(null)
  const startRef = useRef<number>(Date.now())
  const savedRef = useRef<boolean>(false)
  const [files, setFiles] = useState<File[]>([])
  const [phase, setPhase] = useState<Phase>('pick')
  const [error, setError] = useState<string | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [xpGained, setXpGained] = useState(0)

  // Flashcard state
  const [fcIdx, setFcIdx] = useState(0)
  const [fcFlipped, setFcFlipped] = useState(false)

  // Quiz state
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  async function handleScan() {
    if (!files.length) return
    setPhase('scanning')
    setError(null)
    startRef.current = Date.now()
    savedRef.current = false
    try {
      const form = new FormData()
      for (const f of files) {
        const compressed = await compressImage(f)
        form.append('file', compressed)
      }
      const res = await fetch('/api/quick-scan', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur analyse')
      setFlashcards(data.flashcards ?? [])
      setQuestions(data.questions ?? [])
      setFcIdx(0); setFcFlipped(false)
      setQIdx(0); setSelected(null); setAnswers([])
      setPhase(data.flashcards?.length ? 'flashcards' : 'quiz')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setPhase('pick')
    }
  }

  function nextFlashcard() {
    if (fcIdx + 1 >= flashcards.length) {
      setPhase(questions.length ? 'quiz' : 'done')
      if (!questions.length && !savedRef.current) {
        savedRef.current = true
        const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
        const gained = flashcards.length * 5
        setXpGained(gained)
        addFlashXP(gained)
        if (data?.userId) recordSession(data.userId, elapsed).then(() => refresh())
      }
    } else {
      setFcIdx(i => i + 1)
      setFcFlipped(false)
    }
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const correct = idx === questions[qIdx].correct_index
    setAnswers(prev => [...prev, correct])
  }

  async function nextQuestion() {
    const isLast = qIdx + 1 >= questions.length
    if (isLast) {
      if (!savedRef.current) {
        savedRef.current = true
        const finalAnswers = [...answers]
        const score = finalAnswers.filter(Boolean).length
        const total = finalAnswers.length
        const gained = calcFlashXP(score, total)
        setXpGained(gained)
        const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
        addFlashXP(gained)
        saveFlashQuestions(questions)
        if (data?.userId) await recordSession(data.userId, elapsed)
        refresh()
      }
      setPhase('done')
    } else {
      setQIdx(q => q + 1)
      setSelected(null)
    }
  }

  // ── SCANNING ──────────────────────────────────────────────────
  if (phase === 'scanning') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: A.bg, fontFamily: A.font, padding: '0 32px' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', border: `4px solid ${A.primarySoft}`, borderTop: `4px solid ${A.primary}`, animation: 'spin 0.8s linear infinite', marginBottom: 24 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ fontSize: 18, fontWeight: 700, color: A.text, marginBottom: 6 }}>Analyse en cours…</div>
      <div style={{ fontSize: 13, color: A.textMuted }}>OCR + génération des questions</div>
    </div>
  )

  // ── FLASHCARDS ────────────────────────────────────────────────
  if (phase === 'flashcards') {
    const card = flashcards[fcIdx]
    return (
      <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ padding: '60px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="x" size={16} color={A.text} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Quiz Flash · Flashcards</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{fcIdx + 1}<span style={{ color: A.textDim }}>/{flashcards.length}</span></div>
          </div>
        </div>

        <div style={{ padding: '0 20px 10px', display: 'flex', gap: 4 }}>
          {flashcards.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < fcIdx ? A.primary : i === fcIdx ? A.primary + '88' : '#E1E5EC' }} />
          ))}
        </div>

        <div style={{ flex: 1, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
          <div onClick={() => setFcFlipped(f => !f)} style={{ width: '100%', minHeight: 380, position: 'relative', transformStyle: 'preserve-3d', transform: fcFlipped ? 'rotateY(180deg)' : 'rotateY(0)', transition: 'transform .55s cubic-bezier(.2,.7,.3,1)', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, background: A.surface, borderRadius: 20, border: `0.5px solid ${A.border}`, boxShadow: '0 16px 40px rgba(15,27,45,0.08)', padding: 28, display: 'flex', flexDirection: 'column', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
              <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Concept</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4, textAlign: 'center', lineHeight: 1.2 }}>{card.concept}</div>
              </div>
              <div style={{ fontSize: 12, color: A.textDim, textAlign: 'center' }}>Tape pour retourner</div>
            </div>
            <div style={{ position: 'absolute', inset: 0, background: A.text, borderRadius: 20, boxShadow: '0 16px 40px rgba(15,27,45,0.18)', padding: 28, display: 'flex', flexDirection: 'column', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', color: '#fff' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Définition</div>
              <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.5, marginTop: 12, flex: 1, display: 'flex', alignItems: 'center' }}>{card.definition}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '8px 20px 40px' }}>
          <button onClick={nextFlashcard} style={{ width: '100%', height: 52, borderRadius: 14, background: A.primary, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
            {fcIdx + 1 >= flashcards.length ? (questions.length ? 'Passer au quiz →' : 'Terminer') : 'Suivante →'}
          </button>
        </div>
      </div>
    )
  }

  // ── QUIZ ──────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = questions[qIdx]
    const petState: PetState = selected !== null
      ? (selected === q.correct_index ? 'correct' : 'wrong')
      : 'idle'
    return (
      <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          position: 'fixed', bottom: 75, right: 12, zIndex: 25, pointerEvents: 'none',
          transform: petState === 'idle' ? 'translateY(62px)' : 'translateY(0)',
          transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <PetCompanion petType={petType} state={petState} size={84} level={petLevel} equipped={data?.profile.equipped_accessories ?? {}} />
        </div>
        <div style={{ padding: '60px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setPhase('flashcards')} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="chevronL" size={16} color={A.text} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Quiz Flash · QCM</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{qIdx + 1}<span style={{ color: A.textDim }}>/{questions.length}</span></div>
          </div>
        </div>

        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 4 }}>
          {questions.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < answers.length ? (answers[i] ? A.green : A.red) : i === qIdx ? A.primary + '88' : '#E1E5EC' }} />
          ))}
        </div>

        <div style={{ padding: '0 20px', flex: 1 }}>
          <div style={{ background: A.surface, borderRadius: 20, border: `0.5px solid ${A.border}`, padding: 24, marginBottom: 16, boxShadow: '0 4px 16px rgba(15,27,45,0.06)' }}>
            <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: A.text }}>{q.question}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.choices.map((choice, ci) => {
              const isCorrect = ci === q.correct_index
              const isSelected = selected === ci
              let bg: string = A.surface
              let border: string = `0.5px solid ${A.border}`
              let color: string = A.text
              if (selected !== null) {
                if (isCorrect) { bg = A.greenSoft; border = `1.5px solid ${A.green}`; color = A.green }
                else if (isSelected) { bg = '#FEF2F2'; border = `1.5px solid ${A.red}`; color = A.red }
              }
              return (
                <button key={ci} onClick={() => handleAnswer(ci)} disabled={selected !== null} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: bg, border, cursor: selected !== null ? 'default' : 'pointer', fontFamily: A.font, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: selected !== null && isCorrect ? A.green : selected !== null && isSelected ? A.red : '#E9ECF2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: selected !== null && (isCorrect || isSelected) ? '#fff' : A.textMuted }}>{['A','B','C','D'][ci]}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color }}>{choice}</span>
                </button>
              )
            })}
          </div>

          {selected !== null && (
            <>
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 12, background: selected === q.correct_index ? A.greenSoft : '#FEF2F2', border: `0.5px solid ${selected === q.correct_index ? A.green : A.red}30` }}>
                <div style={{ fontSize: 13, color: selected === q.correct_index ? A.green : A.red, fontWeight: 600, marginBottom: 4 }}>
                  {selected === q.correct_index ? '✓ Correct !' : '✗ Incorrect'}
                </div>
                <div style={{ fontSize: 13, color: A.text, lineHeight: 1.4 }}>{q.explanation}</div>
              </div>
              <button onClick={nextQuestion} style={{ marginTop: 12, width: '100%', height: 50, borderRadius: 14, border: 'none', background: A.primary, color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
                {qIdx + 1 >= questions.length ? 'Voir les résultats' : 'Question suivante'} <Icon name="arrowR" size={16} color="#fff" />
              </button>
            </>
          )}
        </div>

        <div style={{ height: 40 }} />
      </div>
    )
  }

  // ── DONE ──────────────────────────────────────────────────────
  if (phase === 'done') {
    const score = answers.filter(Boolean).length
    const total = answers.length
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 100
    const mood = getMood(accuracy)
    const { title, sub } = MESSAGES[mood]
    const wrongQs = questions.filter((_, i) => answers[i] === false)

    return (
      <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '52px 20px 40px', overflowY: 'auto' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Companion + bulle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <Companion mood={mood} size={100} />
          <div style={{ background: A.surface, border: `0.5px solid ${A.border}`, borderRadius: 18, padding: '13px 20px', maxWidth: 280, textAlign: 'center', boxShadow: '0 2px 14px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13, color: A.textMuted, lineHeight: 1.45 }}>{sub}</div>
          </div>
        </div>

        {/* Anneau de score (si quiz joué) */}
        {total > 0 && <ScoreRing pct={accuracy} />}

        {/* Stats */}
        {total > 0 && (
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340, margin: '20px 0 16px' }}>
            {([
              { label: 'Questions', value: total,         color: A.text  },
              { label: 'Correctes', value: score,         color: A.green },
              { label: 'Erreurs',   value: total - score, color: A.red   },
            ] as const).map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, background: A.surface, border: `0.5px solid ${A.border}`, borderRadius: 14, padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: A.textMuted, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Flashcards info si pas de quiz */}
        {total === 0 && flashcards.length > 0 && (
          <div style={{ fontSize: 14, color: A.textMuted, marginBottom: 16 }}>
            {flashcards.length} flashcard{flashcards.length > 1 ? 's' : ''} révisée{flashcards.length > 1 ? 's' : ''}
          </div>
        )}

        {/* XP gagné */}
        <div style={{ background: A.primarySoft, border: `1px solid ${A.primary}33`, borderRadius: 14, padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 340, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>⭐</span>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: A.primary }}>+{xpGained} XP</div>
            <div style={{ fontSize: 12, color: A.textMuted }}>gagnés cette session</div>
          </div>
        </div>

        {/* Questions ratées */}
        {wrongQs.length > 0 && (
          <div style={{ width: '100%', maxWidth: 340, background: A.amberSoft, border: `0.5px solid ${A.amber}30`, borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: A.amber, marginBottom: 8 }}>
              {wrongQs.length} question{wrongQs.length > 1 ? 's' : ''} à retravailler
            </div>
            {wrongQs.map((wq, i) => (
              <div key={i} style={{ fontSize: 12, color: A.text, padding: '4px 0', lineHeight: 1.35, borderTop: i > 0 ? `0.5px solid ${A.amber}30` : 'none' }}>
                {wq.question.length > 72 ? wq.question.slice(0, 72) + '…' : wq.question}
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340 }}>
          <button onClick={() => { setPhase('pick'); setFiles([]); setAnswers([]); setQuestions([]); setFlashcards([]) }} style={{ flex: 1, height: 50, borderRadius: 14, background: A.surface, border: `0.5px solid ${A.borderStrong}`, color: A.text, fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer' }}>
            Nouvelle photo
          </button>
          <button onClick={() => router.push('/library')} style={{ flex: 1, height: 50, borderRadius: 14, background: A.primary, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
            Bibliothèque
          </button>
        </div>
      </div>
    )
  }

  // ── PICK (default) ────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 40 }}>
      <div style={{ padding: '62px 20px 0' }}>
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.textMuted, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: A.font, marginBottom: 16, padding: 0 }}>
          <Icon name="chevronL" size={14} color={A.textMuted} /> Retour
        </button>
        <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Quiz Flash</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Scan rapide</div>
        <div style={{ fontSize: 13, color: A.textMuted, marginTop: 4 }}>Photo → flashcards + quiz instantané par IA</div>
      </div>

      <div style={{ padding: '28px 20px 0' }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{ width: '100%', boxSizing: 'border-box', padding: '40px 20px', border: `2px dashed ${files.length > 0 ? A.primary : A.border}`, borderRadius: 20, background: files.length > 0 ? A.primarySoft : A.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: A.font }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 20, background: files.length > 0 ? A.primary : '#E9ECF2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera" size={28} color={files.length > 0 ? '#fff' : A.textDim} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: files.length > 0 ? A.primary : A.text }}>
            {files.length > 0 ? `${files.length} photo${files.length > 1 ? 's' : ''} sélectionnée${files.length > 1 ? 's' : ''}` : 'Prendre une photo'}
          </div>
          <div style={{ fontSize: 13, color: A.textDim }}>Cours, schéma, tableau… plusieurs photos possibles</div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFilePick} />
      </div>

      {files.length > 0 && (
        <div style={{ padding: '12px 20px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {files.map((f, i) => (
            <img key={i} src={URL.createObjectURL(f)} alt={`Page ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, flexShrink: 0, border: `0.5px solid ${A.border}` }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{ margin: '12px 20px 0', padding: '12px 14px', borderRadius: 12, background: '#FEF2F2', border: `0.5px solid ${A.red}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="warn" size={16} color={A.red} />
          <div style={{ fontSize: 13, color: A.red, fontWeight: 500 }}>{error}</div>
        </div>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        <button
          onClick={handleScan}
          disabled={!files.length}
          style={{ width: '100%', height: 56, borderRadius: 16, border: 'none', background: files.length > 0 ? A.primary : A.surface, color: files.length > 0 ? '#fff' : A.textMuted, fontSize: 16, fontWeight: 700, fontFamily: A.font, cursor: files.length > 0 ? 'pointer' : 'default', opacity: files.length > 0 ? 1 : 0.5, boxShadow: files.length > 0 ? '0 4px 14px rgba(10,102,224,0.28)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <Icon name="sparkle" size={20} color={files.length > 0 ? '#fff' : A.textMuted} />
          Analyser avec l&apos;IA
        </button>
      </div>
    </div>
  )
}
