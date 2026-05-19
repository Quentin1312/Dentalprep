'use client'

import { useEffect, useRef, useState } from 'react'

export type PetType = 'cat' | 'dog' | 'bunny'
export type PetState = 'idle' | 'correct' | 'wrong' | 'thinking'

const MESSAGES: Record<PetType, Record<'correct' | 'wrong', string[]>> = {
  cat: {
    correct: ['Purrrfait !', 'C\'est ça !', 'Tu maîtrises !', 'Heidi valide !', 'Bravo !!'],
    wrong: ['Oh non !', 'Relève-toi !', 'Prochaine fois !', 'Tu vas y arriver !'],
  },
  dog: {
    correct: ['OUAF !!', 'Génial !!', 'Rex est fier !', 'Parfait !', 'Trop fort !'],
    wrong: ['Allez !!', 'Tu peux !', 'Relève-toi !', 'Encore un effort !'],
  },
  bunny: {
    correct: ['Hop hop !!', 'Excellent !', 'Lune est ravie !', 'Super !!', 'Bravo !'],
    wrong: ['Oh...', 'Rebondis !', 'Prochaine fois !', 'Courage !'],
  },
}

const PET_NAMES: Record<PetType, string> = { cat: 'Heidi', dog: 'Rex', bunny: 'Lune' }

