'use client'

/**
 * Path system — visual primitives shared by Library/Profile/Stats screens.
 * Re-usable: 3D circular path nodes, module banners, tooth-path connector,
 * sleeping cat / yarn / milk bowl decor, dotted curve connectors.
 *
 * All inline styles, theme-aware via the `accent` prop on nodes.
 */

import type { CSSProperties, ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Color helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Lighten (positive pct) or darken (negative) a hex color. */
export function shade(hex: string, pct: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const target = pct < 0 ? 0 : 255
  const p = Math.abs(pct) / 100
  const mix = (c: number) => Math.round(c + (target - c) * p)
  return '#' + [mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')
}

// ─────────────────────────────────────────────────────────────────────────────
// Path icons (small set — distinct from the main Icon library)
// ─────────────────────────────────────────────────────────────────────────────

type PathIconName =
  | 'book' | 'bookOpen' | 'tooth' | 'heart' | 'target' | 'bolt' | 'camera'
  | 'trophy' | 'sparkle' | 'warn' | 'eye' | 'pill' | 'check' | 'lock'
  | 'dental' | 'syringe' | 'mask' | 'star' | 'chevronR' | 'chevronL'
  | 'arrowR' | 'plus' | 'refresh'

const ICON_PATHS: Record<PathIconName, ReactNode> = {
  book:     <path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14zM4 19.5A2.5 2.5 0 006.5 22H20v-5" />,
  bookOpen: <path d="M2 4.5h6a3 3 0 013 3v12a2 2 0 00-2-2H2zM22 4.5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z" />,
  tooth:    <path d="M7 3c-2 0-4 1.5-4 5 0 2 1 4 1.5 6S5 19 6 21c.5 1 1.5 1 2 0l1.5-4c.3-.8.7-1 1.5-1s1.2.2 1.5 1l1.5 4c.5 1 1.5 1 2 0 1-2 1-5 1.5-7s1.5-4 1.5-6c0-3.5-2-5-4-5-1.5 0-2 .5-4 .5S8.5 3 7 3z" />,
  heart:    <path d="M12 21s-7-5-7-11a4 4 0 017-2.5A4 4 0 0119 10c0 6-7 11-7 11z" />,
  target:   <g><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></g>,
  bolt:     <path d="M13 2L3 14h7l-1 8 10-12h-7z" />,
  camera:   <g><path d="M3 8a2 2 0 012-2h2.5l1.5-2h6l1.5 2H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><circle cx="12" cy="13" r="3.5" /></g>,
  trophy:   <g><path d="M6 4h12v4a4 4 0 11-8 0V6" /><path d="M18 4h3v3a3 3 0 01-3 3M6 4H3v3a3 3 0 003 3M9 18h6l1 3H8z" /><path d="M10 14h4v4h-4z" /></g>,
  sparkle:  <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  warn:     <path d="M12 3L2 20h20zM12 10v4M12 17v.5" />,
  eye:      <g><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></g>,
  pill:     <g><rect x="3" y="9" width="18" height="6" rx="3" /><line x1="12" y1="9" x2="12" y2="15" /></g>,
  check:    <path d="M4 12.5l5 5L20 6.5" />,
  lock:     <g><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></g>,
  dental:   <g><path d="M12 3c4 0 5 4 5 7s-1 4-1 7-1 4-2 4-1-3-2-3-1 3-2 3-2-1-2-4-1-4-1-7 1-7 5-7z" /><path d="M9 7a3 3 0 016 0" /></g>,
  syringe:  <g><path d="M14 4l6 6M16 6l3 3M9 11l5 5-2 2-5-5zM7 13l-4 4 2 2 4-4" /></g>,
  mask:     <g><rect x="3" y="8" width="18" height="9" rx="3" /><path d="M3 11h-1M21 11h1M3 14h-1M21 14h1M8 11h2M14 11h2" /></g>,
  star:     <path d="M12 3l2.5 6 6.5.6-5 4.5L17.5 21 12 17.5 6.5 21 8 14.1l-5-4.5L9.5 9z" fill="currentColor" stroke="none" />,
  chevronR: <path d="M9 6l6 6-6 6" />,
  chevronL: <path d="M15 6l-6 6 6 6" />,
  arrowR:   <path d="M5 12h14M13 5l7 7-7 7" />,
  plus:     <path d="M12 5v14M5 12h14" />,
  refresh:  <path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5" />,
}

export function PathIcon({
  name, size = 22, color = 'currentColor', strokeWidth = 2,
}: { name: PathIconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name] ?? null}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Decorative SVGs — paws, yarn ball, milk bowl, sleeping cat, mini star
// ─────────────────────────────────────────────────────────────────────────────

export function YarnBall({ size = 40, hue = '#E11D48' }: { size?: number; hue?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="21" r="15" fill={hue} stroke={shade(hue, -20)} strokeWidth="1" />
      <path d="M8 18 Q20 6, 32 18 M6 24 Q20 12, 34 24 M8 30 Q20 22, 32 30 M14 36 Q20 28, 26 36"
        stroke={shade(hue, -30)} strokeWidth="1" fill="none" opacity="0.55" />
      <path d="M32 18 q4 1 4 6" stroke={shade(hue, -20)} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M36 24 q3 4 -2 6" stroke={shade(hue, -20)} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function SleepingCat({
  size = 110, cushionColor = '#F4C2D7',
}: { size?: number; cushionColor?: string }) {
  return (
    <svg width={size * 1.6} height={size} viewBox="0 0 160 100" style={{ overflow: 'visible' }}>
      <ellipse cx="80" cy="92" rx="62" ry="6" fill="rgba(15,27,45,0.10)" />
      <rect x="20" y="72" width="120" height="22" rx="11"
        fill={cushionColor} stroke={shade(cushionColor, -20)} strokeWidth="1.5" />
      <rect x="20" y="72" width="120" height="10" rx="5" fill={shade(cushionColor, 15)} opacity="0.7" />
      <circle cx="30" cy="83" r="3" fill={shade(cushionColor, -25)} />
      <circle cx="130" cy="83" r="3" fill={shade(cushionColor, -25)} />
      <path d="M120 65 Q140 55 130 78 Q120 88 100 80"
        stroke="#1A1830" strokeWidth="8" fill="none" strokeLinecap="round" />
      <ellipse cx="80" cy="65" rx="42" ry="22" fill="#1A1830" />
      <ellipse cx="80" cy="66" rx="32" ry="15" fill="#242048" />
      <circle cx="50" cy="58" r="18" fill="#1A1830" />
      <polygon points="38,44 42,30 52,42" fill="#1A1830" />
      <polygon points="40,42 43,35 49,42" fill="#D03898" />
      <path d="M44 56 Q48 58 52 56" stroke="#FFD84A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M54 56 Q58 58 62 56" stroke="#FFD84A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M48 64 Q50 66 52 64" stroke="#FF8FAB" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <text x="100" y="30" fill="#0E1424" fontSize="14" fontWeight="800" opacity="0.85">z</text>
      <text x="112" y="22" fill="#0E1424" fontSize="18" fontWeight="800" opacity="0.85">Z</text>
      <text x="128" y="12" fill="#0E1424" fontSize="22" fontWeight="800" opacity="0.85">Z</text>
    </svg>
  )
}

export function MilkBowl({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 60 36">
      <ellipse cx="30" cy="32" rx="22" ry="3" fill="rgba(15,27,45,0.10)" />
      <path d="M6 16 L9 30 a4 4 0 0 0 4 3 h34 a4 4 0 0 0 4 -3 L54 16 z"
        fill="#E4D4F4" stroke="#9B7BC4" strokeWidth="1.3" />
      <ellipse cx="30" cy="16" rx="24" ry="6" fill="#FAFBFD" stroke="#9B7BC4" strokeWidth="1.3" />
      <ellipse cx="30" cy="15" rx="19" ry="3" fill="#fff" opacity="0.85" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PathNode — 3D circle node, Duolingo-style depth
// ─────────────────────────────────────────────────────────────────────────────

export type PathNodeState = 'completed' | 'current' | 'available' | 'locked' | 'boss'

export function PathNode({
  state = 'available',
  icon = 'book',
  size = 70,
  label,
  sublabel,
  isBoss = false,
  accent = '#0A66E0',
  onClick,
  disabled,
}: {
  state?: PathNodeState
  icon?: PathIconName
  size?: number
  label?: ReactNode
  sublabel?: ReactNode
  isBoss?: boolean
  accent?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const SIZE = isBoss ? 90 : size
  const DEPTH = 7
  const customDeep = shade(accent, -25)

  const palette: Record<PathNodeState, { face: string; edge: string; iconCol: string; ringCol: string }> = {
    completed: { face: '#16A34A', edge: '#0E7036',  iconCol: '#fff',    ringCol: '#16A34A' },
    current:   { face: accent,    edge: customDeep, iconCol: '#fff',    ringCol: accent     },
    available: { face: accent,    edge: customDeep, iconCol: '#fff',    ringCol: accent     },
    locked:    { face: '#D8DDE5', edge: '#A8B0BB',  iconCol: '#7C8693', ringCol: '#A8B0BB'  },
    boss:      { face: '#F59E0B', edge: '#B45309',  iconCol: '#fff',    ringCol: '#F59E0B'  },
  }
  const p = palette[state]

  return (
    <div style={{
      position: 'relative', width: SIZE + 30, display: 'flex', flexDirection: 'column',
      alignItems: 'center', cursor: onClick && !disabled ? 'pointer' : 'inherit',
    }} onClick={!disabled ? onClick : undefined}>
      {state === 'current' && (
        <>
          <div style={{
            position: 'absolute', top: -4, left: '50%',
            width: SIZE + 14, height: SIZE + 14, marginLeft: -(SIZE + 14) / 2,
            borderRadius: '50%', border: `3px solid ${p.ringCol}`,
            opacity: 0.4, animation: 'dp-pulse 1.8s ease-out infinite',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: -4, left: '50%',
            width: SIZE + 14, height: SIZE + 14, marginLeft: -(SIZE + 14) / 2,
            borderRadius: '50%', border: `3px solid ${p.ringCol}`,
            opacity: 0.6, animation: 'dp-pulse 1.8s 0.6s ease-out infinite',
            pointerEvents: 'none',
          }} />
        </>
      )}

      <div style={{ position: 'relative', width: SIZE, height: SIZE + DEPTH }}>
        <div style={{
          position: 'absolute', left: 0, top: DEPTH, width: SIZE, height: SIZE,
          background: p.edge, borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE,
          background: p.face, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: state === 'locked'
            ? 'inset 0 -2px 0 rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.45)'
            : `inset 0 -3px 0 rgba(0,0,0,0.10), inset 0 2px 0 rgba(255,255,255,0.25), 0 1px 2px rgba(15,27,45,0.08)`,
        }}>
          {state === 'completed' ? (
            <PathIcon name="check" size={isBoss ? 40 : 32} color={p.iconCol} strokeWidth={3.2} />
          ) : state === 'locked' ? (
            <PathIcon name="lock" size={isBoss ? 32 : 26} color={p.iconCol} strokeWidth={2.4} />
          ) : (
            <PathIcon name={icon} size={isBoss ? 40 : 30} color={p.iconCol} strokeWidth={2} />
          )}
        </div>

        {state === 'completed' && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 24, height: 24, borderRadius: 12,
            background: 'linear-gradient(135deg, #FFD84A 0%, #F59E0B 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}>
            <PathIcon name="star" size={13} color="#fff" strokeWidth={0} />
          </div>
        )}

      </div>

      {label && (
        <div style={{
          marginTop: 8, textAlign: 'center', maxWidth: 110,
          fontSize: 11.5, fontWeight: 700, color: state === 'locked' ? '#8A95A5' : '#0F1B2D',
          lineHeight: 1.25, letterSpacing: -0.1,
        }}>{label}</div>
      )}
      {sublabel && (
        <div style={{
          textAlign: 'center', maxWidth: 110, marginTop: 2,
          fontSize: 10, color: '#8A95A5', fontWeight: 600,
        }}>{sublabel}</div>
      )}

      {state === 'current' && (
        <div style={{
          marginTop: 6,
          background: '#0E1424', color: '#fff',
          fontSize: 9.5, fontWeight: 800, letterSpacing: 1,
          padding: '4px 9px', borderRadius: 6, textTransform: 'uppercase',
          boxShadow: '0 4px 10px rgba(0,0,0,0.20)', whiteSpace: 'nowrap',
        }}>Commencer</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CurveConnector — soft dotted curve linking consecutive PathRow nodes
// ─────────────────────────────────────────────────────────────────────────────

export function CurveConnector({ from, to }: { from: number; to: number }) {
  const x1 = from * 50
  const x2 = to * 50
  const cx = (x1 + x2) / 2 + (x2 - x1) * 0.25
  return (
    <svg
      width="100%" height="64" viewBox="-130 -2 260 68" preserveAspectRatio="none"
      style={{
        position: 'absolute', left: 0, right: 0, top: -32, height: 64,
        pointerEvents: 'none', zIndex: 0, overflow: 'visible',
      }}>
      <path
        d={`M ${x1} 0 Q ${cx} 32 ${x2} 64`}
        fill="none" stroke="#D8DCE4" strokeWidth="2.5"
        strokeDasharray="5 8" strokeLinecap="round" opacity="0.55"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PathRow — positions a node horizontally on a -2..+2 amplitude axis
// ─────────────────────────────────────────────────────────────────────────────

export function PathRow({
  pos = 0,
  from,
  children,
  left,
  right,
  height = 160,
}: {
  pos?: number
  from?: number
  children: ReactNode
  left?: ReactNode
  right?: ReactNode
  height?: number
}) {
  const offset = pos * 50
  return (
    <div style={{
      position: 'relative', height,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {from !== undefined && from !== null && <CurveConnector from={from} to={pos} />}
      <div style={{ position: 'relative', transform: `translateX(${offset}px)` }}>
        {children}
      </div>
      {left}
      {right}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Decorative tooth (used in module break path)
// ─────────────────────────────────────────────────────────────────────────────

function DecorTooth({ size = 22, tilt = 0, opacity = 1, glow = false }: { size?: number; tilt?: number; opacity?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 24 28"
      style={{
        transform: `rotate(${tilt}deg)`, opacity,
        filter: glow ? 'drop-shadow(0 2px 4px rgba(15,27,45,0.18))' : 'none',
      }}>
      <path
        d="M12 2c-3 0-5 1.5-5 5 0 2.5 1 4.5 1.5 7s.5 5 1 7 .5 4 1.5 4 1.5-3 1.5-5 .5-3 .5-3 .5 0 .5 3 1 5 2 5 1-2 1.5-4 .5-5 1-7 1.5-4.5 1.5-7c0-3.5-2-5-6-5z"
        fill="#FAF3E0" stroke="#E5DCC2" strokeWidth="1.2"
      />
      <path d="M9 6c0-2 1.5-3 3-3" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85" />
    </svg>
  )
}

function ToothPathConnector({ height = 144 }: { height?: number }) {
  const teeth = [
    { x: 0,   y: 0.04, size: 22, tilt: -20 },
    { x: 28,  y: 0.18, size: 26, tilt: -10 },
    { x: 48,  y: 0.32, size: 30, tilt: 0,  glow: true },
    { x: 60,  y: 0.50, size: 34, tilt: 12, glow: true },
    { x: 48,  y: 0.68, size: 30, tilt: 24, glow: true },
    { x: 20,  y: 0.82, size: 26, tilt: 14 },
    { x: -10, y: 0.95, size: 22, tilt: -2 },
  ]
  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      {teeth.map((t, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `calc(50% + ${t.x}px - ${t.size / 2}px)`,
          top: `${t.y * 100}%`,
        }}>
          <DecorTooth size={t.size} tilt={t.tilt} opacity={0.95} glow={t.glow} />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ModuleBreak — tooth path + cat / yarn / bowl decorative scene
// ─────────────────────────────────────────────────────────────────────────────

export type ModuleBreakVariant = 'cat' | 'yarn' | 'bowl'

export function ModuleBreak({ variant = 'cat' }: { variant?: ModuleBreakVariant }) {
  // Simplified: just a small, centered sitting Heidi as a soft divider.
  return (
    <div style={{
      padding: '20px 16px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <SittingHeidi size={64} />
      <div style={{
        fontSize: 10.5, fontWeight: 700, color: '#8A95A5',
        letterSpacing: 1.2, textTransform: 'uppercase',
      }}>
        {variant === 'yarn' ? 'Continue !' : variant === 'bowl' ? 'Bon courage' : 'Heidi te suit'}
      </div>
    </div>
  )
}

/** Minimal sitting Heidi — same identity as PetCompanion but static, simple, centered. */
function SittingHeidi({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
      {/* Ground shadow */}
      <ellipse cx="40" cy="76" rx="22" ry="3" fill="rgba(15,27,45,0.10)" />
      {/* Tail curled around base */}
      <path d="M58,70 Q70,60 64,46" stroke="#1A1830" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="40" cy="64" rx="20" ry="14" fill="#1A1830" />
      <ellipse cx="40" cy="66" rx="12" ry="8" fill="#242048" />
      {/* Paws front */}
      <ellipse cx="32" cy="74" rx="5" ry="3" fill="#1A1830" />
      <ellipse cx="48" cy="74" rx="5" ry="3" fill="#1A1830" />
      {/* Ears */}
      <polygon points="20,30 22,12 36,26" fill="#1A1830" />
      <polygon points="22,28 24,17 33,26" fill="#D03898" />
      <polygon points="44,26 58,12 60,30" fill="#1A1830" />
      <polygon points="47,26 56,17 58,28" fill="#D03898" />
      {/* Head */}
      <circle cx="40" cy="40" r="20" fill="#1A1830" />
      {/* Eyes */}
      <ellipse cx="32" cy="38" rx="5.5" ry="7" fill="#FFD84A" />
      <ellipse cx="32" cy="39" rx="2.5" ry="5" fill="#0A0818" />
      <circle cx="33.5" cy="34.5" r="1.5" fill="#fff" />
      <ellipse cx="48" cy="38" rx="5.5" ry="7" fill="#FFD84A" />
      <ellipse cx="48" cy="39" rx="2.5" ry="5" fill="#0A0818" />
      <circle cx="49.5" cy="34.5" r="1.5" fill="#fff" />
      {/* Nose + mouth */}
      <path d="M38,46 Q40,48 42,46" stroke="#FF8FAB" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M40,46 Q38,50 35,49" stroke="#1A1830" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M40,46 Q42,50 45,49" stroke="#1A1830" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function DecorLabel({ emoji, children }: { emoji: string; children: ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800, color: '#5A6675',
      letterSpacing: 0.6, textTransform: 'uppercase',
      background: '#FFFFFF', padding: '4px 9px', borderRadius: 7,
      border: '1px solid #E4E8EE',
      boxShadow: '0 2px 4px rgba(15,27,45,0.06)',
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <span>{emoji}</span> {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ModuleBanner — header card at the start of each module's path segment
// ─────────────────────────────────────────────────────────────────────────────

export function ModuleBanner({
  moduleId, label, sublabel, accent, icon, doneNodes, totalNodes, isActive, onClick,
}: {
  moduleId: string
  label: string
  sublabel?: string
  accent: string
  icon: PathIconName
  doneNodes: number
  totalNodes: number
  isActive?: boolean
  onClick?: () => void
}) {
  return (
    <div style={{ padding: '6px 16px 12px' }}>
      <div onClick={onClick} style={{
        position: 'relative',
        borderRadius: 20,
        background: `linear-gradient(135deg, ${accent} 0%, ${shade(accent, -22)} 100%)`,
        padding: '16px 18px',
        boxShadow: `0 10px 22px -10px ${accent}aa, inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -4px 0 ${shade(accent, -32)}`,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}>
        <div style={{
          position: 'absolute', right: -8, top: -8, opacity: 0.22, transform: 'rotate(15deg)',
        }}>
          <svg width="96" height="116" viewBox="0 0 24 28">
            <path
              d="M12 2c-3 0-5 1.5-5 5 0 2.5 1 4.5 1.5 7s.5 5 1 7 .5 4 1.5 4 1.5-3 1.5-5 .5-3 .5-3 .5 0 .5 3 1 5 2 5 1-2 1.5-4 .5-5 1-7 1.5-4.5 1.5-7c0-3.5-2-5-6-5z"
              fill="#fff" stroke="#fff" strokeWidth="0.6"
            />
          </svg>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
            flexShrink: 0,
          }}>
            <PathIcon name={icon} size={22} color="#fff" strokeWidth={1.9} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
              letterSpacing: 0.8, textTransform: 'uppercase',
            }}>{moduleId} · Module</div>
            <div style={{
              fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: -0.3,
              marginTop: 1, lineHeight: 1.2,
              textShadow: '0 1px 2px rgba(0,0,0,0.10)',
            }}>{label}</div>
            {sublabel && (
              <div style={{
                fontSize: 11, color: 'rgba(255,255,255,0.80)', fontWeight: 600,
                marginTop: 2,
              }}>{sublabel}</div>
            )}
          </div>
          {isActive && (
            <div style={{
              padding: '4px 8px', borderRadius: 6,
              background: '#fff', color: accent,
              fontSize: 9.5, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase',
              flexShrink: 0,
              boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.10)',
            }}>En cours</div>
          )}
        </div>

        {totalNodes > 0 && (
          <>
            <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
              {Array.from({ length: totalNodes }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 4,
                  background: i < doneNodes ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.22)',
                  boxShadow: i < doneNodes ? '0 0 6px rgba(255,255,255,0.5)' : 'none',
                }} />
              ))}
            </div>
            <div style={{
              marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.85)',
              fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            }}>
              {doneNodes} / {totalNodes} fascicules · <span style={{ opacity: 0.8 }}>{totalNodes > 0 ? Math.round(doneNodes / totalNodes * 100) : 0}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ModuleRail — horizontal scroll chip selector at top of Library
// ─────────────────────────────────────────────────────────────────────────────

export type RailModule = {
  id: string
  label: string
  accent: string
  icon: PathIconName
  done: number
  total: number
  status?: 'done' | 'active' | 'open'
}

export function ModuleRail({
  modules, activeId, onPick,
}: {
  modules: RailModule[]
  activeId?: string
  onPick?: (id: string) => void
}) {
  return (
    <div style={{ padding: '4px 0 14px' }}>
      <div style={{
        fontSize: 10.5, color: '#5A6675', fontWeight: 800, letterSpacing: 0.6,
        textTransform: 'uppercase', padding: '0 16px', marginBottom: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>Choisis ton module</span>
        <span style={{ color: '#8A95A5', fontWeight: 600, letterSpacing: 0.2, textTransform: 'none' }}>
          glisse →
        </span>
      </div>
      <div className="dp-rail" style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 6px',
      }}>
        <style>{`.dp-rail::-webkit-scrollbar{display:none}.dp-rail{scrollbar-width:none;-ms-overflow-style:none}`}</style>
        {modules.map(m => {
          const isActive = m.id === activeId
          const pct = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0
          return (
            <div key={m.id}
              onClick={() => onPick?.(m.id)}
              style={{
                flexShrink: 0, width: 86, padding: '10px 8px 8px',
                borderRadius: 14,
                background: '#FFFFFF',
                border: isActive ? `2px solid ${m.accent}` : `1px solid #E4E8EE`,
                boxShadow: isActive
                  ? `0 6px 16px -6px ${m.accent}66, 0 1px 0 rgba(15,27,45,0.04)`
                  : '0 1px 0 rgba(15,27,45,0.04)',
                position: 'relative', cursor: 'pointer',
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11,
                background: pct > 0
                  ? `linear-gradient(135deg, ${m.accent} 0%, ${shade(m.accent, -20)} 100%)`
                  : '#F0F2F5',
                color: pct > 0 ? '#fff' : '#8A95A5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 7px',
                boxShadow: pct > 0
                  ? `inset 0 -2px 0 rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 4px ${m.accent}55`
                  : 'inset 0 -1px 0 rgba(0,0,0,0.05)',
              }}>
                <PathIcon name={m.icon} size={18} color="currentColor" strokeWidth={2.1} />
              </div>
              <div style={{
                textAlign: 'center', fontSize: 9.5, fontWeight: 800,
                color: isActive ? m.accent : '#5A6675',
                letterSpacing: 0.6, textTransform: 'uppercase',
              }}>{m.id}</div>
              <div style={{
                textAlign: 'center', fontSize: 11.5, fontWeight: 700,
                color: '#0F1B2D', marginTop: 1, lineHeight: 1.2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{m.label}</div>
              <div style={{
                marginTop: 7, height: 4, borderRadius: 3, background: '#EEF1F5',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: m.accent, borderRadius: 3, transition: 'width .4s',
                }} />
              </div>
              {m.status === 'done' && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 18, height: 18, borderRadius: 9,
                  background: '#16A34A', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(22,163,74,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}>
                  <PathIcon name="check" size={11} color="#fff" strokeWidth={3} />
                </div>
              )}
              {m.status === 'active' && (
                <div style={{
                  position: 'absolute', top: -3, right: -3,
                  background: m.accent, color: '#fff',
                  fontSize: 8.5, fontWeight: 900, letterSpacing: 0.6,
                  padding: '2px 5px', borderRadius: 5, textTransform: 'uppercase',
                  boxShadow: `0 2px 4px ${m.accent}66`,
                }}>en cours</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionLabel — small uppercase header used across pages
// ─────────────────────────────────────────────────────────────────────────────

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800, color: '#5A6675',
      letterSpacing: 0.7, textTransform: 'uppercase',
      marginBottom: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span>{children}</span>
      {right && <span style={{ color: '#0A66E0', fontWeight: 800, textTransform: 'none', letterSpacing: 0 }}>{right}</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Global keyframes — drop once at the root of the page
// ─────────────────────────────────────────────────────────────────────────────

export function PathSystemStyles() {
  return (
    <style>{`
      @keyframes dp-pulse { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.5);opacity:0} }
      @keyframes dp-bob   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      @keyframes dp-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    `}</style>
  )
}
