'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppData } from '@/lib/app-context'
import { MODULES, FASCICULES, type Module, type Fascicule } from '@/lib/modules'
import type { ModuleId } from '@/types/database'
import { useThemeBg, themeBgStyle, THEMES } from '@/lib/theme-bg'
import {
  PathSystemStyles, PathNode, PathRow, ModuleBanner, ModuleBreak, ModuleRail,
  type RailModule, type ModuleBreakVariant,
} from '@/components/ui/PathSystem'

function fasciculeN(title: string): number | null {
  const m = title.match(/Fascicule\s+(\d+)/i)
  return m ? parseInt(m[1]) : null
}

// Per-module visual identity (color + icon)
const MOD_STYLE: Record<ModuleId, { accent: string; icon: 'bookOpen' | 'tooth' | 'warn' | 'mask' | 'eye' | 'target' }> = {
  M1: { accent: '#0A66E0', icon: 'bookOpen' },
  M2: { accent: '#0D9488', icon: 'tooth' },
  M3: { accent: '#7C3AED', icon: 'warn' },
  M4: { accent: '#E11D48', icon: 'mask' },
  M5: { accent: '#D97706', icon: 'eye' },
  M6: { accent: '#5B21B6', icon: 'target' },
}

// Fascicule topic → icon (rough mapping by keywords)
function iconForFascicule(title: string): 'book' | 'tooth' | 'syringe' | 'pill' | 'warn' | 'mask' | 'dental' | 'eye' | 'heart' {
  const t = title.toLowerCase()
  if (t.includes('anesth')) return 'syringe'
  if (t.includes('pharma')) return 'pill'
  if (t.includes('patholog')) return 'warn'
  if (t.includes('microbio') || t.includes('hygi') || t.includes('stéril')) return 'mask'
  if (t.includes('imager') || t.includes('radio')) return 'eye'
  if (t.includes('fauteuil') || t.includes('dent')) return 'dental'
  if (t.includes('urgence') || t.includes('afgsu')) return 'heart'
  if (t.includes('anatomie')) return 'tooth'
  return 'book'
}

// Amplitude sequence for the zigzag — reset per module
const POS_SEQ = [0, -1, -1, 0, 1, 1, 0, -1]
function amplitudeAt(i: number): number {
  return POS_SEQ[i % POS_SEQ.length]
}

const BREAK_ROTATION: ModuleBreakVariant[] = ['cat', 'cat', 'cat', 'cat', 'cat']