function CatSVG({ state }: { state: PetState }) {
  const excited = state === 'correct'
  const sad = state === 'wrong'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
      {/* Tail */}
      <path className={excited ? 'tail-fast' : sad ? 'tail-still' : 'tail-sway'}
        d="M41,64 Q60,56 65,43 Q68,33 62,25"
        stroke="#2A2840" strokeWidth="7" fill="none" strokeLinecap="round"
        style={{ transformOrigin: '41px 64px' }} />
      {/* Body */}
      <ellipse cx="38" cy="65" rx="17" ry="12" fill="#2A2840" />
      <ellipse cx="38" cy="67" rx="11" ry="7" fill="#38346A" />
      {/* Paws */}
      <ellipse cx="26" cy="75" rx="9" ry="5" fill="#2A2840" />
      <ellipse cx="50" cy="75" rx="9" ry="5" fill="#2A2840" />
      {/* Head */}
      <circle cx="36" cy="34" r="25" fill="#2A2840" />
      {/* Ears */}
      <polygon points="13,27 6,4 27,18" fill="#2A2840" />
      <polygon points="15,25 10,9 24,18" fill="#E050A0" />
      <polygon points="59,27 66,4 45,18" fill="#2A2840" />
      <polygon points="57,25 62,9 48,18" fill="#E050A0" />
      {/* Nose */}
      <ellipse cx="36" cy="42" rx="3.5" ry="2.2" fill="#FF8FAB" />
      {/* Eyes */}
      {sad ? (
        <>
          {/* Sad eyes - downturned */}
          <ellipse cx="27" cy="35" rx="7" ry="5" fill="#FFD84A" />
          <ellipse cx="27.5" cy="36" rx="4" ry="3" fill="#1A1530" />
          <ellipse cx="46" cy="35" rx="7" ry="5" fill="#FFD84A" />
          <ellipse cx="46.5" cy="36" rx="4" ry="3" fill="#1A1530" />
          {/* Tear */}
          <ellipse cx="24" cy="40" rx="1.5" ry="2.5" fill="#88AAFF" opacity="0.7" />
        </>
      ) : (
        <>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="27" cy="33" rx="7" ry="8" fill="#FFD84A" />
            <ellipse cx="27.5" cy="34" rx="4" ry="5" fill="#1A1530" />
            <ellipse cx="26" cy="31" rx="1.5" ry="1.5" fill="white" />
          </g>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="46" cy="33" rx="7" ry="8" fill="#FFD84A" />
            <ellipse cx="46.5" cy="34" rx="4" ry="5" fill="#1A1530" />
            <ellipse cx="45" cy="31" rx="1.5" ry="1.5" fill="white" />
          </g>
        </>
      )}
      {/* Mouth */}
      <path d={excited ? 'M31,46 Q36,51 41,46' : sad ? 'M31,48 Q36,44 41,48' : 'M33,46 Q36,49 39,46'}
        stroke="#FF8FAB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Excited eyebrows */}
      {excited && (
        <>
          <path d="M20,24 Q27,20 33,24" stroke="#FFD84A" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M39,24 Q46,20 53,24" stroke="#FFD84A" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* Stars for correct */}
      {excited && (
        <>
          <text x="62" y="20" fontSize="10" className="star-float">⭐</text>
          <text x="68" y="36" fontSize="8" className="star-float2">✨</text>
        </>
      )}
    </svg>
  )
}

function DogSVG({ state }: { state: PetState }) {
  const excited = state === 'correct'
  const sad = state === 'wrong'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
      {/* Tail */}
      <path className={excited ? 'tail-fast' : sad ? 'tail-still' : 'tail-sway'}
        d="M55,58 Q70,50 72,36"
        stroke="#3B2A1A" strokeWidth="6" fill="none" strokeLinecap="round"
        style={{ transformOrigin: '55px 58px' }} />
      {/* Body */}
      <ellipse cx="38" cy="65" rx="18" ry="13" fill="#3B2A1A" />
      <ellipse cx="38" cy="67" rx="12" ry="8" fill="#6B4A2A" />
      {/* Paws */}
      <ellipse cx="26" cy="75" rx="9" ry="5" fill="#3B2A1A" />
      <ellipse cx="50" cy="75" rx="9" ry="5" fill="#3B2A1A" />
      {/* Floppy ears */}
      <ellipse cx="16" cy="40" rx="8" ry="15" fill="#5C3A20"
        style={{ transform: 'rotate(-15deg)', transformOrigin: '16px 30px' }} />
      <ellipse cx="60" cy="40" rx="8" ry="15" fill="#5C3A20"
        style={{ transform: 'rotate(15deg)', transformOrigin: '60px 30px' }} />
      {/* Head */}
      <circle cx="38" cy="36" r="22" fill="#3B2A1A" />
      {/* Snout */}
      <ellipse cx="38" cy="45" rx="11" ry="8" fill="#6B4A2A" />
      {/* Nose */}
      <ellipse cx="38" cy="41" rx="5.5" ry="4" fill="#1A0F0A" />
      <ellipse cx="36.5" cy="40" rx="1.5" ry="1" fill="white" opacity="0.5" />
      {/* Eyes */}
      {sad ? (
        <>
          <ellipse cx="28" cy="33" rx="6" ry="5" fill="#5BB8D4" />
          <ellipse cx="28" cy="34" rx="3.5" ry="3" fill="#1A1530" />
          <ellipse cx="48" cy="33" rx="6" ry="5" fill="#5BB8D4" />
          <ellipse cx="48" cy="34" rx="3.5" ry="3" fill="#1A1530" />
          <ellipse cx="25" cy="38" rx="1.5" ry="2.5" fill="#88AAFF" opacity="0.7" />
        </>
      ) : (
        <>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="28" cy="32" rx="6" ry="7" fill="#5BB8D4" />
            <ellipse cx="28" cy="33" rx="3.5" ry="4.5" fill="#1A1530" />
            <ellipse cx="27" cy="31" rx="1.5" ry="1.5" fill="white" />
          </g>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="48" cy="32" rx="6" ry="7" fill="#5BB8D4" />
            <ellipse cx="48" cy="33" rx="3.5" ry="4.5" fill="#1A1530" />
            <ellipse cx="47" cy="31" rx="1.5" ry="1.5" fill="white" />
          </g>
        </>
      )}
      {/* Mouth */}
      <path d={excited ? 'M30,50 Q38,56 46,50' : sad ? 'M30,52 Q38,47 46,52' : 'M32,50 Q38,54 44,50'}
        stroke="#3B2A1A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Excited eyebrows */}
      {excited && (
        <>
          <path d="M22,23 Q28,18 34,22" stroke="#FFD84A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M42,22 Q48,18 54,23" stroke="#FFD84A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <text x="62" y="20" fontSize="10" className="star-float">⭐</text>
          <text x="67" y="36" fontSize="8" className="star-float2">✨</text>
        </>
      )}
    </svg>
  )
}

