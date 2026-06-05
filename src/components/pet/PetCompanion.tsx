'use client'

import { useEffect, useRef, useState } from 'react'
import AccessoryLayer from './AccessoryLayer'
import type { EquippedAccessories } from '@/lib/accessories'

export type PetType = 'cat' | 'dog' | 'bunny'
export type PetState = 'idle' | 'correct' | 'wrong' | 'thinking'

const MESSAGES: Record<PetType, Record<'correct' | 'wrong', string[]>> = {
  cat: {
    correct: ['Purrrfait !', 'C\'est ça !', 'Tu maîtrises !', 'Heidi valide !', 'Bravo !!'],
    wrong: ['Oh non !', 'Relève-toi !', 'Prochaine fois !', 'Tu vas y arriver !'],
  },
  dog: {
    correct: ['OUAF !!', 'Génial !!', 'Rex est fier !', 'Parfait !', 'Trop fort !'],
    wrong: ['Allez !!', 'Tu peux !', 'Courage !', 'Encore un effort !'],
  },
  bunny: {
    correct: ['Hop hop !!', 'Excellent !', 'Lune est ravie !', 'Super !!', 'Bravo !'],
    wrong: ['Oh...', 'Rebondis !', 'Prochaine fois !', 'Courage !'],
  },
}

export const PET_NAMES: Record<PetType, string> = { cat: 'Heidi', dog: 'Rex', bunny: 'Lune' }

// ─── CAT ────────────────────────────────────────────────────────
function CatSVG({ state }: { state: PetState }) {
  const excited = state === 'correct'
  const sad = state === 'wrong'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
      {/* Tail – sweeps right and up behind body */}
      <path
        className={excited ? 'tail-fast' : sad ? 'tail-still' : 'tail-sway'}
        d="M56,63 Q72,52 68,34"
        stroke="#1A1830" strokeWidth="6" fill="none" strokeLinecap="round"
        style={{ transformOrigin: '56px 63px' }}
      />
      {/* Body */}
      <ellipse cx="40" cy="66" rx="22" ry="13" fill="#1A1830" />
      <ellipse cx="40" cy="68" rx="13" ry="8" fill="#242048" />
      {/* Paws */}
      <ellipse cx="28" cy="75" rx="10" ry="5" fill="#1A1830" />
      <ellipse cx="52" cy="75" rx="10" ry="5" fill="#1A1830" />
      {/* Left ear outer */}
      <polygon points="18,26 20,4 37,20" fill="#1A1830" />
      {/* Left ear inner */}
      <polygon points="21,24 23,10 34,20" fill="#D03898" />
      {/* Right ear outer */}
      <polygon points="43,20 60,4 62,26" fill="#1A1830" />
      {/* Right ear inner */}
      <polygon points="46,20 57,10 59,24" fill="#D03898" />
      {/* Head */}
      <circle cx="40" cy="37" r="23" fill="#1A1830" />
      {/* Eyes */}
      {sad ? (
        <>
          <ellipse cx="31" cy="35" rx="7" ry="8.5" fill="#FFD84A" />
          <ellipse cx="31" cy="36" rx="3" ry="6" fill="#0A0818" />
          <ellipse cx="49" cy="35" rx="7" ry="8.5" fill="#FFD84A" />
          <ellipse cx="49" cy="36" rx="3" ry="6" fill="#0A0818" />
          {/* Sad eyebrows */}
          <path d="M25,26 Q31,30 37,27" stroke="#FFD84A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M43,27 Q49,30 55,26" stroke="#FFD84A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* Tear */}
          <ellipse cx="28" cy="42" rx="1.8" ry="3.2" fill="#A0C0FF" opacity="0.85" />
        </>
      ) : (
        <>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="31" cy="34" rx="7" ry="8.5" fill="#FFD84A" />
            <ellipse cx="31" cy="35" rx="3" ry="6" fill="#0A0818" />
            <circle cx="33.5" cy="30.5" r="2" fill="white" />
          </g>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="49" cy="34" rx="7" ry="8.5" fill="#FFD84A" />
            <ellipse cx="49" cy="35" rx="3" ry="6" fill="#0A0818" />
            <circle cx="51.5" cy="30.5" r="2" fill="white" />
          </g>
        </>
      )}
      {/* Heart nose */}
      <path d="M38.5,45 Q40,42.5 41.5,45 L40,47 Z" fill="#FF8FAB" />
      {/* Mouth */}
      <path
        d={excited ? 'M34,48 Q40,55 46,48' : sad ? 'M34,52 Q40,47 46,52' : 'M35,48 Q40,52 45,48'}
        stroke="#FF8FAB" strokeWidth="1.6" fill="none" strokeLinecap="round"
      />
      {/* Whiskers */}
      {!sad && (
        <>
          <line x1="16" y1="42" x2="30" y2="44" stroke="#4A4868" strokeWidth="1" opacity="0.7" />
          <line x1="16" y1="46" x2="30" y2="46" stroke="#4A4868" strokeWidth="1" opacity="0.7" />
          <line x1="50" y1="44" x2="64" y2="42" stroke="#4A4868" strokeWidth="1" opacity="0.7" />
          <line x1="50" y1="46" x2="64" y2="46" stroke="#4A4868" strokeWidth="1" opacity="0.7" />
        </>
      )}
      {/* Excited eyebrows + stars */}
      {excited && (
        <>
          <path d="M23,23 Q30,17 37,21" stroke="#FFD84A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M43,21 Q50,17 57,23" stroke="#FFD84A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <text x="62" y="22" fontSize="11" className="star-float">⭐</text>
          <text x="67" y="38" fontSize="9" className="star-float2">✨</text>
        </>
      )}
    </svg>
  )
}

