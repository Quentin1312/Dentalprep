'use client'

/**
 * Background theme system for the app.
 * Persists the user's choice to localStorage.
 * Components consume it via useThemeBg() or themeBgStyle().
 */

import { useSyncExternalStore } from 'react'

export type ThemeBgId = 'white' | 'cream' | 'lavender' | 'mint'

export type ThemeBg = {
  id: ThemeBgId
  name: string
  bg: string
  bgGradient: string
  patternOpacity: number
  surface: string
  border: string
  text: string
  textMuted: string
  textDim: string
}

export const THEMES: Record<ThemeBgId, ThemeBg> = {
  white: {
    id: 'white',
    name: 'Blanc poudré',
    bg: '#FFFFFF',
    bgGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F4F6F8 100%)',
    patternOpacity: 0.045,
    surface: '#FFFFFF',
    border: '#E4E8EE',
    text: '#0F1B2D',
    textMuted: '#5A6675',
    textDim: '#8A95A5',
  },
  cream: {
    id: 'cream',
    name: 'Crème chaude',
    bg: '#FAF5E9',
    bgGradient: 'linear-gradient(180deg, #FAF5E9 0%, #F3EAD6 100%)',
    patternOpacity: 0.055,
    surface: '#FFFFFF',
    border: '#E8DFCB',
    text: '#0F1B2D',
    textMuted: '#5A6675',
    textDim: '#8A95A5',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavande',
    bg: '#F4EFFB',
    bgGradient: 'linear-gradient(180deg, #F5EFFB 0%, #E8DCF6 100%)',
    patternOpacity: 0.055,
    surface: '#FFFFFF',
    border: '#E2D5F0',
    text: '#1B1730',
    textMuted: '#5A4F75',
    textDim: '#8A7FA5',
  },
  mint: {
    id: 'mint',
    name: 'Menthe',
    bg: '#ECF5F0',
    bgGradient: 'linear-gradient(180deg, #EEF6F0 0%, #DDEDE2 100%)',
    patternOpacity: 0.055,
    surface: '#FFFFFF',
    border: '#D3E5DB',
    text: '#0E2418',
    textMuted: '#4A6557',
    textDim: '#7E9486',
  },
}

const STORAGE_KEY = 'dp_theme_bg'
const EVENT_NAME = 'dp:theme-bg-changed'

function isThemeId(v: unknown): v is ThemeBgId {
  return v === 'white' || v === 'cream' || v === 'lavender' || v === 'mint'
}

function read(): ThemeBgId {
  if (typeof window === 'undefined') return 'white'
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (isThemeId(v)) return v
  } catch {}
  return 'white'
}

function subscribe(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = () => cb()
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}

export function setThemeBg(id: ThemeBgId): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {}
  window.dispatchEvent(new Event(EVENT_NAME))
}

/** React hook — returns [currentThemeId, setThemeBg]. */
export function useThemeBg(): [ThemeBgId, (id: ThemeBgId) => void] {
  const id = useSyncExternalStore(subscribe, read, () => 'white')
  return [id, setThemeBg]
}

/** Build the repeating paw + tooth SVG background pattern. */
export function makeBgPattern(opacity = 0.05): string {
  const o = String(opacity)
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><g fill='%230F1B2D' opacity='${o}'><g transform='translate(30,42)'><ellipse cx='0' cy='8' rx='4' ry='3.6'/><ellipse cx='-8' cy='0' rx='1.8' ry='2.1'/><ellipse cx='-3' cy='-4' rx='1.8' ry='2.1'/><ellipse cx='3' cy='-4' rx='1.8' ry='2.1'/><ellipse cx='8' cy='0' rx='1.8' ry='2.1'/></g><g transform='translate(130,110) rotate(22)'><ellipse cx='0' cy='8' rx='4' ry='3.6'/><ellipse cx='-8' cy='0' rx='1.8' ry='2.1'/><ellipse cx='-3' cy='-4' rx='1.8' ry='2.1'/><ellipse cx='3' cy='-4' rx='1.8' ry='2.1'/><ellipse cx='8' cy='0' rx='1.8' ry='2.1'/></g><g transform='translate(95,160) rotate(-12)'><ellipse cx='0' cy='8' rx='4' ry='3.6'/><ellipse cx='-8' cy='0' rx='1.8' ry='2.1'/><ellipse cx='-3' cy='-4' rx='1.8' ry='2.1'/><ellipse cx='3' cy='-4' rx='1.8' ry='2.1'/><ellipse cx='8' cy='0' rx='1.8' ry='2.1'/></g><g transform='translate(140,30) rotate(-20)'><path d='M0 0 c-2 0 -4 1.5 -4 5 c0 2 1 4 1.5 6 s0.5 4 1 5 s0.5 2 1 2 s0.7 -1.5 1 -2 s0.7 -0.7 1.5 -0.7 s1.2 0.2 1.5 0.7 s0.5 2 1 2 s1 -1 1.5 -2 s0.5 -3 1 -5 s1.5 -3.5 1.5 -6 c0 -3.5 -2 -5 -4 -5z'/></g><g transform='translate(50,140) rotate(15)'><path d='M0 0 c-2 0 -4 1.5 -4 5 c0 2 1 4 1.5 6 s0.5 4 1 5 s0.5 2 1 2 s0.7 -1.5 1 -2 s0.7 -0.7 1.5 -0.7 s1.2 0.2 1.5 0.7 s0.5 2 1 2 s1 -1 1.5 -2 s0.5 -3 1 -5 s1.5 -3.5 1.5 -6 c0 -3.5 -2 -5 -4 -5z'/></g></g></svg>")`
}

/** Inline style object that paints the theme background on a wrapper div. */
export function themeBgStyle(themeId: ThemeBgId): React.CSSProperties {
  const t = THEMES[themeId]
  const pattern = makeBgPattern(t.patternOpacity)
  return {
    backgroundColor: t.bg,
    backgroundImage: `${pattern}, ${t.bgGradient}`,
    backgroundSize: '180px 180px, 100% 100%',
    backgroundRepeat: 'repeat, no-repeat',
    color: t.text,
  }
}