export default function LibraryPage() {
  const router = useRouter()
  const { data, loading } = useAppData()
  const [themeId] = useThemeBg()
  const theme = THEMES[themeId]
  const courses = data?.courses ?? []
  const attempts = data?.attempts ?? []

  // Compute per-module stats once
  const moduleStats = MODULES.map(m => {
    const mFascicules = FASCICULES.filter(f => f.modules.includes(m.id))
    const mCourses = courses.filter(c => c.module_id === m.id)
    // A fascicule is "scanned" if a course with its number exists anywhere (any module)
    const scanned = mFascicules.filter(f => courses.some(c => fasciculeN(c.title) === f.n))
    const mAttempts = attempts.filter(a => a.module_id === m.id)
    const correct = mAttempts.filter(a => a.is_correct).length
    const acc = mAttempts.length > 0 ? correct / mAttempts.length : 0
    return { m, mFascicules, mCourses, scannedCount: scanned.length, attempts: mAttempts.length, accuracy: acc }
  })

  // Rail data
  const railModules: RailModule[] = moduleStats.map(({ m, scannedCount, mFascicules, accuracy }) => {
    const status: RailModule['status'] = scannedCount === mFascicules.length && mFascicules.length > 0
      ? 'done'
      : scannedCount > 0 ? 'active' : 'open'
    return {
      id: m.id, label: m.label.split(' ').slice(0, 2).join(' '),
      accent: MOD_STYLE[m.id].accent, icon: MOD_STYLE[m.id].icon,
      done: scannedCount, total: mFascicules.length || 1,
      status,
    }
  })

  // Active module: the first non-fully-scanned module that has at least one scan, fallback to first
  const activeMod = moduleStats.find(s => s.scannedCount > 0 && s.scannedCount < s.mFascicules.length)?.m
    ?? moduleStats.find(s => s.scannedCount === 0)?.m
    ?? MODULES[0]

  function scrollTo(modId: string) {
    if (typeof document === 'undefined') return
    const el = document.getElementById(`mod-${modId}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={{
      minHeight: '100%', ...themeBgStyle(themeId),
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      paddingBottom: 120,
    }}>
      <PathSystemStyles />

      {/* Page header */}
      <div style={{ padding: '54px 16px 4px' }}>
        <div style={{
          fontSize: 11, color: theme.textMuted, fontWeight: 800,
          letterSpacing: 0.6, textTransform: 'uppercase',
        }}>Bonjour</div>
        <div style={{
          fontSize: 26, fontWeight: 800, letterSpacing: -0.6, color: theme.text, marginTop: 1,
        }}>Ton parcours</div>
      </div>

      {/* Module rail */}
      <ModuleRail modules={railModules} activeId={activeMod.id} onPick={scrollTo} />

      {/* Loading skeleton */}
      {loading && !data && (
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[120, 180, 120, 180].map((h, i) => (
            <div key={i} style={{
              height: h, borderRadius: 18,
              background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)',
              backgroundSize: '200% 100%', animation: 'dp-shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      )}

      {/* The full zigzag path */}
      {!loading && moduleStats.map(({ m, mFascicules, mCourses, scannedCount, accuracy }, mIdx) => {
        const accent = MOD_STYLE[m.id].accent
        const modIcon = MOD_STYLE[m.id].icon
        const isFullyScanned = scannedCount === mFascicules.length && mFascicules.length > 0
        const isActive = m.id === activeMod.id

        // Build node list: each fascicule + boss quiz at end
        const nodes: Array<{
          kind: 'fasc' | 'boss'
          fascicule?: Fascicule
          course?: { id: string; module_id: string; title: string; page_count: number | null }
          isCurrent?: boolean
        }> = []

        // First "current" = first not-scanned fascicule. Make others available/locked accordingly.
        let foundCurrent = false
        for (const f of mFascicules) {
          // Look in all courses (not just this module's) — a fascicule belongs to multiple modules
          const course = courses.find(c => fasciculeN(c.title) === f.n)
          const isCurrent = !course && !foundCurrent
          if (isCurrent) foundCurrent = true
          nodes.push({ kind: 'fasc', fascicule: f, course, isCurrent })
        }
        // Add boss quiz node at end (regardless of scan state, it's always there)
        nodes.push({ kind: 'boss' })

        return (
          <div key={m.id} id={`mod-${m.id}`}>
            <ModuleBanner
              moduleId={m.id}
              label={m.label}
              sublabel={m.description}
              accent={accent}
              icon={modIcon}
              doneNodes={scannedCount}
              totalNodes={mFascicules.length}
              isActive={isActive}
              onClick={() => router.push(`/module/${m.id}`)}
            />

            {nodes.map((node, i) => {
              const pos = amplitudeAt(i)
              const from = i > 0 ? amplitudeAt(i - 1) : undefined

              if (node.kind === 'fasc') {
                const f = node.fascicule!
                const course = node.course
                // Un-scanned but next-up = 'current' (pulsing). Other un-scanned = 'available'.
                // Scanned = 'completed'.
                const state = course ? 'completed' : node.isCurrent ? 'current' : 'available'
                const icon = course ? iconForFascicule(f.title) : 'camera'
                const href = course ? `/fascicule/${course.id}?module=${m.id}` : `/upload?fascicule=${f.n}`
                const shortTitle = f.title.length > 26 ? f.title.slice(0, 24) + '…' : f.title
                return (
                  <PathRow key={`f-${m.id}-${f.n}`} pos={pos} from={from}>
                    <Link href={href} style={{ textDecoration: 'none' }}>
                      <PathNode
                        state={state}
                        icon={icon}
                        accent={accent}
                        label={shortTitle}
                        sublabel={course ? 'Scanné' : 'À scanner'}
                      />
                    </Link>
                  </PathRow>
                )
              }
              // Boss quiz node
              const bossState = scannedCount === 0
                ? 'locked'
                : isFullyScanned && accuracy >= 0.75
                  ? 'completed'
                  : 'available'
              const href = `/quiz/${m.id}${isFullyScanned ? '?mode=smart' : ''}`
              return (
                <PathRow key={`boss-${m.id}`} pos={pos} from={from}>
                  <Link href={bossState === 'locked' ? '#' : href} style={{ textDecoration: 'none', pointerEvents: bossState === 'locked' ? 'none' : 'auto' }}>
                    <PathNode
                      state={bossState}
                      icon="target"
                      isBoss
                      accent={accent}
                      label="Quiz du module"
                      sublabel={accuracy > 0 ? `${Math.round(accuracy * 100)}% • ${nodesAttempts(attempts, m.id)} tentés` : undefined}
                    />
                  </Link>
                </PathRow>
              )
            })}

            {/* Module break decoration between modules (skip after last) */}
            {mIdx < moduleStats.length - 1 && (
              <ModuleBreak variant={BREAK_ROTATION[mIdx % BREAK_ROTATION.length]} />
            )}
          </div>
        )
      })}

      {/* Final exam boss */}
      {!loading && (
        <div style={{ padding: '22px 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{
            padding: '6px 12px', borderRadius: 10,
            background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)',
            color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: 1.2,
            textTransform: 'uppercase',
            boxShadow: '0 8px 18px -6px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}>★ Examen final CNQAOS ★</div>
          <Link href="/global-quiz" style={{ textDecoration: 'none' }}>
            <PathNode state="locked" icon="trophy" isBoss label="Examen blanc" sublabel="Conditions réelles" accent="#7C3AED" />
          </Link>
        </div>
      )}
    </div>
  )
}

function nodesAttempts(attempts: { module_id: string }[], modId: string): number {
  return attempts.filter(a => a.module_id === modId).length
}
