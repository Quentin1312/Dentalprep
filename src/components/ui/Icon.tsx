import type { CSSProperties } from 'react'

interface IconProps {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
  style?: CSSProperties
}

export default function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, style }: IconProps) {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const,
    stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, style,
  }

  const paths: Record<string, React.ReactNode> = {
    plus:       <><path d="M12 5v14M5 12h14"/></>,
    minus:      <><path d="M5 12h14"/></>,
    check:      <><path d="M4 12.5l5 5L20 6.5"/></>,
    x:          <><path d="M6 6l12 12M18 6L6 18"/></>,
    chevronR:   <><path d="M9 6l6 6-6 6"/></>,
    chevronL:   <><path d="M15 6l-6 6 6 6"/></>,
    chevronD:   <><path d="M6 9l6 6 6-6"/></>,
    chevronU:   <><path d="M6 15l6-6 6 6"/></>,
    arrowR:     <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    arrowL:     <><path d="M19 12H5M11 5l-7 7 7 7"/></>,
    settings:   <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    bell:       <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></>,
    book:       <><path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14zM4 19.5A2.5 2.5 0 006.5 22H20v-5"/></>,
    bookOpen:   <><path d="M2 4.5h6a3 3 0 013 3v12a2 2 0 00-2-2H2zM22 4.5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z"/></>,
    cards:      <><rect x="3" y="6" width="13" height="14" rx="2"/><path d="M8 3h12a1 1 0 011 1v12"/></>,
    target:     <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill={color}/></>,
    bolt:       <><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></>,
    camera:     <><path d="M3 8a2 2 0 012-2h2.5l1.5-2h6l1.5 2H19a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><circle cx="12" cy="13" r="3.5"/></>,
    images:     <><rect x="6" y="3" width="15" height="15" rx="2"/><path d="M3 7v13a1 1 0 001 1h13"/></>,
    headphones: <><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1v-7h1a2 2 0 012 2zM3 19a2 2 0 002 2h1v-7H5a2 2 0 00-2 2z"/></>,
    sparkle:    <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 3l.7 2L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-1z" opacity={0.7}/></>,
    flame:      <><path d="M12 2s4 5 4 9a4 4 0 11-8 0c0-1.5.5-3 1.5-4-.5 3 2.5 3 2.5 1 0-2-1-3.5 0-6z"/><path d="M8 13a4 4 0 008 0"/></>,
    trophy:     <><path d="M6 4h12v4a4 4 0 11-8 0V6"/><path d="M18 4h3v3a3 3 0 01-3 3M6 4H3v3a3 3 0 003 3M9 18h6l1 3H8z"/><path d="M10 14h4v4h-4z"/></>,
    clock:      <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    calendar:   <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    warn:       <><path d="M12 3L2 20h20zM12 10v4M12 17v.5"/></>,
    info:       <><circle cx="12" cy="12" r="9"/><path d="M12 8v.5M11 12h1v5h1"/></>,
    fileText:   <><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9zM14 3v6h6M9 13h6M9 17h4"/></>,
    refresh:    <><path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5"/></>,
    user:       <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></>,
    heart:      <><path d="M12 21s-7-5-7-11a4 4 0 017-2.5A4 4 0 0119 10c0 6-7 11-7 11z"/></>,
    rocket:     <><path d="M4 14l6 6-2 2-6-6zM14 4l6 6-8 8-6-6z"/><circle cx="14.5" cy="9.5" r="1.5"/></>,
    tooth:      <><path d="M7 3c-2 0-4 1.5-4 5 0 2 1 4 1.5 6S5 19 6 21c.5 1 1.5 1 2 0l1.5-4c.3-.8.7-1 1.5-1s1.2.2 1.5 1l1.5 4c.5 1 1.5 1 2 0 1-2 1-5 1.5-7s1.5-4 1.5-6c0-3.5-2-5-4-5-1.5 0-2 .5-4 .5S8.5 3 7 3z"/></>,
    grid:       <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    eye:        <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
    trash:      <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></>,
  }

  return <svg {...props}>{paths[name] ?? null}</svg>
}