function BunnySVG({ state }: { state: PetState }) {
  const excited = state === 'correct'
  const sad = state === 'wrong'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
      {/* Ears */}
      <ellipse cx="24" cy="14" rx="7" ry="18" fill="#2A2040"
        style={{ transform: 'rotate(-8deg)', transformOrigin: '24px 30px' }} />
      <ellipse cx="24" cy="14" rx="4" ry="13" fill="#E86090"
        style={{ transform: 'rotate(-8deg)', transformOrigin: '24px 30px' }} />
      <ellipse cx="50" cy="14" rx="7" ry="18" fill="#2A2040"
        style={{ transform: 'rotate(8deg)', transformOrigin: '50px 30px' }} />
      <ellipse cx="50" cy="14" rx="4" ry="13" fill="#E86090"
        style={{ transform: 'rotate(8deg)', transformOrigin: '50px 30px' }} />
      {/* Tail */}
      <circle cx="54" cy="64" r="6" fill="#3A3060"
        className={excited ? 'tail-fast' : 'tail-sway'}
        style={{ transformOrigin: '38px 64px' }} />
      {/* Body */}
      <ellipse cx="37" cy="65" rx="17" ry="13" fill="#2A2040" />
      <ellipse cx="37" cy="67" rx="11" ry="8" fill="#3A3060" />
      {/* Paws */}
      <ellipse cx="25" cy="75" rx="9" ry="5" fill="#2A2040" />
      <ellipse cx="49" cy="75" rx="9" ry="5" fill="#2A2040" />
      {/* Head */}
      <circle cx="37" cy="38" r="21" fill="#2A2040" />
      {/* Nose */}
      <ellipse cx="37" cy="44" rx="3.5" ry="2.5" fill="#FFB3CC" />
      {/* Eyes */}
      {sad ? (
        <>
          <ellipse cx="28" cy="36" rx="6" ry="5" fill="#E86090" />
          <ellipse cx="28" cy="37" rx="3.5" ry="3" fill="#1A1530" />
          <ellipse cx="46" cy="36" rx="6" ry="5" fill="#E86090" />
          <ellipse cx="46" cy="37" rx="3.5" ry="3" fill="#1A1530" />
          <ellipse cx="25" cy="41" rx="1.5" ry="2.5" fill="#88AAFF" opacity="0.7" />
        </>
      ) : (
        <>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="28" cy="36" rx="6" ry="7" fill="#E86090" />
            <ellipse cx="28" cy="37" rx="3.5" ry="4.5" fill="#1A1530" />
            <ellipse cx="27" cy="34" rx="1.5" ry="1.5" fill="white" />
          </g>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="46" cy="36" rx="6" ry="7" fill="#E86090" />
            <ellipse cx="46" cy="37" rx="3.5" ry="4.5" fill="#1A1530" />
            <ellipse cx="45" cy="34" rx="1.5" ry="1.5" fill="white" />
          </g>
        </>
      )}
      {/* Mouth */}
      <path d={excited ? 'M31,48 Q37,53 43,48' : sad ? 'M31,50 Q37,46 43,50' : 'M33,48 Q37,51 41,48'}
        stroke="#FFB3CC" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {excited && (
        <>
          <path d="M22,26 Q28,22 33,25" stroke="#E86090" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M41,25 Q46,22 52,26" stroke="#E86090" strokeWidth="2" fill="none" strokeLinecap="round" />
          <text x="62" y="20" fontSize="10" className="star-float">🥕</text>
          <text x="67" y="36" fontSize="8" className="star-float2">✨</text>
        </>
      )}
    </svg>
  )
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function PetCompanion({
  petType = 'cat',
  state = 'idle',
  size = 60,
  hideName = false,
}: {
  petType?: PetType
  state?: PetState
  size?: number
  hideName?: boolean
}) {
  const [bubble, setBubble] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (state === 'correct' || state === 'wrong') {
      // Small delay so animation plays before bubble appears
      timerRef.current = setTimeout(() => {
        setBubble(pickRandom(MESSAGES[petType][state]))
        timerRef.current = setTimeout(() => setBubble(null), 2400)
      }, 180)
    } else {
      setBubble(null)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [state, petType])

  const scale = size / 80

  return (
    <>
      <style>{`
        @keyframes tail-sway {
          0%,100% { transform: rotate(-10deg); }
          50%      { transform: rotate(14deg); }
        }
        @keyframes tail-fast {
          0%,100% { transform: rotate(-20deg); }
          50%      { transform: rotate(22deg); }
        }
        @keyframes tail-still {
          0%,100% { transform: rotate(-5deg); }
          50%      { transform: rotate(5deg); }
        }
        @keyframes eye-blink {
          0%,87%,100% { transform: scaleY(1); }
          91%,95%     { transform: scaleY(0.05); }
        }
        @keyframes pet-bounce {
          0%,100% { transform: translateY(0); }
          45%     { transform: translateY(-10px); }
        }
        @keyframes pet-shake {
          0%,100% { transform: translateX(0); }
          25%     { transform: translateX(-4px); }
          75%     { transform: translateX(4px); }
        }
        @keyframes star-float {
          0%   { opacity:1; transform: translateY(0) scale(1); }
          100% { opacity:0; transform: translateY(-20px) scale(0.5); }
        }
        @keyframes star-float2 {
          0%   { opacity:1; transform: translateY(0) scale(1); }
          100% { opacity:0; transform: translateY(-16px) scale(0.5); }
        }
        @keyframes bubble-in {
          from { opacity:0; transform: scale(0.85) translateY(4px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        .tail-sway  { animation: tail-sway 1.6s ease-in-out infinite; }
        .tail-fast  { animation: tail-fast 0.4s ease-in-out infinite; }
        .tail-still { animation: tail-still 3s ease-in-out infinite; }
        .eye-blink  { animation: eye-blink 3.8s ease-in-out infinite; }
        .star-float  { animation: star-float 1.2s ease-out forwards; }
        .star-float2 { animation: star-float2 1.2s 0.2s ease-out forwards; }
      `}</style>

      <div style={{ position: 'relative', display: 'inline-block', width: size, height: hideName ? size : size + 14 }}>
        {/* Speech bubble */}
        {bubble && (
          <div style={{
            position: 'absolute',
            bottom: size + 8,
            right: 0,
            background: 'rgba(10,8,20,0.95)',
            border: '1px solid rgba(255,216,74,0.35)',
            borderRadius: 10,
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: 600,
            color: '#F2F5FA',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: 'bubble-in 0.2s ease-out',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 10,
          }}>
            {bubble}
            {/* Bubble arrow */}
            <div style={{
              position: 'absolute',
              bottom: -6,
              right: 14,
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '6px solid rgba(255,216,74,0.35)',
            }} />
          </div>
        )}

        {/* Animal */}
        <div style={{
          width: size,
          height: size,
          animation: state === 'correct'
            ? 'pet-bounce 0.45s ease-in-out infinite'
            : state === 'wrong'
            ? 'pet-shake 0.12s ease-in-out 6'
            : undefined,
          transform: `scale(${scale})`,
          transformOrigin: 'bottom center',
        }}>
          {petType === 'cat'   && <CatSVG   state={state} />}
          {petType === 'dog'   && <DogSVG   state={state} />}
          {petType === 'bunny' && <BunnySVG state={state} />}
        </div>

        {/* Name */}
        {!hideName && (
          <div style={{
            textAlign: 'center',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#FFD84A',
            textTransform: 'uppercase',
            marginTop: 2,
            textShadow: '0 0 8px rgba(255,216,74,0.6)',
          }}>
            {PET_NAMES[petType]}
          </div>
        )}
      </div>
    </>
  )
}

export { PET_NAMES }
