'use client'

/**
 * Rendu d'une fiche de révision (lesson_sheet) — JSON structuré.
 * Tokens Clinique. CSS inline.
 *
 * Format du content :
 * {
 *   intro?: string,
 *   sections: [
 *     { title: string, subtitle?: string, blocks: Block[] }
 *   ],
 *   retenir?: string[]
 * }
 *
 * Block types : para | heading | callout | table | list
 */

import { PALETTE, TYPE, WEIGHT, SPACE, RADIUS, FONT_DISPLAY } from '@/lib/theme'

type Block =
  | { type: 'para'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'callout'; variant?: 'info' | 'warn' | 'success' | 'tip'; text: string }
  | { type: 'table'; title?: string; subtitle?: string; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[] }

export type FicheContent = {
  intro?: string
  sections: { title: string; subtitle?: string; blocks: Block[] }[]
  retenir?: string[]
}

const CALLOUT_STYLES: Record<string, { bg: string; border: string; ink: string }> = {
  info:    { bg: PALETTE.brandSoft,  border: PALETTE.brand,  ink: PALETTE.brandDeep },
  warn:    { bg: PALETTE.amberSoft,  border: PALETTE.amber,  ink: '#5A4014' },
  success: { bg: PALETTE.greenSoft,  border: PALETTE.green,  ink: '#1F4A2F' },
  tip:     { bg: PALETTE.accentSoft, border: PALETTE.accent, ink: '#5A3F18' },
}

function Para({ text }: { text: string }) {
  return (
    <p style={{
      margin: '0 0 14px',
      fontSize: TYPE.base.size, lineHeight: `${TYPE.base.line}px`,
      color: PALETTE.ink, letterSpacing: TYPE.base.track,
    }}>{text}</p>
  )
}

function Heading({ text }: { text: string }) {
  return (
    <h4 style={{
      margin: '18px 0 8px',
      fontSize: TYPE.base.size, lineHeight: `${TYPE.base.line}px`,
      fontWeight: WEIGHT.bold, color: PALETTE.brandDeep,
      letterSpacing: -0.1,
    }}>{text}</h4>
  )
}

function Callout({ variant = 'info', text }: { variant?: string; text: string }) {
  const s = CALLOUT_STYLES[variant] ?? CALLOUT_STYLES.info
  return (
    <div style={{
      margin: '12px 0',
      background: s.bg,
      borderLeft: `3px solid ${s.border}`,
      borderRadius: RADIUS.md,
      padding: '12px 14px',
      fontSize: TYPE.sm.size, lineHeight: `${TYPE.sm.line + 2}px`,
      color: s.ink, fontWeight: WEIGHT.med,
    }}>{text}</div>
  )
}

function Table({ title, subtitle, headers, rows }: { title?: string; subtitle?: string; headers: string[]; rows: string[][] }) {
  return (
    <div style={{
      margin: '12px 0',
      border: `1px solid ${PALETTE.rule}`,
      borderRadius: RADIUS.md,
      overflow: 'hidden',
      background: PALETTE.surface,
    }}>
      {(title || subtitle) && (
        <div style={{
          padding: '10px 14px',
          background: PALETTE.surfaceAlt,
          borderBottom: `1px solid ${PALETTE.rule}`,
        }}>
          {title && <div style={{ fontSize: TYPE.sm.size, fontWeight: WEIGHT.bold, color: PALETTE.ink }}>{title}</div>}
          {subtitle && <div style={{ fontSize: TYPE.xs.size, color: PALETTE.inkMute, marginTop: 2 }}>{subtitle}</div>}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: headers.length === 2 ? '38% 62%' : `repeat(${headers.length}, 1fr)` }}>
        {headers.map((h, i) => (
          <div key={`h${i}`} style={{
            padding: '8px 12px',
            background: PALETTE.brandSoft,
            borderRight: i < headers.length - 1 ? `1px solid ${PALETTE.rule}` : undefined,
            fontSize: TYPE.xs.size, fontWeight: WEIGHT.bold, color: PALETTE.brandDeep,
            textTransform: 'uppercase', letterSpacing: 0.4,
          }}>{h}</div>
        ))}
        {rows.map((row, ri) => row.map((cell, ci) => (
          <div key={`r${ri}c${ci}`} style={{
            padding: '10px 12px',
            borderTop: `1px solid ${PALETTE.ruleSoft}`,
            borderRight: ci < row.length - 1 ? `1px solid ${PALETTE.ruleSoft}` : undefined,
            fontSize: TYPE.sm.size, lineHeight: `${TYPE.sm.line}px`,
            color: ci === 0 ? PALETTE.ink : PALETTE.inkMute,
            fontWeight: ci === 0 ? WEIGHT.med : WEIGHT.body,
          }}>{cell}</div>
        )))}
      </div>
    </div>
  )
}

