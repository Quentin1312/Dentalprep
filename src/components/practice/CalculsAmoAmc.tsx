'use client'

import { useState } from 'react'
import { A } from '@/lib/theme'

export type CalculsExpected = {
  montant_total?: number
  amo?: number      // montant remboursé AMO (€)
  amc?: number      // montant remboursé AMC (€)
  rac?: number      // reste à charge (€)
}

export type CalculsAnswers = {
  montant_total?: number | null
  amo?: number | null
  amc?: number | null
  rac?: number | null
}

interface Props {
  expected: CalculsExpected
  showCorrection: boolean
  onChange?: (a: CalculsAnswers) => void
}

const FIELDS: { key: keyof CalculsExpected; label: string; sub: string }[] = [
  { key: 'montant_total', label: 'Montant total',     sub: '€' },
  { key: 'amo',           label: 'Remboursement AMO', sub: '€' },
  { key: 'amc',           label: 'Remboursement AMC', sub: '€' },
  { key: 'rac',           label: 'Reste à charge',    sub: '€' },
]

function parse(v: string): number | null {
  if (!v.trim()) return null
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) ? null : n
}

function near(a: number | null | undefined, b: number | undefined, tol = 0.05): boolean {
  if (a === null || a === undefined || b === undefined) return false
  return Math.abs(a - b) <= tol
}

export default function CalculsAmoAmc({ expected, showCorrection, onChange }: Props) {
  const [vals, setVals] = useState<CalculsAnswers>({})

  function update(key: keyof CalculsExpected, raw: string) {
    const next = { ...vals, [key]: parse(raw) }
    setVals(next)
    onChange?.(next)
  }

  const usedFields = FIELDS.filter(f => expected[f.key] !== undefined)

  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 14,
      border: `1px solid ${A.border}`, fontFamily: A.font,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: A.textMuted,
        letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10,
      }}>
        Calculs AMO / AMC
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {usedFields.map(f => {
          const user = vals[f.key]
          const exp = expected[f.key]
          const ok = showCorrection ? near(user, exp) : null
          const borderC = ok === true  ? '#16A34A'
                        : ok === false ? '#EF4444'
                        : A.border
          const bg     = ok === true  ? '#E7F8EE'
                       : ok === false ? '#FDECEC'
                       : '#fff'
          return (
            <div key={f.key}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, color: A.textMuted,
                textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4,
              }}>
                {f.label}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text" inputMode="decimal"
                  value={user === null || user === undefined ? '' : String(user)}
                  onChange={e => update(f.key, e.target.value)}
                  disabled={showCorrection}
                  style={{
                    width: '100%', padding: '10px 30px 10px 12px',
                    border: `2px solid ${borderC}`, borderRadius: 10,
                    fontSize: 14, fontFamily: A.font, color: A.text,
                    background: bg, outline: 'none', fontWeight: 700,
                  }}
                />
                <span style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 12, color: A.textMuted, fontWeight: 700,
                }}>{f.sub}</span>
              </div>
              {showCorrection && ok === false && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#B91C1C', fontWeight: 700 }}>
                  → {exp?.toFixed(2)} €
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function scoreCalculs(user: CalculsAnswers, expected: CalculsExpected): { cellsCorrect: number; cellsTotal: number } {
  let correct = 0, total = 0
  for (const f of FIELDS) {
    if (expected[f.key] !== undefined) {
      total++
      if (near(user[f.key], expected[f.key])) correct++
    }
  }
  return { cellsCorrect: correct, cellsTotal: total }
}
