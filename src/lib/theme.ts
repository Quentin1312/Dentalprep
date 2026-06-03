/**
 * DentalPrep — Design tokens.
 *
 * Direction visuelle : « Clinique » — teal profond + sable chaud.
 * Typographie : Bricolage Grotesque (display) + Geist (body) + Geist Mono (data).
 *
 * Convention : on garde l'export `A` historique (utilisé partout dans l'app)
 * et on ajoute en plus les helpers structurés (typeStyle / displayStyle /
 * monoStyle / sp / radius / motion / shadow). Les composants existants
 * continuent de fonctionner ; les nouveaux composants tirent du système complet.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Fonts (chargées via next/font dans src/app/layout.tsx — variables CSS)
// ─────────────────────────────────────────────────────────────────────────────

export const FONT_DISPLAY = 'var(--font-display), "Bricolage Grotesque", -apple-system, "SF Pro Display", system-ui, sans-serif'
export const FONT_BODY    = 'var(--font-body), "Geist", -apple-system, "SF Pro Text", system-ui, sans-serif'
export const FONT_MONO    = 'var(--font-mono), "Geist Mono", "SF Mono", ui-monospace, monospace'

// ─────────────────────────────────────────────────────────────────────────────
// Couleurs — direction "Clinique" (light)
// ─────────────────────────────────────────────────────────────────────────────

export const PALETTE = {
  // Brand — teal profond
  brand:      '#0E5552',
  brandDeep:  '#062E2C',
  brandSoft:  '#DDECEA',
  // Accent — sable chaud
  accent:     '#C28840',
  accentSoft: '#F4E7D2',
  // Surface
  bg:         '#F4F5F2',
  surface:    '#FFFFFF',
  surfaceAlt: '#FAFBF8',
  rule:       '#E4E7E2',
  ruleSoft:   '#EDEFEB',
  // Ink
  ink:        '#0A1614',
  inkMute:    '#4E5B58',
  inkDim:     '#8D9893',
  // Semantic
  green:      '#2E7A4D',
  greenSoft:  '#DDEDDF',
  amber:      '#C08A23',
  amberSoft:  '#F5E7C0',
  red:        '#B5413E',
  redSoft:    '#F4D9D7',
  blue:       '#2F6AD9',
  blueSoft:   '#DAE5F8',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Échelle typo — Tailwind-like (xs/sm/base/lg/xl/2xl/3xl/4xl)
// ─────────────────────────────────────────────────────────────────────────────

export const TYPE = {
  xs:   { size: 11, line: 14, track:  0.2 },
  sm:   { size: 13, line: 18, track:  0   },
  base: { size: 15, line: 22, track: -0.1 },
  lg:   { size: 17, line: 24, track: -0.2 },
  xl:   { size: 20, line: 26, track: -0.3 },
  '2xl':{ size: 24, line: 30, track: -0.5 },
  '3xl':{ size: 30, line: 34, track: -0.8 },
  '4xl':{ size: 38, line: 40, track: -1.2 },
} as const

export type TypeKey = keyof typeof TYPE

export const WEIGHT = { body: 400, med: 500, bold: 700 } as const
export type WeightKey = keyof typeof WEIGHT

// ─────────────────────────────────────────────────────────────────────────────
// Spacing 4px-based + radius + motion + shadow
// ─────────────────────────────────────────────────────────────────────────────

export const SPACE = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const

export const RADIUS = { none: 0, sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const

export const MOTION = {
  fast: '120ms cubic-bezier(.2,.7,.3,1)',
  med:  '220ms cubic-bezier(.2,.7,.3,1)',
  slow: '420ms cubic-bezier(.2,.7,.3,1)',
} as const

export const SHADOW = {
  sm: '0 1px 2px hsla(180 30% 6% / 0.06)',
  md: '0 1px 2px hsla(180 30% 6% / 0.05), 0 8px 18px -6px hsla(180 30% 6% / 0.12)',
  lg: '0 4px 8px hsla(180 30% 6% / 0.06), 0 18px 32px -10px hsla(180 30% 6% / 0.18)',
  focus: `0 0 0 3px ${PALETTE.accent}33`,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// API legacy `A` — gardée 1:1 pour ne pas casser le reste de l'app
// (les nouveaux composants doivent utiliser PALETTE / TYPE / SPACE / RADIUS)
// ─────────────────────────────────────────────────────────────────────────────

export const A = {
  bg:           PALETTE.bg,
  surface:      PALETTE.surface,
  border:       PALETTE.rule,
  borderStrong: PALETTE.rule,
  text:         PALETTE.ink,
  textMuted:    PALETTE.inkMute,
  textDim:      PALETTE.inkDim,
  primary:      PALETTE.brand,
  primaryDark:  PALETTE.brandDeep,
  primarySoft:  PALETTE.brandSoft,
  green:        PALETTE.green,
  greenSoft:    PALETTE.greenSoft,
  amber:        PALETTE.amber,
  amberSoft:    PALETTE.amberSoft,
  red:          PALETTE.red,
  font:         FONT_BODY,
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Helpers typo — typeStyle / displayStyle / monoStyle
// ─────────────────────────────────────────────────────────────────────────────

import type { CSSProperties } from 'react'

function asStyle(family: string, size: number, line: number, track: number, weight: number, color: string): CSSProperties {
  return { fontFamily: family, fontSize: size, lineHeight: `${line}px`, letterSpacing: track, fontWeight: weight, color }
}

export function typeStyle(key: TypeKey, weight: WeightKey = 'med', color: string = PALETTE.ink): CSSProperties {
  const s = TYPE[key]
  return asStyle(FONT_BODY, s.size, s.line, s.track, WEIGHT[weight], color)
}

export function displayStyle(key: TypeKey, weight: WeightKey = 'bold', color: string = PALETTE.ink): CSSProperties {
  const s = TYPE[key]
  return asStyle(FONT_DISPLAY, s.size, s.line, s.track, WEIGHT[weight], color)
}

export function monoStyle(key: TypeKey, weight: WeightKey = 'med', color: string = PALETTE.ink): CSSProperties {
  const s = TYPE[key]
  return asStyle(FONT_MONO, s.size, s.line, 0, WEIGHT[weight], color)
}

// space helper — accepts a key from SPACE or a raw number
export function sp(n: keyof typeof SPACE | number): number {
  if (typeof n === 'number' && !(n in SPACE)) return n
  return SPACE[n as keyof typeof SPACE] ?? 0
}
