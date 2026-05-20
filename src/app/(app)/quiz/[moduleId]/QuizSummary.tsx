'use client'

import { useRouter } from 'next/navigation'
import { A } from '@/lib/theme'
import Companion, { CompanionMood, getMood } from '@/components/ui/Companion'

const MESSAGES: Record<CompanionMood, { title: string; sub: string }> = {
  perfect: { title: 'Parfait, tu déchires !',        sub: 'Session excellente — continue sur cette lancée !' },
  good:    { title: 'Bien joué !',                   sub: 'Tu progresses vraiment bien.'                    },
  okay:    { title: 'Pas mal !',                     sub: 'Encore un peu de pratique et ça viendra.'        },
  tough:   { title: 'Courage, tu vas y arriver !',   sub: 'La régularité fait toute la différence.'         },
}

function calcPoints(correct: number, total: number): number {
  const accuracy = total > 0 ? correct / total : 0
  return correct * 10 + (accuracy >= 0.8 ? 30 : accuracy >= 0.6 ? 15 : 0)
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ
  const color = pct >= 80 ? A.green : pct >= 60 ? A.primary : pct >= 40 ? A.amber : A.red

  return (
    <svg width="130" height="130" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke={A.border} strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="47" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{pct}%</text>
      <text x="50" y="62" textAnchor="middle" fontSize="10" fill={A.textMuted}>précision</text>
    </svg>
  )
}

export default function QuizSummary({
  scoreOk, scoreBad, total, moduleId,
}: {
  scoreOk: number; scoreBad: number; total: number; moduleId: string
}) {
  const router = useRouter()
  const accuracy = total > 0 ? Math.round((scoreOk / total) * 100) : 0
  const mood = getMood(accuracy)
  const points = calcPoints(scoreOk, total)
  const { title, sub } = MESSAGES[mood]

  return (
    <div style={{
      minHeight: '100vh', background: A.bg, color: A.text, fontFamily: A.font,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '56px 20px 40px',
    }}>

      {/* Companion + speech bubble */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <Companion mood={mood} size={104} />
        <div style={{
          background: A.surface, border: `0.5px solid ${A.border}`,
          borderRadius: 18, padding: '14px 20px', maxWidth: 280, textAlign: 'center',
          boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 5 }}>{title}</div>
          <div style={{ fontSize: 13, color: A.textMuted, lineHeight: 1.45 }}>{sub}</div>
        </div>
      </div>

      {/* Score ring */}
      <ScoreRing pct={accuracy} />

      {/* Stats grid */}
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 340, margin: '22px 0 20px' }}>
        {([
          { label: 'Questions', value: total,    color: A.text  },
          { label: 'Correctes', value: scoreOk,  color: A.green },
          { label: 'Erreurs',   value: scoreBad, color: A.red   },
        ] as const).map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, background: A.surface, border: `0.5px solid ${A.border}`,
            borderRadius: 14, padding: '14px 8px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 11, color: A.textMuted, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Points earned */}
      <div style={{
        background: A.primarySoft, border: `1px solid ${A.primary}33`,
        borderRadius: 14, padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 32, width: '100%', maxWidth: 340,
      }}>
        <span style={{ fontSize: 26 }}>⭐</span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: A.primary }}>+{points} points</div>
          <div style={{ fontSize: 12, color: A.textMuted }}>gagnés cette session</div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
        <button
          onClick={() => router.push(`/quiz/${moduleId}`)}
          style={{
            height: 50, borderRadius: 14, border: 'none',
            background: A.primary, color: '#fff',
            fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(10,102,224,0.28)',
          }}
        >
          Recommencer
        </button>
        <button
          onClick={() => router.push(`/module/${moduleId}`)}
          style={{
            height: 50, borderRadius: 14, border: `0.5px solid ${A.borderStrong}`,
            background: A.surface, color: A.text,
            fontSize: 16, fontWeight: 600, fontFamily: A.font, cursor: 'pointer',
          }}
        >
          Retour au module
        </button>
      </div>
    </div>
  )
}
