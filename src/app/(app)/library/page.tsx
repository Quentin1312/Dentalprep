'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAppData } from '@/lib/app-context'
import { MODULES, FASCICULES, type Fascicule } from '@/lib/modules'
import type { ModuleId } from '@/types/database'
import { useThemeBg, themeBgStyle, THEMES } from '@/lib/theme-bg'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import {
  PathSystemStyles, PathNode, PathRow, ModuleBanner, ModuleBreak, ModuleRail,
  type RailModule, type ModuleBreakVariant,
} from '@/components/ui/PathSystem'
import { quizCompletionCount } from '@/lib/quiz-progress'

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
  const [sheet, setSheet] = useState<{ courseId: string; modId: ModuleId; title: string; n: number } | null>(null)
  const theme = THEMES[themeId]
  const courses = data?.courses ?? []
  const attempts = data?.attempts ?? []
  const questions = data?.questions ?? []
  const questionCourseMap = data?.questionCourseMap ?? {}

  // Compute per-module stats once
  const moduleStats = MODULES.map(m => {
    const mFascicules = FASCICULES.filter(f => f.modules.includes(m.id))
    const mCourses = courses.filter(c => c.module_id === m.id)
    // A fascicule is "scanned" if a course with its number exists anywhere (any module)
    const scanned = mFascicules.filter(f => courses.some(c => fasciculeN(c.title) === f.n))
    const mAttempts = attempts.filter(a => a.module_id === m.id)
    const mQuestions = questions.filter(q => q.module_id === m.id)
    const completion = quizCompletionCount(mQuestions, attempts)
    const uAttempted = new Set(mAttempts.map(a => a.question_id))
    const uCorrect = new Set(mAttempts.filter(a => a.is_correct).map(a => a.question_id))
    const acc = uAttempted.size > 0 ? uCorrect.size / uAttempted.size : 0
    return { m, mFascicules, mCourses, scannedCount: scanned.length, attempts: mAttempts.length, accuracy: acc, completion }
  })

  // Rail data
  const railModules: RailModule[] = moduleStats.map(({ m, mFascicules, completion }) => {
    const startedCount = mFascicules.filter(f => {
      const course = courses.find(c => fasciculeN(c.title) === f.n)
      if (!course) return false
      return attempts.some(a => questionCourseMap[a.question_id] === course.id)
    }).length
    const status: RailModule['status'] = completion.total > 0 && completion.done === completion.total
      ? 'done'
      : completion.done > 0 || startedCount > 0 ? 'active' : 'open'
    return {
      id: m.id, label: m.label.split(' ').slice(0, 2).join(' '),
      accent: MOD_STYLE[m.id].accent, icon: MOD_STYLE[m.id].icon,
      done: completion.done, total: completion.total || 1,
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
      {!loading && moduleStats.map(({ m, mFascicules, scannedCount, accuracy, completion }, mIdx) => {
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
        for (const f of mFascicules) {
          // Look in all courses (not just this module's) — a fascicule belongs to multiple modules
          const course = courses.find(c => fasciculeN(c.title) === f.n)
          nodes.push({ kind: 'fasc', fascicule: f, course })
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
              doneNodes={completion.done}
              totalNodes={completion.total}
              isActive={isActive}
              onClick={() => router.push(`/module/${m.id}`)}
            />

            {nodes.map((node, i) => {
              const pos = amplitudeAt(i)
              const from = i > 0 ? amplitudeAt(i - 1) : undefined

              if (node.kind === 'fasc') {
                const f = node.fascicule!
                const course = node.course
                const fascAttempts = course
                  ? attempts.filter(a => questionCourseMap[a.question_id] === course.id)
                  : []
                // Use unique-question accuracy: questions answered correctly at least once / unique questions attempted.
                // This way Duolingo retries don't penalize the score.
                const uniqueAttempted = new Set(fascAttempts.map(a => a.question_id))
                const uniqueCorrect = new Set(fascAttempts.filter(a => a.is_correct).map(a => a.question_id))
                const fascAcc = uniqueAttempted.size > 0
                  ? uniqueCorrect.size / uniqueAttempted.size
                  : null
                const state = !course
                  ? 'available'
                  : fascAcc !== null && fascAcc >= 0.75
                    ? 'completed'
                    : fascAcc !== null
                      ? 'started'
                      : 'current'
                const icon = iconForFascicule(f.title)
                const shortTitle = f.title.length > 26 ? f.title.slice(0, 24) + '…' : f.title
                return (
                  <PathRow key={`f-${m.id}-${f.n}`} pos={pos} from={from}>
                    {course ? (
                      <div
                        onClick={() => setSheet({ courseId: course.id, modId: m.id, title: f.title, n: f.n })}
                        style={{ cursor: 'pointer' }}
                      >
                        <PathNode state={state} icon={icon} accent={accent} label={shortTitle} />
                      </div>
                    ) : (
                      <Link href={`/upload?fascicule=${f.n}`} style={{ textDecoration: 'none' }}>
                        <PathNode state={state} icon={icon} accent={accent} label={shortTitle} />
                      </Link>
                    )}
                  </PathRow>
                )
              }
              // Boss quiz node
              const bossState = scannedCount === 0
                ? 'locked'
                : isFullyScanned && accuracy >= 0.75
                  ? 'completed'
                  : 'available'
              const href = `/quiz/${m.id}?mode=module`
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

      {/* Bottom sheet */}
      {sheet && (
        <>
          <style>{`@keyframes dp-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
          <div
            onClick={() => setSheet(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#fff', borderRadius: '22px 22px 0 0',
            padding: '0 20px 48px', zIndex: 201,
            animation: 'dp-slide-up 0.28s cubic-bezier(0.32,0.72,0,1)',
            boxShadow: '0 -8px 40px rgba(15,27,45,0.18)',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#D1D8E4', margin: '12px auto 20px' }} />
            {/* Fascicule header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: A.primary }}>{sheet.n}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Fascicule</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sheet.title}</div>
              </div>
            </div>
            {/* Quiz */}
            <Link href={`/quiz/${sheet.modId}?courseId=${sheet.courseId}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 10 }} onClick={() => setSheet(null)}>
              <div style={{
                background: `linear-gradient(135deg, ${A.primary} 0%, #0850B8 100%)`,
                borderRadius: 16, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: '0 8px 20px -6px rgba(10,102,224,0.40)',
              }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="target" size={22} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>Quiz</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>QCM, Vrai/Faux, Ordre, Association</div>
                </div>
                <Icon name="chevronR" size={16} color="rgba(255,255,255,0.7)" />
              </div>
            </Link>
            {/* Flashcards */}
            <Link href={`/flashcards/${sheet.modId}?courseId=${sheet.courseId}&lesson=0`} style={{ textDecoration: 'none', display: 'block' }} onClick={() => setSheet(null)}>
              <div style={{
                background: A.surface, borderRadius: 16, padding: '16px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                border: `1px solid ${A.border}`,
                boxShadow: '0 2px 8px rgba(15,27,45,0.06)',
              }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="cards" size={22} color={A.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: A.text, letterSpacing: -0.3 }}>Flashcards</div>
                  <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2 }}>Cartes de ce fascicule</div>
                </div>
                <Icon name="chevronR" size={16} color={A.textDim} />
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

function nodesAttempts(attempts: { module_id: string }[], modId: string): number {
  return attempts.filter(a => a.module_id === modId).length
}
