'use client'

export type CompanionMood = 'perfect' | 'good' | 'okay' | 'tough'

export function getMood(accuracy: number): CompanionMood {
  if (accuracy >= 80) return 'perfect'
  if (accuracy >= 60) return 'good'
  if (accuracy >= 40) return 'okay'
  return 'tough'
}

const CFG = {
  perfect: { accent: '#0A66E0', body: '#E6EFFC', anim: 'c-bounce' },
  good:    { accent: '#16A34A', body: '#E7F6EC', anim: 'c-pulse'  },
  okay:    { accent: '#D97706', body: '#FCEFD9', anim: undefined   },
  tough:   { accent: '#8A95A5', body: '#F0F2F5', anim: undefined   },
}

export default function Companion({ mood, size = 96 }: { mood: CompanionMood; size?: number }) {
  const { accent, body, anim } = CFG[mood]
  return (
    <>
      <style>{`
        @keyframes c-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes c-pulse  { 0%,100%{transform:scale(1)}      50%{transform:scale(1.07)}       }
      `}</style>
      <div style={{ display: 'inline-block', animation: anim ? `${anim} 1.6s ease-in-out infinite` : undefined }}>
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Body */}
          <circle cx="50" cy="54" r="38" fill={body} stroke={accent} strokeWidth="2.5" />

          {/* Blush for happy moods */}
          {(mood === 'perfect' || mood === 'good') && (
            <>
              <circle cx="24" cy="63" r="8" fill={accent} opacity="0.13" />
              <circle cx="76" cy="63" r="8" fill={accent} opacity="0.13" />
            </>
          )}

          {/* Eyes */}
          {mood === 'perfect' ? (
            <>
              <path d="M30 48 Q37 41 44 48" stroke="#0F1B2D" strokeWidth="3"   strokeLinecap="round" />
              <path d="M56 48 Q63 41 70 48" stroke="#0F1B2D" strokeWidth="3"   strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="37" cy="47" r="4.5" fill="#0F1B2D" />
              <circle cx="63" cy="47" r="4.5" fill="#0F1B2D" />
              <circle cx="38.5" cy="45.5" r="1.5" fill="white" />
              <circle cx="64.5" cy="45.5" r="1.5" fill="white" />
            </>
          )}

          {/* Worried brows for tough */}
          {mood === 'tough' && (
            <>
              <path d="M30 38 Q37 34 44 38" stroke="#0F1B2D" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M56 38 Q63 34 70 38" stroke="#0F1B2D" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Mouth */}
          {mood === 'perfect' && <path d="M29 66 Q50 84 71 66" stroke="#0F1B2D" strokeWidth="3"   strokeLinecap="round" />}
          {mood === 'good'    && <path d="M33 66 Q50 80 67 66" stroke="#0F1B2D" strokeWidth="2.5" strokeLinecap="round" />}
          {mood === 'okay'    && <path d="M36 68 L64 68"       stroke="#0F1B2D" strokeWidth="2.5" strokeLinecap="round" />}
          {mood === 'tough'   && <path d="M33 72 Q50 62 67 72" stroke="#0F1B2D" strokeWidth="2.5" strokeLinecap="round" />}

          {/* Sparkles for perfect */}
          {mood === 'perfect' && (
            <>
              <path d="M13 22 L15 15 L17 22 L24 24 L17 26 L15 33 L13 26 L6 24 Z"   fill={accent} opacity="0.85" />
              <path d="M83 8  L84.5 4  L86 8  L90 9.5 L86 11 L84.5 15 L83 11 L79 9.5 Z" fill={accent} opacity="0.65" />
              <path d="M88 72 L89 68 L90 72 L94 73 L90 74 L89 78 L88 74 L84 73 Z"   fill={accent} opacity="0.55" />
            </>
          )}
        </svg>
      </div>
    </>
  )
}