// ─── DOG ────────────────────────────────────────────────────────
function DogSVG({ state }: { state: PetState }) {
  const excited = state === 'correct'
  const sad = state === 'wrong'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
      {/* Tail */}
      <path
        className={excited ? 'tail-fast' : sad ? 'tail-still' : 'tail-sway'}
        d="M58,62 Q74,50 70,32"
        stroke="#3B2010" strokeWidth="7" fill="none" strokeLinecap="round"
        style={{ transformOrigin: '58px 62px' }}
      />
      {/* Body */}
      <ellipse cx="40" cy="66" rx="22" ry="13" fill="#3B2010" />
      <ellipse cx="40" cy="69" rx="13" ry="8" fill="#5C3820" />
      {/* Paws */}
      <ellipse cx="28" cy="75" rx="10" ry="5" fill="#3B2010" />
      <ellipse cx="52" cy="75" rx="10" ry="5" fill="#3B2010" />
      {/* Floppy left ear */}
      <path d="M17,32 Q4,36 6,56 Q8,67 20,68 Q28,65 26,52 Q24,38 20,32 Z" fill="#5C3820" />
      {/* Floppy right ear */}
      <path d="M63,32 Q76,36 74,56 Q72,67 60,68 Q52,65 54,52 Q56,38 60,32 Z" fill="#5C3820" />
      {/* Head */}
      <circle cx="40" cy="40" r="24" fill="#3B2010" />
      {/* Snout */}
      <ellipse cx="40" cy="52" rx="13" ry="9" fill="#5C3820" />
      {/* Eyes */}
      {sad ? (
        <>
          <ellipse cx="30" cy="36" rx="7" ry="8" fill="#5BB8D4" />
          <ellipse cx="30" cy="37" rx="3.5" ry="5" fill="#0A0818" />
          <ellipse cx="50" cy="36" rx="7" ry="8" fill="#5BB8D4" />
          <ellipse cx="50" cy="37" rx="3.5" ry="5" fill="#0A0818" />
          {/* Sad eyebrows */}
          <path d="M23,26 Q30,31 36,28" stroke="#5BB8D4" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M44,28 Q50,31 57,26" stroke="#5BB8D4" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <ellipse cx="27" cy="44" rx="1.8" ry="3.2" fill="#A0C0FF" opacity="0.85" />
        </>
      ) : (
        <>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="30" cy="35" rx="7" ry="8" fill="#5BB8D4" />
            <ellipse cx="30" cy="36" rx="3.5" ry="5.5" fill="#0A0818" />
            <circle cx="32.5" cy="31.5" r="2" fill="white" />
          </g>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="50" cy="35" rx="7" ry="8" fill="#5BB8D4" />
            <ellipse cx="50" cy="36" rx="3.5" ry="5.5" fill="#0A0818" />
            <circle cx="52.5" cy="31.5" r="2" fill="white" />
          </g>
        </>
      )}
      {/* Nose */}
      <ellipse cx="40" cy="48" rx="5.5" ry="3.5" fill="#0A0505" />
      <ellipse cx="38.5" cy="47" rx="1.8" ry="1.1" fill="white" opacity="0.4" />
      {/* Mouth */}
      <path
        d={excited ? 'M30,55 Q40,63 50,55' : sad ? 'M30,58 Q40,53 50,58' : 'M32,55 Q40,60 48,55'}
        stroke="#5C3820" strokeWidth="2" fill="none" strokeLinecap="round"
      />
      {excited && (
        <>
          <path d="M22,25 Q29,19 36,23" stroke="#FFD84A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M44,23 Q51,19 58,25" stroke="#FFD84A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <text x="64" y="22" fontSize="11" className="star-float">⭐</text>
          <text x="68" y="38" fontSize="9" className="star-float2">✨</text>
        </>
      )}
    </svg>
  )
}

