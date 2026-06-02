'use client'

import { useState } from 'react'
import { A } from '@/lib/theme'

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

const PALETTE: ToothState[] = [
  'sain', 'carie', 'racine', 'composite', 'canalaire',
  'prothese_conjointe', 'prothese_adjointe', 'amalgame',
]

// Quadrant 1 (haut-droite vu du patient → gauche à l'écran) : 18→11
// Quadrant 2 (haut-gauche du patient → droite à l'écran) : 21→28
// Quadrant 4 : 48→41   Quadrant 3 : 31→38
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

const SIZE: Record<ToothType, { w: number; h: number }> = {
  incisive:   { w: 26, h: 44 },
  canine:     { w: 28, h: 50 },
  premolaire: { w: 30, h: 44 },
  molaire:    { w: 36, h: 44 },
}

interface Props {
  expected: ToothMap
  showCorrection: boolean
  onChange?: (state: ToothMap) => void
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

  function renderTooth(tooth: string, arch: 'upper' | 'lower') {
    const tt = toothType(tooth)
    const { w, h } = SIZE[tt]
    const user = state[tooth] ?? 'sain'
    const exp = expected[tooth] ?? 'sain'
    const c = COLORS[user]
    const ok = !showCorrection ? null : (user === exp)

    // Forme : couronne arrondie + racine
    // SVG path différent selon arch (haut: couronne en bas, racine vers haut)
    const isUpper = arch === 'upper'
    const crownR = 6
    const rootW = w * 0.55

    // Couronne (en bas si upper, en haut si lower)
    // Path conceptuel : forme de dent avec racine

    const path = isUpper
      // dent du haut : racine en haut, couronne en bas
      ? `M ${(w - rootW) / 2} 0
         L ${(w + rootW) / 2} 0
         L ${(w + rootW) / 2} ${h * 0.45}
         L ${w} ${h * 0.55}
         L ${w} ${h - crownR}
         Q ${w} ${h} ${w - crownR} ${h}
         L ${crownR} ${h}
         Q 0 ${h} 0 ${h - crownR}
         L 0 ${h * 0.55}
         L ${(w - rootW) / 2} ${h * 0.45}
         Z`
      // dent du bas : couronne en haut, racine en bas
      : `M 0 ${crownR}
         Q 0 0 ${crownR} 0
         L ${w - crownR} 0
         Q ${w} 0 ${w} ${crownR}
         L ${w} ${h * 0.45}
         L ${(w + rootW) / 2} ${h * 0.55}
         L ${(w + rootW) / 2} ${h}
         L ${(w - rootW) / 2} ${h}
         L ${(w - rootW) / 2} ${h * 0.55}
         L 0 ${h * 0.45}
         Z`

    const stroke = ok === true ? '#16A34A' : ok === false ? '#EF4444' : '#9CA3AF'
    const strokeW = ok === null ? 1.5 : 2.5

    const numberY = isUpper ? h - h * 0.7 + 12 : h * 0.7 - 4
    const labelColor = user === 'sain' ? '#6B7280' : c.text

    return (
      <button
        key={tooth}
        onClick={() => paint(tooth)}
        disabled={showCorrection}
        style={{
          width: w, height: h, padding: 0,
          background: 'transparent', border: 'none',
          cursor: showCorrection ? 'default' : 'pointer',
          position: 'relative',
        }}
        title={ok === false ? `Attendu : ${COLORS[exp].label}` : COLORS[user].label}
      >
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <path d={path} fill={c.bg} stroke={stroke} strokeWidth={strokeW} strokeLinejoin="round" />
          <text
            x={w / 2}
            y={numberY}
            textAnchor="middle"
            fontSize={9}
            fontWeight={800}
            fill={labelColor}
            fontFamily={A.font}
          >
            {tooth}
          </text>
        </svg>
        {ok === false && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 14, height: 14, borderRadius: '50%',
            background: '#EF4444', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 900,
            border: '2px solid #fff',
          }}>!</div>
        )}
      </button>
    )
  }

  // Affiche l'arcade avec un séparateur visuel au milieu (entre quadrants 1-2 ou 4-3)
  function renderArch(teeth: string[], arch: 'upper' | 'lower') {
    return (
      <div style={{
        display: 'flex', alignItems: arch === 'upper' ? 'flex-end' : 'flex-start',
        justifyContent: 'center', gap: 2, padding: '4px 0',
      }}>
        {teeth.slice(0, 8).map(t => renderTooth(t, arch))}
        {/* Séparateur central (axe médian) */}
        <div style={{
          width: 2, height: 56,
          background: 'repeating-linear-gradient(180deg, #94A3B8 0 4px, transparent 4px 8px)',
          margin: '0 4px',
          alignSelf: 'center',
        }} />
        {teeth.slice(8).map(t => renderTooth(t, arch))}
      </div>
    )
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 14,
      border: `1px solid ${A.border}`, fontFamily: A.font,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: A.textMuted,
          letterSpacing: 1.4, textTransform: 'uppercase',
        }}>
          Schéma dentaire
        </div>
        <div style={{ fontSize: 10, color: A.textMuted }}>
          patient face à toi → droite ↔ gauche inversées
        </div>
      </div>

      {/* Palette */}
      {!showCorrection && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14,
          padding: '8px 10px', background: '#F7F9FC', borderRadius: 10,
          border: `1px solid ${A.border}`,
        }}>
          {PALETTE.map(s => {
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

      {/* Maxillaire (arcade supérieure) */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: A.textMuted,
          textAlign: 'center', letterSpacing: 1.2, marginBottom: 2,
        }}>
          MAXILLAIRE (haut)
        </div>
        {renderArch(UPPER, 'upper')}
      </div>

      {/* Trait de séparation arcades */}
      <div style={{
        margin: '8px 0', height: 1, background: A.border,
      }} />

      {/* Mandibule (arcade inférieure) */}
      <div style={{ overflowX: 'auto', paddingTop: 4 }}>
        {renderArch(LOWER, 'lower')}
        <div style={{
          fontSize: 9, fontWeight: 700, color: A.textMuted,
          textAlign: 'center', letterSpacing: 1.2, marginTop: 2,
        }}>
          MANDIBULE (bas)
        </div>
      </div>

      {!showCorrection && (
        <div style={{
          fontSize: 11, color: A.textMuted, marginTop: 12, textAlign: 'center',
          padding: '8px 10px', background: '#EEF4FF', borderRadius: 8,
        }}>
          1. Sélectionne une <strong>couleur</strong> dans la palette → 2. tap les <strong>dents</strong> concernées.
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
