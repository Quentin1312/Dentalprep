import type React from 'react'
import type { PetType } from './PetCompanion'
import type { AccessorySlot, EquippedAccessories } from '@/lib/accessories'

type Anchors = {
  headTop: { x: number; y: number }
  eyes:    { lx: number; rx: number; y: number }
  neck:    { x: number; y: number; width: number }
  chest:   { x: number; y: number }
  body:    { x: number; y: number }
}

const ANCHORS: Record<PetType, Anchors> = {
  cat:   { headTop: { x: 40, y: 16 }, eyes: { lx: 31, rx: 49, y: 35 }, neck: { x: 40, y: 58, width: 32 }, chest: { x: 40, y: 64 }, body: { x: 40, y: 66 } },
  dog:   { headTop: { x: 40, y: 18 }, eyes: { lx: 30, rx: 50, y: 35 }, neck: { x: 40, y: 60, width: 30 }, chest: { x: 40, y: 66 }, body: { x: 40, y: 67 } },
  bunny: { headTop: { x: 40, y: 24 }, eyes: { lx: 31, rx: 49, y: 41 }, neck: { x: 40, y: 60, width: 30 }, chest: { x: 40, y: 66 }, body: { x: 40, y: 67 } },
}

const NECK_CHARM: Record<PetType, React.ReactElement> = {
  cat:   <path d="M40,64 L37,67 Q40,71 43,67 Z" fill="#FF8FAB" stroke="#1A1830" strokeWidth="0.6" />,
  dog:   <path d="M37,64 h6 v3 q-3,2 -6,0 Z M38,64 v-1.5 h4 v1.5" fill="#E8E2D0" stroke="#1A1830" strokeWidth="0.6" />,
  bunny: <path d="M40,64 l-1.5,5 q1.5,1.2 3,0 l-1.5,-5 Z" fill="#FF8C4A" stroke="#1A1830" strokeWidth="0.6" />,
}

// ── HEAD ────────────────────────────────────────────────────────
function Cap({ pet }: { pet: PetType }) {
  const { x, y } = ANCHORS[pet].headTop
  return (
    <g>
      <ellipse cx={x} cy={y + 1} rx="16" ry="5" fill="#2A4A8A" />
      <path d={`M${x - 16},${y + 1} Q${x - 16},${y - 8} ${x},${y - 9} Q${x + 16},${y - 8} ${x + 16},${y + 1} Z`} fill="#3258AA" />
      <ellipse cx={x + 13} cy={y + 1} rx="9" ry="2.4" fill="#234380" opacity="0.6" />
      <circle cx={x} cy={y - 9} r="1.8" fill="#FFD84A" />
    </g>
  )
}

function GradCap({ pet }: { pet: PetType }) {
  const { x, y } = ANCHORS[pet].headTop
  return (
    <g>
      <ellipse cx={x} cy={y - 2} rx="9" ry="3.5" fill="#1A1830" />
      <polygon points={`${x - 14},${y - 5} ${x + 14},${y - 5} ${x + 14},${y - 3} ${x},${y + 1} ${x - 14},${y - 3}`} fill="#0F0E20" />
      <line x1={x + 12} y1={y - 5} x2={x + 17} y2={y + 4} stroke="#FFD84A" strokeWidth="0.9" />
      <circle cx={x + 17} cy={y + 5} r="1.6" fill="#FFD84A" />
      <circle cx={x + 17.5} cy={y + 5.5} r="0.6" fill="#FFB300" />
    </g>
  )
}

function CrownGold({ pet }: { pet: PetType }) {
  const { x, y } = ANCHORS[pet].headTop
  const base = y + 2
  return (
    <g>
      <path
        d={`M${x - 12},${base} L${x - 12},${base - 4} L${x - 7},${base - 1} L${x - 4},${base - 8} L${x},${base - 2} L${x + 4},${base - 8} L${x + 7},${base - 1} L${x + 12},${base - 4} L${x + 12},${base} Z`}
        fill="#FFD84A" stroke="#B8860B" strokeWidth="0.8"
      />
      <rect x={x - 12} y={base - 1} width="24" height="2.5" fill="#E8B820" stroke="#B8860B" strokeWidth="0.6" />
      <circle cx={x - 4} cy={base - 7} r="1" fill="#FF4D6D" />
      <circle cx={x + 4} cy={base - 7} r="1" fill="#FF4D6D" />
      <circle cx={x} cy={base - 1} r="1.1" fill="#5BB8D4" />
    </g>
  )
}