// ─── BUNNY ──────────────────────────────────────────────────────
function BunnySVG({ state }: { state: PetState }) {
  const excited = state === 'correct'
  const sad = state === 'wrong'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
      {/* Left ear outer */}
      <ellipse cx="28" cy="18" rx="8.5" ry="22"
        style={{ transform: 'rotate(-10deg)', transformOrigin: '28px 36px' }} fill="#1A1030" />
      {/* Left ear inner */}
      <ellipse cx="28" cy="18" rx="5" ry="15"
        style={{ transform: 'rotate(-10deg)', transformOrigin: '28px 36px' }} fill="#C8305A" />
      {/* Right ear outer */}
      <ellipse cx="52" cy="18" rx="8.5" ry="22"
        style={{ transform: 'rotate(10deg)', transformOrigin: '52px 36px' }} fill="#1A1030" />
      {/* Right ear inner */}
      <ellipse cx="52" cy="18" rx="5" ry="15"
        style={{ transform: 'rotate(10deg)', transformOrigin: '52px 36px' }} fill="#C8305A" />
      {/* Cotton tail */}
      <circle cx="62" cy="64" r="7.5" fill="#252045"
        className={excited ? 'tail-fast' : 'tail-sway'}
        style={{ transformOrigin: '40px 66px' }}
      />
      {/* Body */}
      <ellipse cx="40" cy="66" rx="21" ry="13" fill="#1A1030" />
      <ellipse cx="40" cy="69" rx="12" ry="7.5" fill="#231842" />
      {/* Paws */}
      <ellipse cx="27" cy="75" rx="10" ry="5" fill="#1A1030" />
      <ellipse cx="53" cy="75" rx="10" ry="5" fill="#1A1030" />
      {/* Head */}
      <circle cx="40" cy="44" r="22" fill="#1A1030" />
      {/* Eyes */}
      {sad ? (
        <>
          <ellipse cx="31" cy="42" rx="6.5" ry="7.5" fill="#D04070" />
          <ellipse cx="31" cy="43" rx="3" ry="5" fill="#0A0818" />
          <ellipse cx="49" cy="42" rx="6.5" ry="7.5" fill="#D04070" />
          <ellipse cx="49" cy="43" rx="3" ry="5" fill="#0A0818" />
          {/* Sad brows */}
          <path d="M25,33 Q31,38 37,35" stroke="#D04070" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M43,35 Q49,38 55,33" stroke="#D04070" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <ellipse cx="28" cy="49" rx="1.8" ry="3.2" fill="#A0C0FF" opacity="0.85" />
        </>
      ) : (
        <>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="31" cy="41" rx="6.5" ry="7.5" fill="#D04070" />
            <ellipse cx="31" cy="42" rx="3" ry="5.5" fill="#0A0818" />
            <circle cx="33.5" cy="37.5" r="2" fill="white" />
          </g>
          <g className="eye-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
            <ellipse cx="49" cy="41" rx="6.5" ry="7.5" fill="#D04070" />
            <ellipse cx="49" cy="42" rx="3" ry="5.5" fill="#0A0818" />
            <circle cx="51.5" cy="37.5" r="2" fill="white" />
          </g>
        </>
      )}
      {/* Nose */}
      <ellipse cx="40" cy="50" rx="3.5" ry="2.2" fill="#FFB3CC" />
      {/* Mouth */}
      <path
        d={excited ? 'M35,52 Q40,58 45,52' : sad ? 'M35,55 Q40,51 45,55' : 'M36,52 Q40,56 44,52'}
        stroke="#FFB3CC" strokeWidth="1.6" fill="none" strokeLinecap="round"
      />
      {excited && (
        <>
          <path d="M24,31 Q30,25 37,29" stroke="#D04070" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M43,29 Q50,25 56,31" stroke="#D04070" strokeWidth="2" fill="none" strokeLinecap="round" />
          <text x="62" y="22" fontSize="11" className="star-float">🥕</text>
          <text x="66" y="38" fontSize="9" className="star-float2">✨</text>
        </>
      )}
    </svg>
  )
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Level-based glow colors
const LEVEL_GLOW: Record<number, string> = {
  1: 'transparent',
  2: 'rgba(59,130,246,0.35)',
  3: 'rgba(139,92,246,0.5)',
  4: 'rgba(255,216,74,0.55)',
  5: 'rgba(255,100,180,0.6)',
}