function List({ items }: { items: string[] }) {
  return (
    <ul style={{
      margin: '8px 0 14px',
      paddingLeft: 0,
      listStyle: 'none',
    }}>
      {items.map((it, i) => (
        <li key={i} style={{
          display: 'flex', gap: 10,
          padding: '6px 0',
          fontSize: TYPE.sm.size, lineHeight: `${TYPE.sm.line + 2}px`,
          color: PALETTE.ink,
        }}>
          <span style={{
            flexShrink: 0,
            width: 6, height: 6, marginTop: 8,
            borderRadius: 999, background: PALETTE.brand,
          }} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

function renderBlock(b: Block, idx: number) {
  switch (b.type) {
    case 'para':    return <Para key={idx} text={b.text} />
    case 'heading': return <Heading key={idx} text={b.text} />
    case 'callout': return <Callout key={idx} variant={b.variant} text={b.text} />
    case 'table':   return <Table key={idx} title={b.title} subtitle={b.subtitle} headers={b.headers} rows={b.rows} />
    case 'list':    return <List key={idx} items={b.items} />
  }
}

export default function FicheRenderer({ content }: { content: FicheContent }) {
  return (
    <div>
      {content.intro && (
        <div style={{
          background: PALETTE.brandSoft,
          borderLeft: `3px solid ${PALETTE.brand}`,
          borderRadius: RADIUS.md,
          padding: '14px 16px',
          marginBottom: 24,
          fontSize: TYPE.base.size, lineHeight: `${TYPE.base.line}px`,
          color: PALETTE.brandDeep, fontWeight: WEIGHT.med,
        }}>{content.intro}</div>
      )}

      {content.sections.map((s, i) => (
        <section key={i} style={{ marginBottom: 28 }}>
          <h2 style={{
            margin: '0 0 4px',
            fontFamily: FONT_DISPLAY,
            fontSize: TYPE.xl.size, lineHeight: `${TYPE.xl.line}px`,
            fontWeight: WEIGHT.bold, color: PALETTE.brand,
            letterSpacing: TYPE.xl.track,
          }}>{s.title}</h2>
          {s.subtitle && <p style={{
            margin: '0 0 12px',
            fontSize: TYPE.xs.size, color: PALETTE.inkMute,
            fontWeight: WEIGHT.med, textTransform: 'uppercase', letterSpacing: 0.4,
          }}>{s.subtitle}</p>}
          {!s.subtitle && <div style={{ height: 10 }} />}
          {s.blocks.map(renderBlock)}
        </section>
      ))}

      {content.retenir && content.retenir.length > 0 && (
        <div style={{
          marginTop: 28,
          background: PALETTE.accentSoft,
          borderLeft: `3px solid ${PALETTE.accent}`,
          borderRadius: RADIUS.md,
          padding: '14px 16px 16px',
        }}>
          <div style={{
            fontSize: TYPE.xs.size, color: '#5A3F18',
            fontWeight: WEIGHT.bold, textTransform: 'uppercase', letterSpacing: 0.6,
            marginBottom: 8,
          }}>À retenir</div>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {content.retenir.map((r, i) => (
              <li key={i} style={{
                display: 'flex', gap: 10,
                padding: '4px 0',
                fontSize: TYPE.sm.size, lineHeight: `${TYPE.sm.line + 2}px`,
                color: '#5A3F18', fontWeight: WEIGHT.med,
              }}>
                <span style={{ flexShrink: 0, marginTop: 1, fontWeight: WEIGHT.bold }}>•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
