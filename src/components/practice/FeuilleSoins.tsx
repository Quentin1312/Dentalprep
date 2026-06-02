'use client'

import { useState } from 'react'
import { A } from '@/lib/theme'

export type FsRow = {
  date?: string | null              // JJ/MM/AAAA
  code_ccam?: string | null         // ex: HBQK002
  ccs_vvs?: string | null           // C / CS / V / VS
  autres?: string | null            // modificateurs / associations
  montant?: number | null
  depassement?: number | null
  frais_id_md?: string | null       // 'ID' / 'MD'
  frais_nbre?: number | null
  frais_montant?: number | null
  localisation?: string | null      // numéro de dent : 11, 16, etc.
}

type CellStatus = 'empty' | 'correct' | 'wrong'

interface Props {
  expected: FsRow[]
  showCorrection: boolean       // après "Valider"
  onChange?: (rows: FsRow[]) => void
  onValidate?: (result: { cellsCorrect: number; cellsTotal: number; score: number; rows: FsRow[] }) => void
}

const ALL_FIELDS: { key: keyof FsRow; label: string; width: number; type: 'text' | 'number' }[] = [
  { key: 'date',          label: 'Date',        width: 90,  type: 'text'   },
  { key: 'code_ccam',     label: 'Code',        width: 90,  type: 'text'   },
  { key: 'ccs_vvs',       label: 'C/CS/V/VS',   width: 70,  type: 'text'   },
  { key: 'autres',        label: 'Modif./asso.', width: 110, type: 'text'   },
  { key: 'montant',       label: 'Honoraires',  width: 90,  type: 'number' },
  { key: 'depassement',   label: 'Dépass.',     width: 70,  type: 'number' },
  { key: 'frais_id_md',   label: 'ID/MD',       width: 60,  type: 'text'   },
  { key: 'frais_nbre',    label: 'Nbre km',     width: 70,  type: 'number' },
  { key: 'frais_montant', label: '€ km',        width: 70,  type: 'number' },
  { key: 'localisation',  label: 'Localis.',    width: 70,  type: 'text'   },
]

// On garde une colonne uniquement si au moins une ligne attendue a une valeur sur cette colonne.
function visibleFields(expected: FsRow[]) {
  return ALL_FIELDS.filter(f =>
    expected.some(r => {
      const v = r?.[f.key]
      return v !== null && v !== undefined && v !== ''
    })
  )
}

function norm(v: any): string {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'number') return v.toString()
  return String(v).trim().toUpperCase().replace(/\s+/g, '')
}

function cellOK(user: any, expected: any): boolean {
  if (expected === null || expected === undefined || expected === '') return user === null || user === undefined || user === ''
  return norm(user) === norm(expected)
}

export default function FeuilleSoins({ expected, showCorrection, onChange, onValidate }: Props) {
  const [rows, setRows] = useState<FsRow[]>(() => expected.map(() => ({})))
  const FIELDS = visibleFields(expected)

  function updateCell(rowIdx: number, key: keyof FsRow, value: string) {
    const next = rows.map((r, i) => {
      if (i !== rowIdx) return r
      const v: any = value === '' ? null : value
      return { ...r, [key]: v }
    })
    setRows(next)
    onChange?.(next)
  }

  function getStatus(rowIdx: number, key: keyof FsRow): CellStatus {
    if (!showCorrection) return 'empty'
    const u = rows[rowIdx]?.[key]
    const e = expected[rowIdx]?.[key]
    return cellOK(u, e) ? 'correct' : 'wrong'
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      border: `1px solid ${A.border}`,
      overflow: 'hidden',
      fontFamily: A.font,
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1F2D3D 0%, #0F1B2D 100%)',
        color: '#fff',
        padding: '10px 14px',
        fontSize: 13, fontWeight: 800, letterSpacing: 0.3, textAlign: 'center',
      }}>
        ACTES EFFECTUÉS
      </div>

      {/* Header columns */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${A.border}`, background: '#F4F6FA' }}>
        {FIELDS.map(f => (
          <div key={f.key} style={{
            width: f.width, minWidth: f.width,
            padding: '8px 6px',
            fontSize: 10, fontWeight: 700, color: A.textMuted,
            textAlign: 'center', borderRight: `1px solid ${A.border}`,
            textTransform: 'uppercase', letterSpacing: 0.3,
          }}>
            {f.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ overflowX: 'auto' }}>
        {expected.map((_, rowIdx) => (
          <div key={rowIdx} style={{
            display: 'flex',
            borderBottom: rowIdx < expected.length - 1 ? `1px solid ${A.border}` : 'none',
          }}>
            {FIELDS.map(f => {
              const status = getStatus(rowIdx, f.key)
              const value = rows[rowIdx]?.[f.key]
              const displayValue = value === null || value === undefined ? '' : String(value)
              const bg = status === 'correct' ? '#E7F8EE'
                       : status === 'wrong'   ? '#FDECEC'
                       : '#fff'
              const borderC = status === 'correct' ? '#22C55E'
                            : status === 'wrong'   ? '#EF4444'
                            : A.border
              return (
                <div key={f.key} style={{
                  width: f.width, minWidth: f.width,
                  borderRight: `1px solid ${A.border}`,
                  position: 'relative',
                }}>
                  <input
                    type={f.type === 'number' ? 'text' : 'text'}
                    inputMode={f.type === 'number' ? 'decimal' : 'text'}
                    value={displayValue}
                    onChange={e => updateCell(rowIdx, f.key, e.target.value)}
                    disabled={showCorrection}
                    style={{
                      width: '100%', height: 38,
                      border: 'none', outline: 'none',
                      padding: '0 8px',
                      fontSize: 13, fontFamily: A.font, color: A.text,
                      background: bg,
                      borderBottom: status !== 'empty' ? `2px solid ${borderC}` : 'none',
                      textAlign: 'center',
                    }}
                  />
                  {showCorrection && status === 'wrong' && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0, top: '100%',
                      padding: '4px 6px', fontSize: 10, color: '#B91C1C',
                      background: '#FEE2E2', fontWeight: 700, textAlign: 'center',
                    }}>
                      → {norm(expected[rowIdx]?.[f.key]) || '∅'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function scoreFeuille(user: FsRow[], expected: FsRow[]): { cellsCorrect: number; cellsTotal: number; score: number } {
  let correct = 0
  let total = 0
  for (let i = 0; i < expected.length; i++) {
    for (const f of ALL_FIELDS) {
      const e = expected[i]?.[f.key]
      // Only count cells that have an expected value (not null/empty in the answer key)
      if (e !== null && e !== undefined && e !== '') {
        total++
        if (cellOK(user[i]?.[f.key], e)) correct++
      }
    }
  }
  return { cellsCorrect: correct, cellsTotal: total, score: total > 0 ? correct / total : 0 }
}
