'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recordSession } from '@/lib/recordSession'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Flashcard = { id: string; concept: string; definition: string }
type Status = 'known' | 'review'

const BATCH = 10

export default function FlashcardsClient({ flashcards: rawCards, moduleId, userId }: { flashcards: Flashcard[]; moduleId: string; userId: string }) {
  const router = useRouter()
  const startRef = useRef(Date.now())
  const [progress, setProgress] = useState<Record<string, Status>>({})
  const [progressLoaded, setProgressLoaded] = useState(false)
  const [sessionProgress, setSessionProgress] = useState<Record<string, Status>>({})
  const [batch, setBatch] = useState(0)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)

  // Sort: review-first, then unseen, then known — only after progress loaded
  const allCards = progressLoaded
    ? [...rawCards].sort((a, b) => {
        const order = (s: Status | undefined) => s === 'review' ? 0 : s === undefined ? 1 : 2
        return order(progress[a.id]) - order(progress[b.id])
      })
    : rawCards

  const totalBatches = Math.ceil(allCards.length / BATCH)
  const flashcards = allCards.slice(batch * BATCH, (batch + 1) * BATCH)
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
        }
        setProgressLoaded(true)
      }, () => setProgressLoaded(true))
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
      const elapsed = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
      await recordSession(userId, elapsed)
      return
    }
    setIdx(i => i + 1)
    setFlipped(false)
  }

  const sessionKnown = Object.values(sessionProgress).filter(s => s === 'known').length
  const sessionReview = Object.values(sessionProgress).filter(s => s === 'review').length
  const totalKnown = Object.values({ ...progress, ...sessionProgress }).filter(s => s === 'known').length
  const hasNextBatch = batch + 1 < totalBatches

  function nextBatch() {
    setBatch(b => b + 1)
    setIdx(0)
    setFlipped(false)
    setSessionProgress({})
    setDone(false)
    startRef.current = Date.now()
  }

  if (!progressLoaded) return (
    <div style={{ minHeight: '100vh', background: A.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${A.primary}`, borderTopColor: 'transparent', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center' }}>
      {/* Dots progression */}
      {totalBatches > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {Array.from({ length: totalBatches }).map((_, i) => (
            <div key={i} style={{
              width: i === batch ? 22 : 8, height: 8, borderRadius: 4,
              background: i < batch ? A.green : i === batch ? A.primary : '#E1E5EC',
              transition: 'all .3s',
            }} />
          ))}
        </div>
      )}
      <div style={{ width: 80, height: 80, borderRadius: 28, background: `linear-gradient(135deg, ${A.green} 0%, #0E8C3E 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 12px 32px rgba(22,163,74,0.32)' }}>
        <Icon name="check" size={40} color="#fff" strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, color: A.text, marginBottom: 8 }}>
        {hasNextBatch ? `Leçon ${batch + 1}/${totalBatches} terminée !` : 'Toutes les cartes vues !'}
      </div>
      <div style={{ fontSize: 14, color: A.textMuted, marginBottom: 6 }}>
        <span style={{ color: A.green, fontWeight: 600 }}>{sessionKnown} sues</span> · <span style={{ color: A.amber, fontWeight: 600 }}>{sessionReview} à revoir</span>
      </div>
      <div style={{ fontSize: 13, color: A.primary, fontWeight: 600, marginBottom: 28 }}>
        {totalKnown}/{allCards.length} cartes maîtrisées au total
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        {hasNextBatch && (
          <button onClick={nextBatch} style={{ height: 54, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${A.primary} 0%, #0850B8 100%)`, color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: A.font, cursor: 'pointer', boxShadow: '0 6px 20px rgba(10,102,224,0.35)' }}>
            Leçon {batch + 2}/{totalBatches} →
          </button>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setIdx(0); setFlipped(false); setSessionProgress({}); setDone(false); startRef.current = Date.now() }} style={{ flex: 1, height: 50, borderRadius: 14, background: A.surface, border: `0.5px solid ${A.borderStrong}`, color: A.text, fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer' }}>
            Recommencer
          </button>
          <button onClick={() => router.push(`/quiz/${moduleId}`)} style={{ flex: 1, height: 50, borderRadius: 14, background: hasNextBatch ? A.surface : A.primary, border: hasNextBatch ? `0.5px solid ${A.borderStrong}` : 'none', color: hasNextBatch ? A.text : '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: hasNextBatch ? 'none' : '0 4px 14px rgba(10,102,224,0.28)' }}>
            Faire le quiz
          </button>
        </div>
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
          <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            {totalBatches > 1 ? `Leçon ${batch + 1}/${totalBatches}` : `Flashcards ${moduleId}`}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{idx + 1}<span style={{ color: A.textDim }}>/{total}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
          <span style={{ color: A.green, fontWeight: 600 }}>{sessionKnown} sue</span>
          <span style={{ color: A.amber, fontWeight: 600 }}>{sessionReview} à revoir</span>
        </div>
      </div>

      <div style={{ padding: '0 20px 10px', display: 'flex', gap: 4 }}>
        {flashcards.map((fc, i) => {
          const s = sessionProgress[fc.id]
          const bg = s === 'known' ? A.green : s === 'review' ? A.amber : i === idx ? A.primary + '88' : '#E1E5EC'
          return <div key={fc.id} style={{ flex: 1, height: 3, borderRadius: 2, background: bg }} />
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