function CrownRoyal({ pet }: { pet: PetType }) {
  const { x, y } = ANCHORS[pet].headTop
  const base = y + 3
  return (
    <g>
      <path
        d={`M${x - 14},${base} L${x - 14},${base - 5} L${x - 9},${base} L${x - 5},${base - 10} L${x},${base - 3} L${x + 5},${base - 10} L${x + 9},${base} L${x + 14},${base - 5} L${x + 14},${base} Z`}
        fill="#FFD84A" stroke="#8B6914" strokeWidth="0.9"
      />
      <path d={`M${x - 14},${base - 5} Q${x},${base - 8} ${x + 14},${base - 5}`} stroke="#B8860B" strokeWidth="0.4" fill="none" />
      <rect x={x - 14} y={base - 1} width="28" height="3" fill="#E8B820" stroke="#8B6914" strokeWidth="0.7" />
      {/* Joyaux */}
      <circle cx={x - 5} cy={base - 9} r="1.3" fill="#FF4D6D" stroke="#8B0020" strokeWidth="0.3" />
      <circle cx={x + 5} cy={base - 9} r="1.3" fill="#5BB8D4" stroke="#1A4A66" strokeWidth="0.3" />
      <circle cx={x - 14} cy={base - 5} r="1.1" fill="#A8E8A8" stroke="#2A6A2A" strokeWidth="0.3" />
      <circle cx={x + 14} cy={base - 5} r="1.1" fill="#A8E8A8" stroke="#2A6A2A" strokeWidth="0.3" />
      <ellipse cx={x} cy={base + 0.5} rx="1.8" ry="1.1" fill="#FF4D6D" stroke="#8B0020" strokeWidth="0.3" />
      <circle cx={x - 9} cy={base + 0.5} r="0.7" fill="white" opacity="0.7" />
      <circle cx={x + 9} cy={base + 0.5} r="0.7" fill="white" opacity="0.7" />
    </g>
  )
}

// ── EYES ────────────────────────────────────────────────────────
function RoundGlasses({ pet }: { pet: PetType }) {
  const { lx, rx, y } = ANCHORS[pet].eyes
  return (
    <g>
      <circle cx={lx} cy={y} r="7.5" fill="rgba(180,210,255,0.18)" stroke="#1A1830" strokeWidth="1.6" />
      <circle cx={rx} cy={y} r="7.5" fill="rgba(180,210,255,0.18)" stroke="#1A1830" strokeWidth="1.6" />
      <line x1={lx + 7} y1={y} x2={rx - 7} y2={y} stroke="#1A1830" strokeWidth="1.4" />
      <circle cx={lx - 2} cy={y - 2.5} r="1.4" fill="white" opacity="0.5" />
      <circle cx={rx - 2} cy={y - 2.5} r="1.4" fill="white" opacity="0.5" />
    </g>
  )
}

function Sunglasses({ pet }: { pet: PetType }) {
  const { lx, rx, y } = ANCHORS[pet].eyes
  return (
    <g>
      <rect x={lx - 7} y={y - 4.5} width="14" height="8" rx="2.5" fill="#0A0818" stroke="#1A1830" strokeWidth="0.8" />
      <rect x={rx - 7} y={y - 4.5} width="14" height="8" rx="2.5" fill="#0A0818" stroke="#1A1830" strokeWidth="0.8" />
      <line x1={lx + 7} y1={y - 1} x2={rx - 7} y2={y - 1} stroke="#1A1830" strokeWidth="1.4" />
      <line x1={lx - 5} y1={y - 3} x2={lx + 2} y2={y - 3} stroke="#FFFFFF" strokeWidth="0.9" opacity="0.55" />
      <line x1={rx - 5} y1={y - 3} x2={rx + 2} y2={y - 3} stroke="#FFFFFF" strokeWidth="0.9" opacity="0.55" />
    </g>
  )
}

// ── NECK ────────────────────────────────────────────────────────
function Collar({ pet }: { pet: PetType }) {
  const { x, y, width } = ANCHORS[pet].neck
  return (
    <g>
      <path
        d={`M${x - width / 2},${y} Q${x},${y + 5} ${x + width / 2},${y}`}
        stroke="#7A1B3A" strokeWidth="3" fill="none" strokeLinecap="round"
      />
      <path
        d={`M${x - width / 2},${y} Q${x},${y + 5} ${x + width / 2},${y}`}
        stroke="#C8305A" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeDasharray="2 2"
      />
      {NECK_CHARM[pet]}
    </g>
  )
}

function Bowtie({ pet }: { pet: PetType }) {
  const { x, y } = ANCHORS[pet].neck
  return (
    <g>
      <polygon points={`${x - 8},${y - 1} ${x - 2},${y + 1.5} ${x - 2},${y + 4.5} ${x - 8},${y + 7}`} fill="#7A0028" />
      <polygon points={`${x + 8},${y - 1} ${x + 2},${y + 1.5} ${x + 2},${y + 4.5} ${x + 8},${y + 7}`} fill="#7A0028" />
      <rect x={x - 2.5} y={y + 1} width="5" height="5.5" rx="1" fill="#5A0020" />
      <circle cx={x - 5} cy={y + 3} r="0.6" fill="#FFD84A" opacity="0.7" />
      <circle cx={x + 5} cy={y + 3} r="0.6" fill="#FFD84A" opacity="0.7" />
    </g>
  )
}

