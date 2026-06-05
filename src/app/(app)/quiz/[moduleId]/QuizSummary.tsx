'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { A } from '@/lib/theme'
import { CompanionMood, getMood } from '@/components/ui/Companion'
import Icon from '@/components/ui/Icon'
import PetCompanion, { PET_NAMES } from '@/components/pet/PetCompanion'
import type { PetType } from '@/components/pet/PetCompanion'
import { xpProgress, XP_PER_CORRECT, XP_PER_WRONG } from '@/lib/xp'
import { useAppData } from '@/lib/app-context'

type Question = {
  id: string
  question: string
  choices: unknown
  correct_index: number
  explanation: string
  module_id: string
  page_image_url?: string | null
}

type MoodCfg = {
  hue: string
  title: string
  sub: string
  /** Short line spoken by the pet in its speech bubble. */
  bubble: string
}

const MOODS: Record<CompanionMood, MoodCfg> = {
  perfect: { hue: A.green,   title: 'Excellent travail !',      sub: 'Tu maîtrises cette section — continue sur cette lancée !', bubble: 'Bravo !!'     },
  good:    { hue: A.primary, title: 'Bien joué !',              sub: 'Tu progresses, encore quelques erreurs à corriger.',       bubble: 'Top !'        },
  okay:    { hue: A.amber,   title: 'Pas mal, persévère !',     sub: 'Reprends les erreurs et ça viendra rapidement.',           bubble: 'On reprend ?' },
  tough:   { hue: A.red,     title: 'Courage, on s’accroche',   sub: 'La régularité fait toute la différence.',                  bubble: 'Allez !'      },
}

// ─────────────────────────────────────────────────────────────────────────────
// Score Ring
// ─────────────────────────────────────────────────────────────────────────────
function ScoreRing({ pct, size = 160 }: { pct: number; size?: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ
  const color = pct >= 80 ? A.green : pct >= 60 ? A.primary : pct >= 40 ? A.amber : A.red
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#EEF1F5" strokeWidth="11" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: size * 0.24, fontWeight: 800, color, letterSpacing: -1.2,
          lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {pct}
          <span style={{ fontSize: size * 0.11, marginLeft: 2 }}>%</span>
        </div>
        <div style={{
          fontSize: 10.5, color: A.textMuted, marginTop: 4,
          fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
        }}>
          Précision
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PetHeader — pet + speech bubble + mood title
// ─────────────────────────────────────────────────────────────────────────────
function PetHeader({ mood, petType, level }: { mood: CompanionMood; petType: PetType; level: number }) {
  const { data } = useAppData()
  const equipped = data?.profile.equipped_accessories ?? {}
  const cfg = MOODS[mood]
  const isPositive = mood === 'perfect' || mood === 'good'
  // Use 'correct' so the pet does its excited bounce + auto-bubble.
  const petState = isPositive ? 'correct' : mood === 'tough' ? 'wrong' : 'idle'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: A.surface, border: `1px solid ${A.border}`,
      borderRadius: 22, padding: '14px 16px 14px 12px',
      boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 10px 28px -16px rgba(15,27,45,0.22)',
      position: 'relative',
    }}>
      <div style={{ flexShrink: 0, paddingTop: 4, paddingLeft: 4 }}>
        <PetCompanion petType={petType} state={petState} size={78} level={level} equipped={equipped} hideName />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 800, color: cfg.hue,
            letterSpacing: 0.5, textTransform: 'uppercase',
          }}>{PET_NAMES[petType]}</span>
          <span style={{
            display: 'inline-block', width: 4, height: 4, borderRadius: 2, background: A.textDim,
          }} />
          <span style={{
            fontSize: 10.5, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3,
          }}>dit</span>
        </div>
        <div style={{
          fontSize: 18, fontWeight: 800, color: A.text,
          letterSpacing: -0.4, lineHeight: 1.15,
        }}>{cfg.title}</div>
        <div style={{
          fontSize: 12.5, color: A.textMuted, marginTop: 4, lineHeight: 1.4,
        }}>{cfg.sub}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// XPBar — animates fill from xpBefore → xpAfter
