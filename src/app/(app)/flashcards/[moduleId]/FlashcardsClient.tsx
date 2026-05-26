'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recordSession } from '@/lib/recordSession'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Flashcard = { id: string; concept: string; definition: string }
type Status = 'known' | 'review'

export default function FlashcardsClient({
  flashcards: rawCards,
  moduleId,
  userId,
  courseId,
  lesson,
  totalLessons,
  totalCards,
}: {
  flashcards: Flashcard[]
  moduleId: string
  userId: string
  courseId?: string | null
  lesson?: number
  totalLessons?: number
  totalCards?: number
}) {
  const router = useRouter()
  const startRef = useRef<number | null>(null)
  const isCourseLesson = !!courseId && lesson !== undefined
  const lessonLabel = isCourseLesson && totalLessons ? `SÃ©rie ${lesson + 1}/${totalLessons}` : `Flashcards ${moduleId}`
  const quizHref = isCourseLesson
    ? `/quiz/${moduleId}?courseId=${courseId}&lesson=${lesson}`
    : `/quiz/${moduleId}`
  const nextLessonHref = isCourseLesson && totalLessons && lesson + 1 < totalLessons
    ? `/flashcards/${moduleId}?courseId=${courseId}&lesson=${lesson + 1}`
    : null
  // progress map loaded from DB: flashcard_id → status
  const [progress, setProgress] = useState<Record<string, Status>>({})
  const [progressLoaded, setProgressLoaded] = useState(false)
  // current session state
  const [sessionProgress, setSessionProgress] = useState<Record<string, Status>>({})
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)

  const [initialProgress, setInitialProgress] = useState<Record<string, Status> | null>(null)

  // Sort ONCE when progress finishes loading; keep stable for the rest of the session
  // so the progression bar positions don't shuffle as the user marks cards.
  useEffect(() => {
    if (startRef.current === null) startRef.current = Date.now()
  }, [])

  const flashcards = useMemo(() => {
    if (!initialProgress) return rawCards
    return [...rawCards].sort((a, b) => {
      const order = (s: Status | undefined) => s === 'review' ? 0 : s === undefined ? 1 : 2
      return order(initialProgress[a.id]) - order(initialProgress[b.id])
    })
  }, [rawCards, initialProgress])

  const total = flashcards.length
  const card = flashcards[idx]

  // Load previous progress from DB
  useEffect(() => {
    const supabase = createClient()
    supabase.from('flashcard_progress').select('flashcard_id,status').eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, Status> = {}
          data.forEach(r => { map[r.flashcard_id] = r.status as Status })
          setProgress(map)
          setInitialProgress(map)
        }
        setProgressLoaded(true)
      }, () => {
        setInitialProgress({})
        setProgressLoaded(true)
      })
  }, [userId])

  async function handleAction(knew: boolean) {
    const status: Status = knew ? 'known' : 'review'
    setSessionProgress(prev => ({ ...prev, [card.id]: status }))

    // Save to DB (fire-and-forget)
    const supabase = createClient()
    supabase.from('flashcard_progress').upsert(
      { user_id: userId, flashcard_id: card.id, status, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,flashcard_id' }
    ).then(() => setProgress(prev => ({ ...prev, [card.id]: status })))

    if (idx + 1 >= total) {
      setDone(true)
      const elapsed = Math.max(1, Math.round((Date.now() - (startRef.current ?? Date.now())) / 60000))
      await recordSession(userId, elapsed)
      return
    }
    setIdx(i => i + 1)
    setFlipped(false)
  }

  const sessionKnown = Object.values(sessionProgress).filter(s => s === 'known').length
  const sessionReview = Object.values(sessionProgress).filter(s => s === 'review').length
  const totalKnown = Object.values({ ...progress, ...sessionProgress }).filter(s => s === 'known').length

  if (!progressLoaded) return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${A.primary}`, borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: 28, background: `linear-gradient(135deg, ${A.green} 0%, #0E8C3E 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 12px 32px rgba(22,163,74,0.32)' }}>
        <Icon name="check" size={40} color="#fff" strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, color: A.text, marginBottom: 8 }}>Session terminée !</div>
      <div style={{ fontSize: 14, color: A.textMuted, marginBottom: 6 }}>
        <span style={{ color: A.green, fontWeight: 600 }}>{sessionKnown} sues</span> · <span style={{ color: A.amber, fontWeight: 600 }}>{sessionReview} à revoir</span> cette session
      </div>
      <div style={{ fontSize: 13, color: A.primary, fontWeight: 600, marginBottom: 28 }}>
        {totalKnown}/{total} cartes maîtrisées au total
      </div>
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
        <button onClick={() => { setIdx(0); setFlipped(false); setSessionProgress({}); setDone(false); startRef.current = Date.now() }} style={{ flex: 1, height: 50, borderRadius: 14, background: A.surface, border: `0.5px solid ${A.borderStrong}`, color: A.text, fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer' }}>
          Recommencer
        </button>
        <button onClick={() => router.push(nextLessonHref ?? quizHref)} style={{ flex: 1, height: 50, borderRadius: 14, background: A.primary, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
          {nextLessonHref ? 'SÃ©rie suivante' : 'Faire le quiz'}
        </button>
      </div>
    </div>
  )

  const cardStatus = progress[card.id]

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="x" size={16} color={A.text} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{lessonLabel}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
            {idx + 1}<span style={{ color: A.textDim }}>/{total}</span>
            {isCourseLesson && totalCards ? <span style={{ color: A.textDim, fontSize: 11, fontWeight: 500 }}> Â· {totalCards} au total</span> : null}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
          <span style={{ color: A.green, fontWeight: 600 }}>{sessionKnown} sue</span>
          <span style={{ color: A.amber, fontWeight: 600 }}>{sessionReview} à revoir</span>
        </div>
      </div>

      <div style={{ padding: '0 20px 10px', display: 'grid', gridTemplateColumns: `repeat(${total}, 1fr)`, gap: 3 }}>
        {Array.from({ length: total }).map((_, i) => {
          const cid = flashcards[i]?.id
          if (!cid) return <div key={i} />
          const s = sessionProgress[cid] ?? progress[cid]
          const isCurrent = i === idx
          const bg = isCurrent
            ? A.primary
            : s === 'known' ? A.green
            : s === 'review' ? A.amber
            : '#E1E5EC'
          return (
            <div key={i} style={{
              minWidth: 0, height: 5, borderRadius: 3, background: bg,
              boxShadow: isCurrent ? `0 0 0 2px ${A.primary}33` : 'none',
              transition: 'background .25s ease',
            }} />
          )
        })}
      </div>

      <div style={{ flex: 1, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
        <div onClick={() => setFlipped(f => !f)} style={{ width: '100%', minHeight: 420, position: 'relative', transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)', transition: 'transform .55s cubic-bezier(.2,.7,.3,1)', cursor: 'pointer' }}>
          {/* Front */}
          <div style={{ position: 'absolute', inset: 0, background: A.surface, borderRadius: 20, border: `0.5px solid ${A.border}`, boxShadow: '0 16px 40px rgba(15,27,45,0.08)', padding: 28, display: 'flex', flexDirection: 'column', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Recto · concept</div>
              {cardStatus && (
                <div style={{ fontSize: 11, fontWeight: 600, color: cardStatus === 'known' ? A.green : A.amber, padding: '2px 8px', borderRadius: 6, background: cardStatus === 'known' ? A.greenSoft : A.amberSoft }}>
                  {cardStatus === 'known' ? 'Maîtrisée' : 'À revoir'}
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6, textAlign: 'center', lineHeight: 1.2 }}>{card.concept}</div>
            </div>
            <div style={{ fontSize: 12, color: A.textDim, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="refresh" size={12} color={A.textDim} /> Tape pour retourner
            </div>
          </div>
          {/* Back */}
          <div style={{ position: 'absolute', inset: 0, background: A.text, borderRadius: 20, boxShadow: '0 16px 40px rgba(15,27,45,0.18)', padding: 28, display: 'flex', flexDirection: 'column', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', color: '#fff' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Verso · définition</div>
            <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, marginTop: 12, flex: 1, display: 'flex', alignItems: 'center' }}>{card.definition}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="refresh" size={12} color="rgba(255,255,255,0.55)" /> Tape pour retourner
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 20px 30px', display: 'flex', gap: 10 }}>
        <button onClick={() => handleAction(false)} style={{ flex: 1, height: 52, borderRadius: 14, background: A.surface, border: `1.5px solid ${A.amber}`, color: A.amber, fontFamily: A.font, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="refresh" size={16} color={A.amber} /> À revoir
        </button>
        <button onClick={() => handleAction(true)} style={{ flex: 1, height: 52, borderRadius: 14, background: A.green, border: 'none', color: '#fff', fontFamily: A.font, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.32)' }}>
          <Icon name="check" size={16} color="#fff" strokeWidth={2.5} /> Je sais
        </button>
      </div>
    </div>
  )
}
