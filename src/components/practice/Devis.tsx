'use client'

import { useState } from 'react'
import { A } from '@/lib/theme'

// Une ligne de devis : libellé pré-rempli, l'élève saisit les montants
export type DevisRowExpected = {
  libelle: string             // pré-rempli (énoncé)
  code?: string | null        // pré-rempli ou à compléter
  honoraires?: number | null  // ce que l'élève doit saisir
  base_remb?: number | null
  amo?: number | null         // remboursé AMO
  amc?: number | null         // remboursé AMC
  rac?: number | null         // reste à charge
}

export type DevisRowAnswer = {
  code?: string | null
  honoraires?: number | null
  base_remb?: number | null
  amo?: number | null
  amc?: number | null
  rac?: number | null
}

interface Props {
  rows: DevisRowExpected[]
  showCorrection: boolean
  onChange?: (rows: DevisRowAnswer[]) => void
}

type NumKey = 'honoraires' | 'base_remb' | 'amo' | 'amc' | 'rac'

const NUM_FIELDS: { key: NumKey; label: string }[] = [
  { key: 'honoraires', label: 'Honoraires' },
  { key: 'base_remb',  label: 'Base remb.' },
  { key: 'amo',        label: 'AMO' },
  { key: 'amc',        label: 'AMC' },
  { key: 'rac',        label: 'RAC' },
]

function parse(v: string): number | null {
  if (!v.trim()) return null
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) ? null : n
}

function near(a: number | null | undefined, b: number | null | undefined, tol = 0.05): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return false
  return Math.abs(a - b) <= tol
}

export default function Devis({ rows, showCorrection, onChange }: Props) {
  const [answers, setAnswers] = useState<DevisRowAnswer[]>(() => rows.map(() => ({})))

  function update(i: number, key: keyof DevisRowAnswer, raw: string) {
    const next = answers.map((r, idx) => {
      if (idx !== i) return r
      if (key === 'code') return { ...r, code: raw || null }
      return { ...r, [key]: parse(raw) }
    })
    setAnswers(next)
    onChange?.(next)
  }

  // On affiche uniquement les colonnes utilisées au moins une fois dans expected
  const visibleNum = NUM_FIELDS.filter(f => rows.some(r => r[f.key] !== null && r[f.key] !== undefined))
  const codeEditable = rows.some(r => r.code === undefined || r.code === null)

  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${A.border}`, fontFamily: A.font,
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1F2D3D 0%, #0F1B2D 100%)',
        color: '#fff', padding: '10px 14px',
        fontSize: 13, fontWeight: 800, letterSpacing: 0.3, textAlign: 'center',
      }}>
        DEVIS
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead style={{ background: '#F4F6FA' }}>
            <tr>
              <th style={{ ...th(), textAlign: 'left', paddingLeft: 14, minWidth: 180 }}>Acte</th>
              {codeEditable && <th style={th()}>Code</th>}
              {visibleNum.map(f => (
                <th key={f.key} style={th()}>{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${A.border}` }}>
                <td style={{ ...td(), padding: '10px 14px', textAlign: 'left', minWidth: 180 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: A.text, lineHeight: 1.3 }}>{r.libelle}</div>
                  {r.code && !codeEditable && (
                    <div style={{ fontSize: 10, color: A.textMuted, fontFamily: 'monospace', marginTop: 3 }}>{r.code}</div>
                  )}
                </td>
                {codeEditable && (
                  <td style={td()}>
                    <Cell
                      value={answers[i]?.code ?? ''}
                      expected={r.code}
                      isText
                      showCorrection={showCorrection}
                      onChange={v => update(i, 'code', v)}
                    />
                  </td>
                )}
                {visibleNum.map(f => (
                  <td key={f.key} style={td()}>
                    <Cell
                      value={answers[i]?.[f.key] ?? null}
                      expected={r[f.key]}
                      showCorrection={showCorrection}
                      onChange={v => update(i, f.key, v)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function th(): React.CSSProperties {
  return {
    padding: '8px 6px', fontSize: 10, fontWeight: 700, color: A.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center',
    borderRight: `1px solid ${A.border}`,
  }
}
function td(): React.CSSProperties {
  return { padding: 0, borderRight: `1px solid ${A.border}`, verticalAlign: 'middle' }
}

function Cell({ value, expected, isText, showCorrection, onChange }: {
  value: any
  expected: any
  isText?: boolean
  showCorrection: boolean
  onChange: (v: string) => void
}) {
  const empty = value === null || value === undefined || value === ''
  const ok = !showCorrection
    ? null
    : isText
      ? String(value ?? '').trim().toUpperCase() === String(expected ?? '').trim().toUpperCase()
      : near(typeof value === 'number' ? value : null, expected)
  const bg = ok === true  ? '#E7F8EE'
           : ok === false ? '#FDECEC'
           : '#fff'
  const borderB = ok === true  ? '2px solid #16A34A'
                : ok === false ? '2px solid #EF4444'
                : 'none'
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        inputMode={isText ? 'text' : 'decimal'}
        value={empty ? '' : String(value)}
        onChange={e => onChange(e.target.value)}
        disabled={showCorrection}
        style={{
          width: '100%', padding: '8px 6px',
          border: 'none', outline: 'none', background: bg,
          textAlign: 'center',
          fontSize: 12, fontFamily: A.font, color: A.text,
          borderBottom: borderB,
        }}
      />
      {showCorrection && ok === false && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '100%',
          padding: '4px 4px', fontSize: 10, color: '#B91C1C',
          background: '#FEE2E2', fontWeight: 700, textAlign: 'center',
        }}>
          {isText ? expected : (typeof expected === 'number' ? expected.toFixed(2) : '')}
        </div>
      )}
    </div>
  )
}

export function scoreDevis(user: DevisRowAnswer[], expected: DevisRowExpected[]): { cellsCorrect: number; cellsTotal: number } {
  let correct = 0, total = 0
  for (let i = 0; i < expected.length; i++) {
    const e = expected[i], u = user[i] || {}
    // code (si attendu)
    if (e.code) {
      total++
      if (String(u.code ?? '').trim().toUpperCase() === e.code.toUpperCase()) correct++
    }
    for (const f of NUM_FIELDS) {
      const ev = e[f.key]
      if (ev !== null && ev !== undefined) {
        total++
        if (near(u[f.key], ev)) correct++
      }
    }
  }
  return { cellsCorrect: correct, cellsTotal: total }
}