export default function PetCompanion({
  petType = 'cat',
  state = 'idle',
  size = 60,
  hideName = false,
  hideAccessories = false,
  level = 1,
  equipped,
}: {
  petType?: PetType
  state?: PetState
  size?: number
  hideName?: boolean
  /** Cache tous les accessoires (utile pour les avatars sobres / setup). */
  hideAccessories?: boolean
  level?: number
  /** Équipement explicite. Si absent → fallback automatique basé sur le niveau XP. */
  equipped?: EquippedAccessories
}) {
  const [bubble, setBubble] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (state === 'correct' || state === 'wrong') {
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
  const glowColor = LEVEL_GLOW[Math.min(level, 5)] ?? 'transparent'
  const activeEquipped: EquippedAccessories = hideAccessories ? {} : (equipped ?? {})

  return (
    <>
      <style>{`
        @keyframes tail-sway  { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(14deg)} }
        @keyframes tail-fast  { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(24deg)} }
        @keyframes tail-still { 0%,100%{transform:rotate(-4deg)}  50%{transform:rotate(4deg)}  }
        @keyframes eye-blink  { 0%,87%,100%{transform:scaleY(1)} 91%,95%{transform:scaleY(0.05)} }
        @keyframes pet-bounce { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-12px)} }
        @keyframes pet-shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }
        @keyframes star-float  { 0%{opacity:1;transform:translateY(0) scale(1)}   100%{opacity:0;transform:translateY(-22px) scale(0.4)} }
        @keyframes star-float2 { 0%{opacity:1;transform:translateY(0) scale(1)}   100%{opacity:0;transform:translateY(-18px) scale(0.4)} }
        @keyframes bubble-in   { from{opacity:0;transform:scale(0.8) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .tail-sway  { animation: tail-sway  1.7s ease-in-out infinite; }
        .tail-fast  { animation: tail-fast  0.38s ease-in-out infinite; }
        .tail-still { animation: tail-still 3.2s ease-in-out infinite; }
        .eye-blink  { animation: eye-blink  4s ease-in-out infinite; }
        .star-float  { animation: star-float  1.3s ease-out forwards; }
        .star-float2 { animation: star-float2 1.3s 0.18s ease-out forwards; }
      `}</style>

      <div style={{ position: 'relative', display: 'inline-block', width: size, height: hideName ? size : size + 16 }}>

        {/* Speech bubble */}
        {bubble && (
          <div style={{
            position: 'absolute',
            bottom: hideName ? size + 6 : size + 20,
            right: 0,
            background: 'rgba(12,10,24,0.96)',
            border: `1px solid ${state === 'correct' ? 'rgba(255,216,74,0.4)' : 'rgba(200,80,160,0.35)'}`,
            borderRadius: 10,
            padding: '6px 11px',
            fontSize: 12, fontWeight: 700, color: '#F2F5FA',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: 'bubble-in 0.2s ease-out',
            boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
            zIndex: 10,
          }}>
            {bubble}
            <div style={{
              position: 'absolute', bottom: -7, right: 12,
              width: 0, height: 0,
              borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
              borderTop: `7px solid ${state === 'correct' ? 'rgba(255,216,74,0.4)' : 'rgba(200,80,160,0.35)'}`,
            }} />
          </div>
        )}

        {/* Animal — animation on outer (layout box), scale on inner (absolute, no flow impact) */}
        <div style={{
          width: size, height: size,
          position: 'relative', zIndex: 1,
          animation: state === 'correct'
            ? 'pet-bounce 0.42s ease-in-out infinite'
            : state === 'wrong'
            ? 'pet-shake 0.13s ease-in-out 5'
            : undefined,
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
            filter: level >= 2
              ? `drop-shadow(0 0 ${Math.round(size * 0.12)}px ${glowColor})`
              : undefined,
          }}>
            {petType === 'cat'   && <CatSVG   state={state} />}
            {petType === 'dog'   && <DogSVG   state={state} />}
            {petType === 'bunny' && <BunnySVG state={state} />}
            {/* Couche d'accessoires (même viewBox que le pet) */}
            <svg
              width="80" height="80" viewBox="0 0 80 80"
              style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
            >
              <AccessoryLayer pet={petType} equipped={activeEquipped} />
            </svg>
          </div>
        </div>

        {/* Name label */}
        {!hideName && (
          <div style={{
            textAlign: 'center', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.08em', color: '#FFD84A',
            textTransform: 'uppercase', marginTop: 3,
            textShadow: '0 0 10px rgba(255,216,74,0.5)',
          }}>
            {PET_NAMES[petType]}
          </div>
        )}
      </div>
    </>
  )
}
