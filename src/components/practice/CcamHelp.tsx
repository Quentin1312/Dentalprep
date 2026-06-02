'use client'

import { useState } from 'react'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type CodeRow = { code: string; label: string }
type Section = { title: string; rows: CodeRow[] }

const SECTIONS: Section[] = [
  {
    title: 'Diagnostic / Radio',
    rows: [
      { code: 'HBQK002', label: 'Radio rétro-alvéolaire (1 à 3 dents contiguës)' },
      { code: 'HBQK040', label: 'Radio rétro-alvéolaire (4 à 6 dents)' },
      { code: 'LAQK002', label: 'Panoramique dentomaxillaire' },
      { code: 'HBQK010', label: 'Examen bucco-dentaire (EBD)' },
      { code: 'C / CS',  label: 'Consultation (NGAP)' },
    ],
  },
  {
    title: 'Prophylaxie',
    rows: [
      { code: 'HBJD001', label: 'Détartrage et polissage 2 arcades (par séance)' },
      { code: 'HBBD002', label: 'Scellement prophylactique des sillons (1 dent)' },
      { code: 'HBLD034', label: 'Application topique de fluorures (vernis fluoré)' },
    ],
  },
  {
    title: 'Restaurations',
    rows: [
      { code: 'HBMD038', label: 'Restauration 1 face' },
      { code: 'HBMD039', label: 'Restauration 2 faces' },
      { code: 'HBMD040', label: 'Restauration 3 faces' },
      { code: 'HBMD041', label: 'Restauration 4 faces et +' },
      { code: 'HBMD050', label: 'Restauration avec ancrage radiculaire / inlay-onlay' },
    ],
  },
  {
    title: 'Endodontie',
    rows: [
      { code: 'HBFD021', label: 'Coiffage pulpaire direct' },
      { code: 'HBFD031', label: 'Pulpectomie / exérèse contenu canalaire monoradiculée' },
      { code: 'HBFD032', label: 'Pulpotomie sur dent temporaire' },
    ],
  },
  {
    title: 'Avulsions',
    rows: [
      { code: 'HBGD036', label: 'Avulsion dent permanente sur arcade' },
      { code: 'HBGD037', label: 'Avulsion + alvéolectomie / séparation racines' },
      { code: 'HBGD021', label: 'Avulsion dent temporaire' },
      { code: 'HBGD019', label: 'Avulsion dent retenue (sagesse)' },
    ],
  },
  {
    title: 'Prothèses',
    rows: [
      { code: 'HBLD036', label: 'Pose inlay-core' },
      { code: 'HBLD031', label: 'Pose couronne (céramométal / implanto-portée)' },
      { code: 'HBLD090', label: 'Pose couronne transitoire' },
      { code: 'HBLD035', label: 'Adjonction sur prothèse amovible' },
      { code: 'HBMD040', label: 'Réparation prothèse amovible résine' },
    ],
  },
  {
    title: 'Modificateurs',
    rows: [
      { code: 'N',    label: '+15,7% — enfant < 13 ans (soins conservateurs / endo)' },
      { code: 'E',    label: '+49% — enfant < 5 ans (radiologie)' },
      { code: 'U',    label: 'Forfait 25,15€ — urgence 20h-8h' },
      { code: 'F',    label: 'Forfait perm. des soins (dimanche / jour férié)' },
      { code: 'MCD',  label: '30€ jour férié / 19€ hors permanence' },
      { code: '9',    label: '+30% permanence des soins' },
    ],
  },
]

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
        <Icon name="info" size={14} color={A.primary} /> Aide codes CCAM
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: A.text, letterSpacing: -0.3 }}>
                Aide codes CCAM
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 6,
              }}>
                <Icon name="x" size={20} color={A.textMuted} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: A.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              Sélection des codes les plus fréquents. Pour un acte non listé, voir le fascicule 18 (CCAM).
            </div>

            {SECTIONS.map(sec => (
              <div key={sec.title} style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, color: A.textMuted,
                  letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
                }}>
                  {sec.title}
                </div>
                <div style={{
                  background: '#F7F9FC', borderRadius: 12,
                  border: `1px solid ${A.border}`, overflow: 'hidden',
                }}>
                  {sec.rows.map((r, i) => (
                    <div key={r.code} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px',
                      borderTop: i > 0 ? `1px solid ${A.border}` : 'none',
                    }}>
                      <div style={{
                        fontFamily: 'monospace', fontSize: 12, fontWeight: 800,
                        color: A.primary, minWidth: 78,
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
            ))}
          </div>
        </div>
      )}
    </>
  )
}
