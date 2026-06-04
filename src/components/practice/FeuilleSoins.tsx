'use client'

import { useState } from 'react'
import { A, PALETTE, RADIUS, SHADOW, FONT_MONO, sp, monoStyle, typeStyle } from '@/lib/theme'

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

const ALL_FIELDS: { key: keyof FsRow; label: string; help: string; width: number; type: 'text' | 'number' }[] = [
  { key: 'date',          label: 'Date',         help: 'Date de réalisation de l\'acte (jj/mm/aaaa)',                                       width: 90,  type: 'text'   },
  { key: 'code_ccam',     label: 'Code',         help: 'Code CCAM (4 lettres + 3 chiffres) ou NGAP (C, CS, BR4, BDC...)',                  width: 90,  type: 'text'   },
  { key: 'ccs_vvs',       label: 'C/CS/V/VS',    help: 'Consultation / Consult. Spécialisée / Visite / Visite Spécialisée (codes NGAP)', width: 70,  type: 'text'   },
  { key: 'autres',        label: 'Modif./asso.', help: 'Modificateurs (N, E, U, F, MCD) et codes d\'association (1, 2, 4)',                width: 110, type: 'text'   },
  { key: 'montant',       label: 'Honoraires',   help: 'Montant des honoraires facturés (€)',                                              width: 90,  type: 'number' },
  { key: 'depassement',   label: 'Dépass.',      help: 'Dépassement d\'honoraires en € (laisser vide si pas de dépassement)',              width: 70,  type: 'number' },
  { key: 'frais_id_md',   label: 'ID/MD',        help: 'Indemnité de Déplacement (ID) ou Mémoire de Déplacement (MD)',                     width: 60,  type: 'text'   },
  { key: 'frais_nbre',    label: 'Nbre km',      help: 'Nombre de kilomètres parcourus',                                                   width: 70,  type: 'number' },
  { key: 'frais_montant', label: '€ km',         help: 'Indemnité kilométrique (€)',                                                       width: 70,  type: 'number' },
  { key: 'localisation',  label: 'Localis.',     help: 'Numéro de la dent concernée (notation FDI : 11-48)',                               width: 70,  type: 'text'   },
]

// On garde une colonne uniquement si au moins une ligne attendue a une valeur "utile".
// Les zéros numériques sont traités comme "pas de valeur" (sinon depassement: 0 forcerait la colonne).
function isEmpty(v: any): boolean {
  if (v === null || v === undefined || v === '') return true
  if (typeof v === 'number' && v === 0) return true
  return false
}

function visibleFields(expected: FsRow[]) {
  return ALL_FIELDS.filter(f =>
    expected.some(r => !isEmpty(r?.[f.key]))
  )
}

function norm(v: any): string {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'number') return v.toString()
  return String(v).trim().toUpperCase().replace(/\s+/g, '')
}

// Un code CCAM "complet" fait 4 lettres + 3 chiffres (ex: HBQK002).
// Les chiffres étant un identifiant arbitraire impossible à déduire de
// l'énoncé, on ne valide QUE les 4 lettres pour ces codes.
// Les codes courts NGAP (BR4, BDC, BR2, BRP, BDX, C, CS, ...) restent en
// comparaison exacte.
function isFullCcam(code: string): boolean {
  return /^[A-Z]{4}\d{3}$/.test(code.toUpperCase().replace(/\s+/g, ''))
}

function cellOK(user: any, expected: any, key?: keyof FsRow): boolean {
  if (isEmpty(expected)) return isEmpty(user)
  const u = norm(user), e = norm(expected)
  if (key === 'code_ccam' && isFullCcam(e)) {
    // Compare seulement les 4 premières lettres (la "grammaire" CCAM).
    return u.slice(0, 4) === e.slice(0, 4)
  }
  return u === e
}

