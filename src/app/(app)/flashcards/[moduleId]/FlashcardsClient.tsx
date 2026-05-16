'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Flashcard = { id: string; concept: string; definition: string }

export default function FlashcardsClient({ flashcards, moduleId }: { flashcards: Flashcard[]; moduleId: string }) {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [review, setReview] = useState(0)
  const [done, setDone] = useState(false)

  const total = flashcards.length
  const card = flashcards[idx]

  function handleAction(knew: boolean) {
    if (knew) setKnown(k => k + 1); else setReview(r => r + 1)
    if (idx + 1 >= total) { setDone(true); return }
    setIdx(i => i + 1)
    setFlipped(false)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: 28, background: `linear-gradient(135deg, ${A.green} 0%, #0E8C3E 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 12px 32px rgba(22,163,74,0.32)' }}>
        <Icon name="check" size={40} color="#fff" strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, color: A.text, marginBottom: 8 }}>Session terminée !</div>
      <div style={{ fontSize: 14, color: A.textMuted, marginBottom: 28 }}>
        <span style={{ color: A.green, fontWeight: 600 }}>{known} sues</span> · <span style={{ color: A.amber, fontWeight: 600 }}>{review} à revoir</span> sur {total} cartes
      </div>
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
        <button onClick={() => { setIdx(0); setFlipped(false); setKnown(0); setReview(0); setDone(false) }} style={{ flex: 1, height: 50, borderRadius: 14, background: A.surface, border: `0.5px solid ${A.borderStrong}`, color: A.text, fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer' }}>
          Recommencer
        </button>
        <button onClick={() => router.push(`/quiz/${moduleId}`)} style={{ flex: 1, height: 50, borderRadius: 14, background: A.primary, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
          Faire le quiz
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font, display: 'flex', flexDirection: 'column' }}>
      {/* Top */}
      <div style={{ padding: '60px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, background: A.surface, border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="x" size={16} color={A.text} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Flashcards {moduleId}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{idx + 1}<span style={{ color: A.textDim }}>/{total}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
          <span style={{ color: A.green, fontWeight: 600 }}>{known} sue</span>
          <span style={{ color: A.amber, fontWeight: 600 }}>{review} à revoir</span>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ padding: '0 20px 10px', display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < idx ? A.primary : i === idx ? A.primary + '88' : '#E1E5EC' }} />
        ))}
      </div>

      {/* Card */}
      <div style={{ flex: 1, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
        <div onClick={() => setFlipped(f => !f)} style={{ width: '100%', minHeight: 420, position: 'relative', transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)', transition: 'transform .55s cubic-bezier(.2,.7,.3,1)', cursor: 'pointer' }}>
          {/* Front */}
          <div style={{ position: 'absolute', inset: 0, background: A.surface, borderRadius: 20, border: `0.5px solid ${A.border}`, boxShadow: '0 16px 40px rgba(15,27,45,0.08)', padding: 28, display: 'flex', flexDirection: 'column', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
            <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Recto · concept</div>
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

      {/* Actions */}
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