// ─────────────────────────────────────────────────────────────────────────────
function XPBar({ xpBefore, xpGained }: { xpBefore: number; xpGained: number }) {
  const xpAfter = xpBefore + xpGained
  const before = xpProgress(xpBefore)
  const after = xpProgress(xpAfter)
  const leveledUp = after.level > before.level

  // The bar is anchored to `after`'s level window. `pctStart` shows where we
  // were within this level when the session ended (clamped to 0 on level-up).
  const pctEnd = Math.max(0, Math.min(100, after.pct))
  const pctStart = leveledUp
    ? 0
    : Math.max(0, Math.min(100, ((xpBefore - after.levelStart) / Math.max(1, after.levelEnd - after.levelStart)) * 100))

  // Animate fill in on mount.
  const [fillPct, setFillPct] = useState(pctStart)
  useEffect(() => {
    const t = setTimeout(() => setFillPct(pctEnd), 250)
    return () => clearTimeout(t)
  }, [pctEnd])

  return (
    <div style={{
      background: A.surface, border: `1px solid ${A.border}`, borderRadius: 18,
      padding: '14px 16px',
      boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 8px 24px -16px rgba(15,27,45,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: `linear-gradient(135deg, ${after.color} 0%, ${shade(after.color, 18)} 100%)`,
            color: '#fff', fontSize: 12, fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.35), 0 4px 10px -4px ${after.color}aa`,
            letterSpacing: -0.3, fontVariantNumeric: 'tabular-nums',
          }}>{after.level}</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: A.text, letterSpacing: -0.2 }}>
              {after.name}
            </div>
            <div style={{
              fontSize: 10.5, color: A.textMuted, fontWeight: 700,
              letterSpacing: 0.4, textTransform: 'uppercase',
            }}>
              Niveau du compagnon
            </div>
          </div>
        </div>
        <div style={{
          padding: '5px 11px', borderRadius: 999,
          background: 'linear-gradient(135deg, rgba(10,102,224,0.10), rgba(10,102,224,0.20))',
          fontSize: 12.5, fontWeight: 800, color: A.primary,
          fontVariantNumeric: 'tabular-nums', letterSpacing: -0.1,
          border: `1px solid ${A.primary}25`,
        }}>+{xpGained} XP</div>
      </div>

      {/* Track */}
      <div style={{
        height: 12, borderRadius: 8, background: '#EEF1F5',
        position: 'relative', overflow: 'hidden',
        boxShadow: 'inset 0 1px 2px rgba(15,27,45,0.08)',
      }}>
        {/* Faint pre-session position */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pctStart}%`, background: '#C8D5E8',
        }} />
        {/* Animated fill */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${fillPct}%`,
          background: `linear-gradient(90deg, ${after.color} 0%, ${shade(after.color, 30)} 60%, #FFD84A 100%)`,
          transition: 'width 1.4s cubic-bezier(0.2,0.7,0.2,1)',
          boxShadow: `0 0 12px ${after.color}80`,
          borderRadius: 8,
        }} />
        {/* Marker showing where you started */}
        <div style={{
          position: 'absolute', left: `${pctStart}%`, top: -2, bottom: -2,
          width: 2, background: '#fff', opacity: pctStart > 0 ? 0.85 : 0,
          boxShadow: '0 0 6px rgba(15,27,45,0.25)',
          transition: 'opacity .3s ease',
        }} />
      </div>

      <div style={{
        marginTop: 8, display: 'flex', justifyContent: 'space-between',
        fontSize: 11, fontWeight: 700, color: A.textMuted, fontVariantNumeric: 'tabular-nums',
      }}>
        <span>
          {xpBefore}
          <span style={{ color: A.textDim, fontWeight: 500, margin: '0 6px' }}>→</span>
          <span style={{ color: A.text }}>{xpAfter} XP</span>
        </span>
        <span style={{ color: A.textDim }}>
          {leveledUp
            ? `🎉 Niveau ${after.level} atteint !`
            : after.levelEnd > xpAfter
              ? `${after.levelEnd - xpAfter} XP avant niv. ${after.level + 1}`
              : 'Niveau max'}
        </span>
      </div>
    </div>
  )
}