export default function FeuilleSoins({ expected, showCorrection, onChange, onValidate }: Props) {
  const [rows, setRows] = useState<FsRow[]>(() => expected.map(() => ({})))
  const [legendOpen, setLegendOpen] = useState(false)
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
    return cellOK(u, e, key) ? 'correct' : 'wrong'
  }

  return (
    <div style={{
      background: PALETTE.surface,
      borderRadius: RADIUS.lg,
      border: `1px solid ${PALETTE.rule}`,
      overflow: 'hidden',
      boxShadow: SHADOW.sm,
    }}>
      <div style={{
        background: PALETTE.brand,
        color: '#fff',
        padding: `${sp(2)}px ${sp(4)}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          ...monoStyle('xs', 'med', '#fff'),
          textTransform: 'uppercase', letterSpacing: 1.4,
        }}>
          Feuille de soins
        </span>
        <button
          onClick={() => setLegendOpen(true)}
          style={{
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.22)',
            color: '#fff',
            padding: '4px 10px', borderRadius: RADIUS.pill,
            cursor: 'pointer',
            ...monoStyle('xs', 'med', '#fff'),
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          <span style={{
            width: 13, height: 13, borderRadius: '50%',
            background: 'rgba(255,255,255,0.28)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700,
          }}>?</span>
          Légende
        </button>
      </div>

      {legendOpen && (
        <div
          onClick={() => setLegendOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 60, display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxHeight: '80vh', overflowY: 'auto',
              background: PALETTE.surface,
              borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
              padding: `${sp(3)}px ${sp(4)}px ${sp(8)}px`,
              boxShadow: '0 -10px 30px rgba(10,22,20,0.18)',
            }}
          >
            <div style={{
              width: 40, height: 4, background: PALETTE.rule,
              borderRadius: RADIUS.pill, margin: '0 auto 14px',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp(3) }}>
              <div style={typeStyle('lg', 'bold')}>Légende des colonnes</div>
              <button onClick={() => setLegendOpen(false)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                fontSize: 22, color: PALETTE.inkMute, lineHeight: 1,
              }}>×</button>
            </div>
            {ALL_FIELDS.map(f => (
              <div key={f.key} style={{
                display: 'flex', gap: sp(3), padding: `${sp(2)}px 0`,
                borderBottom: `1px solid ${PALETTE.ruleSoft}`,
              }}>
                <div style={{
                  minWidth: 100,
                  ...monoStyle('xs', 'med', PALETTE.brand),
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {f.label}
                </div>
                <div style={{ ...typeStyle('sm', 'body', PALETTE.ink), flex: 1 }}>
                  {f.help}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header columns */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${PALETTE.rule}`, background: PALETTE.surfaceAlt }}>
        {FIELDS.map(f => (
          <div
            key={f.key}
            title={f.help}
            style={{
              width: f.width, minWidth: f.width,
              padding: `${sp(2)}px ${sp(1)}px`,
              ...monoStyle('xs', 'med', PALETTE.inkMute),
              textAlign: 'center',
              borderRight: `1px solid ${PALETTE.ruleSoft}`,
              textTransform: 'uppercase', letterSpacing: 1,
              cursor: 'help',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}
          >
            {f.label}
            <span style={{
              fontSize: 8, color: PALETTE.inkDim, opacity: 0.6,
              border: `1px solid ${PALETTE.inkDim}`, borderRadius: '50%',
              width: 11, height: 11, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            }}>?</span>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ overflowX: 'auto' }}>
        {expected.map((_, rowIdx) => (
          <div key={rowIdx} style={{
            display: 'flex',
            borderBottom: rowIdx < expected.length - 1 ? `1px solid ${PALETTE.ruleSoft}` : 'none',
          }}>
            {FIELDS.map(f => {
              const status = getStatus(rowIdx, f.key)
              const value = rows[rowIdx]?.[f.key]
              const displayValue = value === null || value === undefined ? '' : String(value)
              const bg = status === 'correct' ? PALETTE.greenSoft
                       : status === 'wrong'   ? PALETTE.redSoft
                       : PALETTE.surface
              const borderC = status === 'correct' ? PALETTE.green
                            : status === 'wrong'   ? PALETTE.red
                            : PALETTE.rule
              const isMono = f.key === 'code_ccam' || f.key === 'localisation' || f.key === 'date'
              return (
                <div key={f.key} style={{
                  width: f.width, minWidth: f.width,
                  borderRight: `1px solid ${PALETTE.ruleSoft}`,
                  position: 'relative',
                }}>
                  <input
                    type={f.type === 'number' ? 'text' : 'text'}
                    inputMode={f.type === 'number' ? 'decimal' : 'text'}
                    value={displayValue}
                    onChange={e => updateCell(rowIdx, f.key, e.target.value)}
                    disabled={showCorrection}
                    style={{
                      width: '100%', height: 40,
                      border: 'none', outline: 'none',
                      padding: `0 ${sp(2)}px`,
                      fontSize: 13,
                      fontFamily: isMono ? FONT_MONO : 'inherit',
                      color: PALETTE.ink,
                      background: bg,
                      borderBottom: status !== 'empty' ? `2px solid ${borderC}` : 'none',
                      textAlign: 'center',
                      transition: 'background 220ms',
                    }}
                  />
                  {showCorrection && status === 'wrong' && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0, top: '100%',
                      padding: '4px 6px',
                      ...monoStyle('xs', 'med', PALETTE.red),
                      background: PALETTE.redSoft, textAlign: 'center',
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
      // On ne note que les cellules qui ont une vraie valeur attendue
      // (0 numérique traité comme "pas de valeur" pour ne pas forcer les colonnes vides)
      if (!isEmpty(e)) {
        total++
        if (cellOK(user[i]?.[f.key], e, f.key)) correct++
      }
    }
  }
  return { cellsCorrect: correct, cellsTotal: total, score: total > 0 ? correct / total : 0 }
}
