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

// Numérotation FDI : quadrant 1 (haut droite) → 18..11, quadrant 2 (haut gauche) → 21..28
// quadrant 4 (bas droite) → 48..41, quadrant 3 (bas gauche) → 31..38
const UPPER = ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28']
const LOWER = ['48','47','46','45','44','43','42','41','31','32','33','34','35','36','37','38']

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

  function statusColor(tooth: string): { bg: string; outline: string } {
    const user = state[tooth] ?? 'sain'
    const exp  = expected[tooth] ?? 'sain'
    const bg = COLORS[user].bg
    if (!showCorrection) return { bg, outline: A.border }
    const ok = user === exp
    return { bg, outline: ok ? '#16A34A' : '#EF4444' }
  }

  function renderTooth(tooth: string) {
    const { bg, outline } = statusColor(tooth)
    const user = state[tooth] ?? 'sain'
    const exp = expected[tooth] ?? 'sain'
    const wrong = showCorrection && user !== exp
    return (
      <button
        key={tooth}
        onClick={() => paint(tooth)}
        disabled={showCorrection}
        style={{
          width: 30, height: 38,
          background: bg,
          border: `2px solid ${outline}`,
          borderRadius: 6,
          fontFamily: A.font, fontSize: 9, fontWeight: 800,
          color: COLORS[user].text,
          cursor: showCorrection ? 'default' : 'pointer',
          padding: 0,
          position: 'relative',
        }}
        title={wrong ? `Attendu : ${COLORS[exp].label}` : COLORS[user].label}
      >
        {tooth}
        {wrong && (
          <div style={{
            position: 'absolute', top: -6, right: -6,
            width: 14, height: 14, borderRadius: '50%',
            background: '#EF4444', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 900,
          }}>
            !
          </div>
        )}
      </button>
    )
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 14,
      border: `1px solid ${A.border}`,
      fontFamily: A.font,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: A.textMuted,
        letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10,
      }}>
        Schéma dentaire
      </div>

      {/* Palette */}
      {!showCorrection && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12,
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
                  background: active ? c.bg : '#F4F6FA',
                  border: active ? `2px solid ${A.primary}` : `1px solid ${A.border}`,
                  borderRadius: 999,
                  padding: '4px 10px',
                  fontSize: 11, fontWeight: 700,
                  color: active ? c.text : A.text,
                  fontFamily: A.font, cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: c.bg, border: `1px solid ${A.border}`,
                }} />
                {c.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Arcade supérieure */}
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
        {UPPER.map(renderTooth)}
      </div>
      <div style={{
        textAlign: 'center', fontSize: 9, fontWeight: 700, color: A.textMuted,
        margin: '6px 0', letterSpacing: 1.2,
      }}>
        ──  M A X I L L A I R E  ──
      </div>
      {/* Arcade inférieure */}
      <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}>
        {LOWER.map(renderTooth)}
      </div>
      <div style={{
        textAlign: 'center', fontSize: 9, fontWeight: 700, color: A.textMuted,
        marginTop: 6, letterSpacing: 1.2,
      }}>
        ──  M A N D I B U L E  ──
      </div>

      {!showCorrection && (
        <div style={{ fontSize: 10, color: A.textMuted, marginTop: 10, textAlign: 'center' }}>
          Touche une couleur puis tap les dents concernées.
        </div>
      )}
    </div>
  )
}

export function scoreSchema(user: ToothMap, expected: ToothMap): { cellsCorrect: number; cellsTotal: number } {
  let correct = 0
  let total = 0
  // Compter uniquement les dents avec un état attendu (sain pas compté)
  for (const [tooth, exp] of Object.entries(expected)) {
    if (exp === 'sain') continue
    total++
    if ((user[tooth] ?? 'sain') === exp) correct++
  }
  return { cellsCorrect: correct, cellsTotal: total }
}
