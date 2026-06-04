'use client'

import { useState } from 'react'
import { A, PALETTE, RADIUS, SHADOW, sp, monoStyle, typeStyle } from '@/lib/theme'

export type ToothState =
  | 'sain'
  | 'carie'
  | 'racine'
  | 'composite'
  | 'canalaire'
  | 'prothese_conjointe'
  | 'prothese_adjointe'
  | 'amalgame'

export type ToothMap = Record<string, ToothState>

const COLORS: Record<ToothState, { bg: string; label: string; text: string }> = {
  sain:               { bg: '#FFFFFF', label: 'Saine',              text: '#1F2937' },
  carie:              { bg: '#111827', label: 'Carie',              text: '#FFFFFF' },
  racine:             { bg: '#DC2626', label: 'Racine seule',       text: '#FFFFFF' },
  composite:          { bg: '#F97316', label: 'Composite',          text: '#FFFFFF' },
  canalaire:          { bg: '#EC4899', label: 'Trait. canalaire',   text: '#FFFFFF' },
  prothese_conjointe: { bg: '#16A34A', label: 'Prothèse conjointe', text: '#FFFFFF' },
  prothese_adjointe:  { bg: '#FACC15', label: 'Prothèse adjointe',  text: '#1F2937' },
  amalgame:           { bg: '#2563EB', label: 'Amalgame',           text: '#FFFFFF' },
}

const TOOTH_PALETTE: ToothState[] = [
  'sain', 'carie', 'racine', 'composite', 'canalaire',
  'prothese_conjointe', 'prothese_adjointe', 'amalgame',
]

const UPPER = ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28']
const LOWER = ['48','47','46','45','44','43','42','41','31','32','33','34','35','36','37','38']

type ToothType = 'incisive' | 'canine' | 'premolaire' | 'molaire'

function toothType(num: string): ToothType {
  const p = parseInt(num[1], 10)
  if (p === 1 || p === 2) return 'incisive'
  if (p === 3) return 'canine'
  if (p === 4 || p === 5) return 'premolaire'
  return 'molaire'
}

// Largeurs dans le repère SVG (unités virtuelles)
const TOOTH_W: Record<ToothType, number> = {
  incisive: 26, canine: 28, premolaire: 30, molaire: 36,
}
const TOOTH_H = 44
const GAP = 2
const MID_GAP = 10
const PADDING = 4

interface Props {
  expected: ToothMap
  showCorrection: boolean
  onChange?: (state: ToothMap) => void
}

// Calcule la largeur totale d'une arcade
function archWidth(teeth: string[]): number {
  const w = teeth.reduce((sum, t) => sum + TOOTH_W[toothType(t)], 0)
  // gaps : 7 entre les 8 dents de gauche, séparateur médian, 7 entre les 8 dents de droite
  return w + GAP * (teeth.length - 2) + MID_GAP + PADDING * 2
}

const ARCH_W = archWidth(UPPER)        // = ARCH_W de LOWER aussi (symétrique)
const ARCH_H = TOOTH_H + PADDING * 2

interface ArchProps {
  teeth: string[]
  arch: 'upper' | 'lower'
  state: ToothMap
  expected: ToothMap
  showCorrection: boolean
  onPaint: (tooth: string) => void
}

