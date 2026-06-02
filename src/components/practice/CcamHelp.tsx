'use client'

import { useState } from 'react'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

const POS_1_2 = [
  { code: 'HB', label: 'Bouche, dent, parodonte' },
  { code: 'LA', label: 'Squelette de la face / sans précision' },
  { code: 'LB', label: 'Maxillaire ou mandibule' },
  { code: 'L',  label: 'Os, articulations et tissus mous — tête, cou, tronc' },
]

const POS_3 = [
  { code: 'B', label: 'Comblement, contention, scellement de sillons' },
  { code: 'D', label: 'Fixer, contention' },
  { code: 'E', label: 'Déplacer, greffer, repositionner' },
  { code: 'F', label: 'Exciser, exérèse, endodontie' },
  { code: 'G', label: 'Évider, extraire, avulsion, curetage' },
  { code: 'J', label: 'Drainer, évacuer, nettoyer, détartrage' },
  { code: 'L', label: 'Ajouter sans retirer, pose de prothèse' },
  { code: 'M', label: 'Confection, préparation, réglage, adjonction sur PPA/PAC' },
  { code: 'P', label: 'Coiffage' },
  { code: 'Q', label: 'Repérage, acquisition de données, radio' },
]

const POS_4 = [
  { code: 'D', label: 'Accès transorificiel (voie naturelle)' },
  { code: 'K', label: 'Acte par Rx sans accès' },
]

const MODIFICATEURS = [
  { code: 'N',   label: '+15,7% — soins conservateurs / endo chez enfant < 13 ans' },
  { code: 'E',   label: '+49% — radiologie chez enfant < 5 ans' },
  { code: 'U',   label: 'Forfait 25,15€ — urgence entre 20h et 8h' },
  { code: 'F',   label: 'Forfait perm. des soins (dimanche / jour férié) — 30€ permanence, 19,06€ hors' },
  { code: 'MCD', label: 'Variante du F (selon les conditions)' },
  { code: '9',   label: '+30% — soins conservateurs en permanence' },
]

const ASSOCIATIONS = [
  { code: '1', label: 'Acte le plus cher (facturé 100%)' },
  { code: '2', label: 'Acte(s) associé(s) (facturé(s) 50%)' },
  { code: '4', label: 'Actes associables entre eux à 100% (gingivectomie, détartrage, radios non panoramique)' },
]

type Row = { code: string; label: string }

function Block({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: A.textMuted,
        letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
      }}>
        {title}
      </div>
      <div style={{
        background: '#F7F9FC', borderRadius: 12,
        border: `1px solid ${A.border}`, overflow: 'hidden',
      }}>
        {rows.map((r, i) => (
          <div key={r.code} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px',
            borderTop: i > 0 ? `1px solid ${A.border}` : 'none',
          }}>
            <div style={{
              fontFamily: 'monospace', fontSize: 13, fontWeight: 800,
              color: A.primary, minWidth: 50,
            }}>
              {r.code}
            </div>
            <div style={{ fontSize: 12, color: A.text, lineHeight: 1.35 }}>
              {r.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CcamHelp() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#EEF4FF', color: A.primary,
          border: `1px solid #C7D9F9`, borderRadius: 999,
          padding: '6px 12px', fontSize: 12, fontWeight: 700,
          fontFamily: A.font, cursor: 'pointer',
        }}
      >
        <Icon name="info" size={14} color={A.primary} /> Méthode CCAM
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 50, display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxHeight: '85vh', overflowY: 'auto',
              background: '#fff',
              borderTopLeftRadius: 22, borderTopRightRadius: 22,
              padding: '16px 16px 32px',
              fontFamily: A.font,
              boxShadow: '0 -10px 30px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{
              width: 40, height: 4, background: '#D1D7E0',
              borderRadius: 999, margin: '0 auto 12px',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: A.text, letterSpacing: -0.3 }}>
                Méthode CCAM
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 6,
              }}>
                <Icon name="x" size={20} color={A.textMuted} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: A.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              Un code CCAM = <strong>4 lettres + 3 chiffres</strong>. Décode chaque position pour reconstituer le code de l'acte.
            </div>

            {/* Schéma structure */}
            <div style={{
              background: 'linear-gradient(180deg, #EEF4FF 0%, #F7F9FC 100%)',
              borderRadius: 12, padding: 14, marginBottom: 16,
              border: `1px solid #C7D9F9`,
            }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 18, fontWeight: 900,
                color: A.primary, textAlign: 'center', letterSpacing: 2, marginBottom: 8,
              }}>
                HB <span style={{ color: '#16A34A' }}>G</span> <span style={{ color: '#D97706' }}>D</span> 022
              </div>
              <div style={{ fontSize: 11, color: A.text, lineHeight: 1.6 }}>
                <div><strong>HB</strong> = localisation anatomique (bouche, dent, parodonte)</div>
                <div><span style={{ color: '#16A34A', fontWeight: 700 }}>G</span> = action générale (avulsion)</div>
                <div><span style={{ color: '#D97706', fontWeight: 700 }}>D</span> = voie d'abord / technique (transorificiel)</div>
                <div><strong>022</strong> = compteur (aléatoire, sans signification)</div>
              </div>
            </div>

            <Block title="Position 1-2 — localisation" rows={POS_1_2} />
            <Block title="Position 3 — action générale" rows={POS_3} />
            <Block title="Position 4 — voie d'abord / technique" rows={POS_4} />
            <Block title="Modificateurs" rows={MODIFICATEURS} />
            <Block title="Codes d'association" rows={ASSOCIATIONS} />
          </div>
        </div>
      )}
    </>
  )
}