function Stethoscope({ pet }: { pet: PetType }) {
  const { x, y } = ANCHORS[pet].neck
  return (
    <g>
      {/* Tubes en U autour du cou */}
      <path d={`M${x - 12},${y - 1} Q${x - 14},${y + 4} ${x - 6},${y + 8} L${x - 6},${y + 12}`} stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d={`M${x + 12},${y - 1} Q${x + 14},${y + 4} ${x + 6},${y + 8} L${x + 6},${y + 12}`} stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Petites olives auriculaires */}
      <circle cx={x - 12} cy={y - 1} r="1.4" fill="#E8E2D0" stroke="#1A1A1A" strokeWidth="0.4" />
      <circle cx={x + 12} cy={y - 1} r="1.4" fill="#E8E2D0" stroke="#1A1A1A" strokeWidth="0.4" />
      {/* Pavillon */}
      <circle cx={x} cy={y + 14} r="3.2" fill="#C8C0A8" stroke="#1A1A1A" strokeWidth="0.8" />
      <circle cx={x} cy={y + 14} r="1.8" fill="#8A8270" />
    </g>
  )
}

// ── BODY ────────────────────────────────────────────────────────
function LabCoat({ pet }: { pet: PetType }) {
  const { x, y } = ANCHORS[pet].body
  return (
    <g>
      <path
        d={`M${x - 18},${y + 2} Q${x - 20},${y + 12} ${x - 14},${y + 13} L${x + 14},${y + 13} Q${x + 20},${y + 12} ${x + 18},${y + 2} L${x + 6},${y - 2} L${x},${y + 3} L${x - 6},${y - 2} Z`}
        fill="#F5F5F0" stroke="#B8B8A8" strokeWidth="0.8"
      />
      <line x1={x} y1={y + 3} x2={x} y2={y + 13} stroke="#B8B8A8" strokeWidth="0.6" />
      <circle cx={x - 0.4} cy={y + 6} r="0.7" fill="#5BB8D4" />
      <circle cx={x - 0.4} cy={y + 10} r="0.7" fill="#5BB8D4" />
      {/* Petite poche */}
      <rect x={x + 6} y={y + 5} width="6" height="4" fill="none" stroke="#B8B8A8" strokeWidth="0.6" />
    </g>
  )
}

function HeroCape({ pet }: { pet: PetType }) {
  const { x, y } = ANCHORS[pet].body
  return (
    <g>
      <path
        d={`M${x - 22},${y - 4} Q${x - 28},${y + 12} ${x - 14},${y + 15} L${x + 14},${y + 15} Q${x + 28},${y + 12} ${x + 22},${y - 4} Q${x},${y - 6} ${x - 22},${y - 4} Z`}
        fill="#B81818" stroke="#5A0808" strokeWidth="0.9"
      />
      <path d={`M${x - 18},${y - 2} Q${x},${y + 12} ${x + 18},${y - 2}`} stroke="#7A0808" strokeWidth="0.6" fill="none" />
      {/* Logo D */}
      <circle cx={x} cy={y + 6} r="3.4" fill="#FFD84A" stroke="#1A1830" strokeWidth="0.6" />
      <text x={x} y={y + 7.8} textAnchor="middle" fontSize="5" fontWeight="900" fill="#1A1830">D</text>
    </g>
  )
}

// ── CHEST ───────────────────────────────────────────────────────
function Medallion({ pet }: { pet: PetType }) {
  const { x, y } = ANCHORS[pet].chest
  return (
    <g>
      <path d={`M${x - 8},${y - 2} Q${x},${y + 1} ${x + 8},${y - 2}`} stroke="#FFD84A" strokeWidth="0.9" fill="none" />
      <circle cx={x} cy={y + 4} r="3.6" fill="#FFD84A" stroke="#8B6914" strokeWidth="0.7" />
      <circle cx={x} cy={y + 4} r="2.2" fill="#E8B820" />
      <text x={x} y={y + 5.8} textAnchor="middle" fontSize="3.6" fontWeight="900" fill="#5A4010">★</text>
    </g>
  )
}

// ── RENDU PAR SLOT ──────────────────────────────────────────────
const RENDERERS: Record<string, (props: { pet: PetType }) => React.ReactElement> = {
  cap: Cap,
  grad_cap: GradCap,
  crown_gold: CrownGold,
  crown_royal: CrownRoyal,
  round_glasses: RoundGlasses,
  sunglasses: Sunglasses,
  collar: Collar,
  bowtie: Bowtie,
  stetho: Stethoscope,
  lab_coat: LabCoat,
  hero_cape: HeroCape,
  medallion: Medallion,
}

// Ordre de rendu : ce qui est en arrière en premier (body sous tout, head au-dessus)
const RENDER_ORDER: AccessorySlot[] = ['body', 'chest', 'neck', 'eyes', 'head']

export default function AccessoryLayer({
  pet,
  equipped,
}: {
  pet: PetType
  equipped: EquippedAccessories
}) {
  return (
    <>
      {RENDER_ORDER.map(slot => {
        const id = equipped[slot]
        if (!id) return null
        const Comp = RENDERERS[id]
        if (!Comp) return null
        return <Comp key={slot} pet={pet} />
      })}
    </>
  )
}