function Arch({ teeth, arch, state, expected, showCorrection, onPaint }: ArchProps) {
  const isUpper = arch === 'upper'
  let cursor = PADDING

  function toothPath(x: number, w: number): string {
    const h = TOOTH_H
    const crownR = 5
    const rootW = w * 0.55
    const rootLeftX  = x + (w - rootW) / 2
    const rootRightX = x + (w + rootW) / 2
    if (isUpper) {
      // racine vers le haut, couronne vers le bas
      return `M ${rootLeftX} ${PADDING}
              L ${rootRightX} ${PADDING}
              L ${rootRightX} ${PADDING + h * 0.45}
              L ${x + w} ${PADDING + h * 0.55}
              L ${x + w} ${PADDING + h - crownR}
              Q ${x + w} ${PADDING + h} ${x + w - crownR} ${PADDING + h}
              L ${x + crownR} ${PADDING + h}
              Q ${x} ${PADDING + h} ${x} ${PADDING + h - crownR}
              L ${x} ${PADDING + h * 0.55}
              L ${rootLeftX} ${PADDING + h * 0.45}
              Z`
    }
    // mandibule : couronne vers le haut, racine vers le bas
    return `M ${x} ${PADDING + crownR}
            Q ${x} ${PADDING} ${x + crownR} ${PADDING}
            L ${x + w - crownR} ${PADDING}
            Q ${x + w} ${PADDING} ${x + w} ${PADDING + crownR}
            L ${x + w} ${PADDING + h * 0.45}
            L ${rootRightX} ${PADDING + h * 0.55}
            L ${rootRightX} ${PADDING + h}
            L ${rootLeftX} ${PADDING + h}
            L ${rootLeftX} ${PADDING + h * 0.55}
            L ${x} ${PADDING + h * 0.45}
            Z`
  }

  return (
    <svg
      viewBox={`0 0 ${ARCH_W} ${ARCH_H}`}
      width="100%"
      style={{ display: 'block', height: 'auto', maxWidth: '100%' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {teeth.map((t, i) => {
        const w = TOOTH_W[toothType(t)]
        const x = cursor
        cursor += w + GAP
        // Séparateur après la 8e dent
        if (i === 7) cursor += MID_GAP - GAP

        const user = state[t] ?? 'sain'
        const exp = expected[t] ?? 'sain'
        const c = COLORS[user]
        const ok = !showCorrection ? null : (user === exp)
        const stroke = ok === true ? '#16A34A' : ok === false ? '#EF4444' : '#9CA3AF'
        const strokeW = ok === null ? 1.2 : 2

        const numberY = isUpper ? PADDING + TOOTH_H - 6 : PADDING + 12
        const labelColor = user === 'sain' ? '#6B7280' : c.text

        return (
          <g key={t} style={{ cursor: showCorrection ? 'default' : 'pointer' }}>
            <path
              d={toothPath(x, w)}
              fill={c.bg}
              stroke={stroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
            <text
              x={x + w / 2}
              y={numberY}
              textAnchor="middle"
              fontSize={8}
              fontWeight={800}
              fill={labelColor}
              fontFamily={A.font}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {t}
            </text>
            {ok === false && (
              <circle
                cx={x + w - 4}
                cy={isUpper ? PADDING + 8 : PADDING + TOOTH_H - 8}
                r={5}
                fill="#EF4444"
                stroke="#fff"
                strokeWidth={1.5}
                style={{ pointerEvents: 'none' }}
              />
            )}
            {/* Hit target invisible qui couvre toute la zone de la dent (clic fiable mobile + desktop) */}
            <rect
              x={x - 1}
              y={PADDING - 1}
              width={w + 2}
              height={TOOTH_H + 2}
              fill="transparent"
              onClick={() => onPaint(t)}
              onTouchEnd={(e) => { e.preventDefault(); onPaint(t) }}
              style={{ cursor: showCorrection ? 'default' : 'pointer' }}
            />
          </g>
        )
      })}
      {/* Axe médian pointillé */}
      <line
        x1={ARCH_W / 2}
        y1={PADDING}
        x2={ARCH_W / 2}
        y2={PADDING + TOOTH_H}
        stroke="#94A3B8"
        strokeWidth={1.2}
        strokeDasharray="3 3"
      />
    </svg>
  )
}

export default function SchemaDentaire({ expected, showCorrection, onChange }: Props) {
  const [state, setState] = useState<ToothMap>({})
  const [brush, setBrush] = useState<ToothState>('carie')

  function paint(tooth: string) {
    if (showCorrection) return
    const next = { ...state }
    if (brush === 'sain') delete next[tooth]
    else next[tooth] = brush
    setState(next)
    onChange?.(next)
  }

  return (
    <div style={{
      background: PALETTE.surface, borderRadius: RADIUS.lg, padding: sp(4),
      border: `1px solid ${PALETTE.rule}`, boxShadow: SHADOW.sm,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp(3),
      }}>
        <div style={{
          ...monoStyle('xs', 'med', PALETTE.inkDim),
          textTransform: 'uppercase', letterSpacing: 1.4,
        }}>
          Schéma dentaire
        </div>
        <div style={monoStyle('xs', 'body', PALETTE.inkDim)}>
          patient face à toi
        </div>
      </div>

      {/* Palette */}
      {!showCorrection && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: sp(4),
          padding: `${sp(2)}px ${sp(3)}px`, background: PALETTE.surfaceAlt, borderRadius: RADIUS.md,
          border: `1px solid ${PALETTE.ruleSoft}`,
        }}>
          {TOOTH_PALETTE.map(s => {
            const c = COLORS[s]
            const active = brush === s
            return (
              <button
                key={s}
                onClick={() => setBrush(s)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: active ? c.bg : '#fff',
                  border: active ? `2px solid ${A.primary}` : `1px solid ${A.border}`,
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11, fontWeight: 700,
                  color: active ? c.text : A.text,
                  fontFamily: A.font, cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: c.bg, border: `1px solid ${A.border}`,
                }} />
                {c.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Maxillaire */}
      <div style={{
        ...monoStyle('xs', 'med', PALETTE.inkDim),
        textAlign: 'center', letterSpacing: 1.4, marginBottom: 2,
        textTransform: 'uppercase',
      }}>
        Maxillaire
      </div>
      <Arch teeth={UPPER} arch="upper" state={state} expected={expected} showCorrection={showCorrection} onPaint={paint} />

      <div style={{ margin: `${sp(2)}px 0`, height: 1, background: PALETTE.ruleSoft }} />

      {/* Mandibule */}
      <Arch teeth={LOWER} arch="lower" state={state} expected={expected} showCorrection={showCorrection} onPaint={paint} />
      <div style={{
        ...monoStyle('xs', 'med', PALETTE.inkDim),
        textAlign: 'center', letterSpacing: 1.4, marginTop: 2,
        textTransform: 'uppercase',
      }}>
        Mandibule
      </div>

      {!showCorrection && (
        <div style={{
          ...typeStyle('xs', 'body', PALETTE.inkMute),
          marginTop: sp(3), textAlign: 'center',
          padding: `${sp(2)}px ${sp(3)}px`,
          background: PALETTE.brandSoft, borderRadius: RADIUS.sm,
        }}>
          1. Sélectionne une <strong>couleur</strong> → 2. tape les <strong>dents</strong> concernées.
        </div>
      )}
    </div>
  )
}

export function scoreSchema(user: ToothMap, expected: ToothMap): { cellsCorrect: number; cellsTotal: number } {
  let correct = 0
  let total = 0
  for (const [tooth, exp] of Object.entries(expected)) {
    if (exp === 'sain') continue
    total++
    if ((user[tooth] ?? 'sain') === exp) correct++
  }
  return { cellsCorrect: correct, cellsTotal: total }
}
