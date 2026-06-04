'use client'

import { useState } from 'react'
import { A, PALETTE, RADIUS, SHADOW, sp, monoStyle, typeStyle } from '@/lib/theme'

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
      background: PALETTE.surface, borderRadius: RADIUS.lg, overflow: 'hidden',
      border: `1px solid ${PALETTE.rule}`, boxShadow: SHADOW.sm,
    }}>
      <div style={{
        background: PALETTE.brand,
        color: '#fff', padding: `${sp(2)}px ${sp(4)}px`,
        textAlign: 'center',
        ...monoStyle('xs', 'med', '#fff'),
        textTransform: 'uppercase', letterSpacing: 1.4,
      }}>
        Devis
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead style={{ background: PALETTE.surfaceAlt }}>
            <tr>
              <th style={{ ...th(), textAlign: 'left', paddingLeft: sp(4), minWidth: 180 }}>Acte</th>
              {codeEditable && <th style={th()}>Code</th>}
              {visibleNum.map(f => (
                <th key={f.key} style={th()}>{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${PALETTE.ruleSoft}` }}>
                <td style={{ ...td(), padding: `${sp(3)}px ${sp(4)}px`, textAlign: 'left', minWidth: 180 }}>
                  <div style={typeStyle('sm', 'med')}>{r.libelle}</div>
                  {r.code && !codeEditable && (
                    <div style={{ ...monoStyle('xs', 'body', PALETTE.inkDim), marginTop: 3 }}>{r.code}</div>
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
    padding: `${sp(2)}px ${sp(2)}px`,
    ...monoStyle('xs', 'med', PALETTE.inkDim),
    textTransform: 'uppercase', letterSpacing: 1.2, textAlign: 'center',
    borderRight: `1px solid ${PALETTE.ruleSoft}`,
  }
}
function td(): React.CSSProperties {
  return { padding: 0, borderRight: `1px solid ${PALETTE.ruleSoft}`, verticalAlign: 'middle' }
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
  const bg = ok === true  ? PALETTE.greenSoft
           : ok === false ? PALETTE.redSoft
           : PALETTE.surface
  const borderB = ok === true  ? `2px solid ${PALETTE.green}`
                : ok === false ? `2px solid ${PALETTE.red}`
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
          width: '100%', padding: `${sp(2)}px ${sp(2)}px`,
          border: 'none', outline: 'none', background: bg,
          textAlign: 'center',
          ...(isText ? typeStyle('sm', 'med') : monoStyle('sm', 'med')),
          fontVariantNumeric: 'tabular-nums',
          borderBottom: borderB,
        }}
      />
      {showCorrection && ok === false && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '100%',
          padding: `${sp(1)}px ${sp(1)}px`,
          ...monoStyle('xs', 'med', '#7A1F1D'),
          background: PALETTE.redSoft, textAlign: 'center',
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
