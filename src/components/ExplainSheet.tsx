'use client'

import { useEffect, useRef, useState } from 'react'
import { A, PALETTE, RADIUS, sp, monoStyle } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

interface Props {
  question: string
  userAnswer?: string
  correctAnswer?: string
  explanation?: string
}

const MAX_FOLLOW_UPS = 4   // évite que l'élève s'enkylose, on coupe gentiment

export default function ExplainSheet({ question, userAnswer, correctAnswer, explanation }: Props) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset à chaque ouverture pour ne pas garder une vieille conversation
  useEffect(() => {
    if (open && history.length === 0) {
      void sendInitial()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, loading])

  async function sendInitial() {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, userAnswer, correctAnswer, explanation }),
      })
      if (!r.ok) throw new Error('api error')
      const j = await r.json()
      setHistory([{ role: 'assistant', content: j.reply ?? '' }])
    } catch {
      setError('Impossible de joindre l\'IA. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  async function sendFollowUp() {
    const msg = pending.trim()
    if (!msg || loading) return
    if (history.filter(m => m.role === 'user').length >= MAX_FOLLOW_UPS) {
      setError('Tu as atteint la limite de questions. Ferme et rouvre pour repartir.')
      return
    }
    const newHistory: ChatMessage[] = [...history, { role: 'user', content: msg }]
    setHistory(newHistory)
    setPending('')
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question, userAnswer, correctAnswer, explanation,
          history: newHistory.slice(0, -1),  // tout sauf le dernier
          followUp: msg,
        }),
      })
      if (!r.ok) throw new Error('api error')
      const j = await r.json()
      setHistory(h => [...h, { role: 'assistant', content: j.reply ?? '' }])
    } catch {
      setError('Impossible de joindre l\'IA. Réessaie.')
    } finally {
      setLoading(false)
    }
  }

  function close() {
    setOpen(false)
    // On garde l'historique pour ne pas redemander si l'élève rouvre dans la foulée
    // (mais reset au prochain unmount via le useState initial)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: PALETTE.accentSoft, color: PALETTE.accent,
          border: `1px solid ${PALETTE.accentSoft}`, borderRadius: RADIUS.pill,
          padding: `${sp(1)}px ${sp(3)}px`,
          ...monoStyle('xs', 'med', PALETTE.accent),
          cursor: 'pointer',
        }}
      >
        <Icon name="sparkle" size={13} color={PALETTE.accent} strokeWidth={2} />
        J&apos;ai pas compris
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 70, display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxHeight: '85vh',
              display: 'flex', flexDirection: 'column',
              background: '#fff',
              borderTopLeftRadius: 22, borderTopRightRadius: 22,
              fontFamily: A.font,
              boxShadow: '0 -10px 30px rgba(0,0,0,0.18)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '12px 16px 4px' }}>
              <div style={{
                width: 40, height: 4, background: '#D1D7E0',
                borderRadius: 999, margin: '0 auto 10px',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 10,
                    background: A.primarySoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="sparkle" size={16} color={A.primary} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: A.text }}>Aide IA</div>
                    <div style={{ fontSize: 10, color: A.textMuted, marginTop: 1 }}>
                      Reformulation rapide · max {MAX_FOLLOW_UPS} questions
                    </div>
                  </div>
                </div>
                <button onClick={close} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                }}>
                  <Icon name="x" size={20} color={A.textMuted} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                flex: 1, overflowY: 'auto', padding: '12px 16px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}
            >
              {history.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.role === 'user' ? A.primary : '#F4F6FA',
                  color: m.role === 'user' ? '#fff' : A.text,
                  padding: '10px 14px',
                  borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  fontSize: 13.5, lineHeight: 1.45,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div style={{
                  alignSelf: 'flex-start',
                  background: '#F4F6FA',
                  padding: '10px 14px', borderRadius: '16px 16px 16px 4px',
                  fontSize: 13, color: A.textMuted,
                }}>
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    <span style={{ animation: 'dot 1.4s infinite 0s' }}>·</span>
                    <span style={{ animation: 'dot 1.4s infinite 0.2s' }}>·</span>
                    <span style={{ animation: 'dot 1.4s infinite 0.4s' }}>·</span>
                  </span>
                </div>
              )}
              {error && (
                <div style={{
                  alignSelf: 'center',
                  fontSize: 11, color: '#B91C1C', fontWeight: 700,
                  background: '#FEE2E2', padding: '6px 12px', borderRadius: 999,
                }}>
                  {error}
                </div>
              )}
              <style>{`@keyframes dot { 0%, 60%, 100% { opacity: 0.3 } 30% { opacity: 1 } }`}</style>
            </div>

            {/* Input */}
            <div style={{
              borderTop: `1px solid ${A.border}`,
              padding: '10px 12px 16px',
              display: 'flex', gap: 8,
            }}>
              <input
                type="text"
                value={pending}
                onChange={e => setPending(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendFollowUp() }}
                placeholder="Pose une question…"
                disabled={loading}
                style={{
                  flex: 1, padding: '10px 14px',
                  border: `1px solid ${A.border}`, borderRadius: 999,
                  fontSize: 13, fontFamily: A.font, color: A.text,
                  background: '#F7F9FC', outline: 'none',
                }}
              />
              <button
                onClick={sendFollowUp}
                disabled={loading || !pending.trim()}
                style={{
                  background: !pending.trim() || loading ? '#E4E8EE' : A.primary,
                  color: !pending.trim() || loading ? A.textMuted : '#fff',
                  border: 'none', borderRadius: 999,
                  padding: '0 16px', fontSize: 13, fontWeight: 800,
                  cursor: !pending.trim() || loading ? 'default' : 'pointer',
                  fontFamily: A.font,
                }}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