// Lighten a hex color by `pct` percent (0-100). Returns a hex string.
function shade(hex: string, pct: number): string {
  const m = hex.replace('#', '').match(/.{2}/g)
  if (!m) return hex
  const [r, g, b] = m.map(h => parseInt(h, 16))
  const t = pct / 100
  const blend = (c: number) => Math.round(c + (255 - c) * t)
  return `#${[blend(r), blend(g), blend(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat tile
// ─────────────────────────────────────────────────────────────────────────────
function StatTile({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{
      flex: 1, background: A.surface, border: `1px solid ${A.border}`,
      borderRadius: 16, padding: '14px 10px', textAlign: 'center',
      boxShadow: '0 1px 0 rgba(15,27,45,0.02)',
    }}>
      <div style={{
        fontSize: 28, fontWeight: 800, color, lineHeight: 1,
        letterSpacing: -0.6, fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      <div style={{
        fontSize: 10.5, color: A.textMuted, marginTop: 6,
        fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
      }}>{label}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WrongList
// ─────────────────────────────────────────────────────────────────────────────
function WrongList({ items }: { items: Question[] }) {
  if (items.length === 0) return null
  return (
    <div style={{
      background: A.surface, border: `1px solid ${A.border}`, borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(15,27,45,0.04)',
    }}>
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
        background: A.amberSoft, borderBottom: `1px solid ${A.amber}30`,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 11, background: A.amber, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
        }}>{items.length}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: A.amber }}>À retravailler</div>
      </div>
      {items.map((q, i) => (
        <div key={q.id} style={{
          padding: '11px 16px', display: 'flex', alignItems: 'flex-start', gap: 10,
          borderTop: i > 0 ? `1px solid ${A.border}` : 'none',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 7, background: '#FCE8E8', color: A.red,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{i + 1}</div>
          <div style={{ flex: 1, fontSize: 13.5, color: A.text, lineHeight: 1.4 }}>
            {q.question.length > 90 ? q.question.slice(0, 90) + '…' : q.question}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function QuizSummary({
  scoreOk,
  scoreBad,
  total,
  moduleId,
  wrongQuestions = [],
  onRestart,
  onRestartWrong,
  backHref,
  petType = 'cat',
  level = 1,
  xpBefore = 0,
}: {
  scoreOk: number
  scoreBad: number
  total: number
  moduleId: string
  wrongQuestions?: Question[]
  onRestart: () => void
  onRestartWrong: (qs: Question[]) => void
  backHref?: string
  petType?: PetType
  level?: number
  xpBefore?: number
}) {
  const router = useRouter()
  const accuracy = total > 0 ? Math.round((scoreOk / total) * 100) : 0
  const mood = getMood(accuracy)
  const xpGained = scoreOk * XP_PER_CORRECT + scoreBad * XP_PER_WRONG
  const isPerfect = accuracy >= 80

  return (
    <div style={{
      minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font,
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        @keyframes summary-in { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
        button:active:not(:disabled){transform:scale(.985)}
      `}</style>

      {/* Top bar */}
      <div style={{
        padding: '54px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => router.push(backHref ?? `/module/${moduleId}`)}
          aria-label="Retour"
          style={{
            width: 36, height: 36, borderRadius: 12, background: A.surface,
            border: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, cursor: 'pointer', boxShadow: '0 1px 0 rgba(15,27,45,0.02)',
          }}>
          <Icon name="chevronL" size={14} color={A.text} strokeWidth={2.2} />
        </button>
        <div style={{
          fontSize: 11, color: A.textMuted, fontWeight: 700,
          letterSpacing: 0.8, textTransform: 'uppercase',
        }}>Session terminée</div>
        <div style={{ width: 36 }} />
      </div>

      {/* Body */}
      <div style={{
        padding: '14px 20px 24px', display: 'flex', flexDirection: 'column',
        gap: 14, flex: 1, animation: 'summary-in .4s ease both',
      }}>
        <PetHeader mood={mood} petType={petType} level={level} />

        {/* Score block — ring + stats */}
        <div style={{
          background: A.surface, border: `1px solid ${A.border}`, borderRadius: 22,
          padding: isPerfect ? '18px 16px' : '16px',
          display: 'flex',
          flexDirection: isPerfect ? 'column' : 'row',
          alignItems: 'center', gap: 14,
          boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 8px 24px -16px rgba(15,27,45,0.18)',
        }}>
          <ScoreRing pct={accuracy} size={isPerfect ? 156 : 120} />
          {isPerfect ? (
            <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
              <StatTile label="Questions" value={total} color={A.text} />
              <StatTile label="Réussies" value={scoreOk} color={A.green} />
              <StatTile label="Erreurs" value={scoreBad} color={A.red} />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatTile label="Réussies" value={scoreOk} color={A.green} />
                <StatTile label="Erreurs" value={scoreBad} color={A.red} />
              </div>
              <div style={{
                padding: '8px 10px', borderRadius: 10, background: '#F9FAFC',
                fontSize: 11, color: A.textMuted, textAlign: 'center',
                border: `1px solid ${A.border}`,
              }}>
                <span style={{ color: A.text, fontWeight: 700 }}>{total}</span> questions au total
              </div>
            </div>
          )}
        </div>

        <XPBar xpBefore={xpBefore} xpGained={xpGained} />

        <WrongList items={wrongQuestions} />

        <div style={{ flex: 1, minHeight: 4 }} />

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {wrongQuestions.length > 0 ? (
            <>
              <button
                onClick={() => onRestartWrong(wrongQuestions)}
                style={{
                  height: 56, borderRadius: 16, border: 'none',
                  background: A.red, color: '#fff',
                  fontSize: 16, fontWeight: 700, fontFamily: A.font, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  letterSpacing: -0.1,
                  boxShadow: '0 10px 24px -6px rgba(220,38,38,0.55), 0 2px 6px rgba(220,38,38,0.18), inset 0 1px 0 rgba(255,255,255,0.18)',
                  transition: 'transform .12s ease, box-shadow .12s ease',
                }}>
                <Icon name="refresh" size={17} color="#fff" strokeWidth={2.4} />
                Corriger les {wrongQuestions.length} erreur{wrongQuestions.length > 1 ? 's' : ''}
              </button>
              <button
                onClick={() => router.push(backHref ?? `/module/${moduleId}`)}
                style={{
                  height: 42, borderRadius: 12, border: 'none',
                  background: 'transparent', color: A.textMuted,
                  fontSize: 13, fontWeight: 600, fontFamily: A.font, cursor: 'pointer',
                  transition: 'opacity .12s ease',
                }}>
                Terminer quand même →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push(backHref ?? `/module/${moduleId}`)}
                style={{
                  height: 56, borderRadius: 16, border: 'none',
                  background: A.primary, color: '#fff',
                  fontSize: 16, fontWeight: 700, fontFamily: A.font, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  letterSpacing: -0.1,
                  boxShadow: '0 10px 24px -6px rgba(10,102,224,0.55), 0 2px 6px rgba(10,102,224,0.18), inset 0 1px 0 rgba(255,255,255,0.18)',
                  transition: 'transform .12s ease, box-shadow .12s ease',
                }}>
                {backHref ? 'Retour' : 'Retour au module'}
                <Icon name="arrowR" size={16} color="#fff" strokeWidth={2.4} />
              </button>
              <button
                onClick={onRestart}
                style={{
                  height: 42, borderRadius: 12, border: 'none',
                  background: 'transparent', color: A.textMuted,
                  fontSize: 13, fontWeight: 600, fontFamily: A.font, cursor: 'pointer',
                  transition: 'opacity .12s ease',
                }}>
                Recommencer le quiz
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
