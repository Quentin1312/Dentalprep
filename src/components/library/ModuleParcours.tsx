'use client'

import Link from 'next/link'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { Fascicule } from '@/lib/modules'

type Course = { id: string; title: string; page_count?: number | null }
type Progress = { total: number; attempted: number }

interface Props {
  moduleId: string
  fascicules: Fascicule[]
  courses: Course[]
  courseProgress: Map<string, Progress>
}

function fasciculeN(title: string): number | null {
  const m = title.match(/Fascicule\s+(\d+)/i)
  return m ? parseInt(m[1]) : null
}

// Pattern winding gauche-droite (largeur en px depuis le centre)
const OFFSETS = [0, 56, 70, 56, 0, -56, -70, -56]
const NODE_SIZE = 68
const ROW_H = 164 // hauteur d'une ligne (cercle + label + boutons + espace)
const SVG_W = 280 // largeur du canvas SVG (assez large pour le winding)

export default function ModuleParcours({ moduleId, fascicules, courses, courseProgress }: Props) {
  const items = fascicules.map((f, i) => {
    const course = courses.find(c => fasciculeN(c.title) === f.n)
    // Clé composée "moduleId:courseId" pour isoler la progression par module
    const prog: Progress = course ? (courseProgress.get(`${moduleId}:${course.id}`) ?? { total: 0, attempted: 0 }) : { total: 0, attempted: 0 }
    const totalLessons = prog.total > 0 ? Math.ceil(prog.total / 10) : 0
    const completedLessons = Math.floor(prog.attempted / 10)
    const allDone = totalLessons > 0 && completedLessons >= totalLessons
    const isCurrent = !allDone && !!course && totalLessons > 0
    const nextLesson = Math.min(completedLessons, Math.max(0, totalLessons - 1))
    const xOff = OFFSETS[i % OFFSETS.length]
    return { f, course, prog, totalLessons, completedLessons, allDone, isCurrent, nextLesson, xOff }
  })

  const totalHeight = items.length * ROW_H + 40

  return (
    <div style={{ position: 'relative', width: '100%', height: totalHeight }}>
      {/* SVG layer pour les connecteurs courbes */}
      <svg
        width="100%"
        height={totalHeight}
        viewBox={`-${SVG_W / 2} 0 ${SVG_W} ${totalHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
      >
        {items.map((it, i) => {
          if (i === 0) return null
          const prev = items[i - 1]
          const y1 = (i - 1) * ROW_H + NODE_SIZE / 2 + NODE_SIZE / 2 + 4 // bord bas du cercle précédent
          const y2 = i * ROW_H + NODE_SIZE / 2 - NODE_SIZE / 2 - 4 // bord haut du cercle courant
          const x1 = prev.xOff
          const x2 = it.xOff
          const midY = (y1 + y2) / 2
          // Cubic bezier qui crée une S-curve douce
          const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
          const connectorDone = prev.allDone
          const connectorActive = !connectorDone && (prev.isCurrent || (prev.course && !it.course))
          return (
            <path
              key={`c-${i}`}
              d={d}
              stroke={connectorDone ? '#16A34A' : connectorActive ? A.primary : '#D1D5DB'}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={connectorDone ? undefined : '6 10'}
              opacity={connectorDone ? 1 : 0.7}
            />
          )
        })}
      </svg>

      {/* Layer des nœuds */}
      {items.map((it, i) => {
        const top = i * ROW_H
        return (
          <div
            key={it.f.n}
            style={{
              position: 'absolute',
              top,
              left: '50%',
              transform: `translateX(calc(-50% + ${it.xOff}px))`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 160,
            }}
          >
            {it.course ? (
              <Link
                href={`/quiz/${moduleId}?courseId=${it.course.id}&lesson=${it.nextLesson}`}
                style={{ textDecoration: 'none' }}
              >
                <NodeCircle state={it.allDone ? 'done' : it.isCurrent ? 'current' : 'unstarted'} number={it.f.n} />
              </Link>
            ) : (
              <Link href={`/upload?fascicule=${it.f.n}`} style={{ textDecoration: 'none' }}>
                <NodeCircle state="locked" number={it.f.n} />
              </Link>
            )}

            <div style={{ marginTop: 8, textAlign: 'center', maxWidth: 150 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: A.text, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {it.f.title}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 600, marginTop: 2,
                color: it.allDone ? '#16A34A' : it.isCurrent ? A.primary : '#9CA3AF',
              }}>
                {it.allDone
                  ? '✓ Terminé'
                  : it.course
                    ? (it.totalLessons > 0 ? `${it.completedLessons}/${it.totalLessons}` : '—')
                    : 'À scanner'}
              </div>
            </div>

            {it.course && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <Link
                  href={`/quiz/${moduleId}?courseId=${it.course.id}&lesson=${it.nextLesson}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, background: A.primarySoft, border: `1px solid ${A.primary}22` }}
                >
                  <Icon name="bolt" size={11} color={A.primary} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: A.primary }}>Quiz</span>
                </Link>
                <Link
                  href={`/flashcards/${moduleId}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, background: '#F3E8FF', border: '1px solid #7C3AED22' }}
                >
                  <Icon name="cards" size={11} color="#7C3AED" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#7C3AED' }}>Cartes</span>
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function NodeCircle({ state, number }: { state: 'done' | 'current' | 'unstarted' | 'locked'; number: number }) {
  const size = NODE_SIZE
  // base 3D button effect
  const baseShadow = '0 4px 0 0 rgba(0,0,0,0.08)'

  if (state === 'done') {
    return (
      <div style={{
        width: size, height: size, borderRadius: size / 2,
        background: 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `${baseShadow}, 0 6px 16px rgba(22,163,74,0.35), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.1)`,
        cursor: 'pointer',
        transition: 'transform .15s',
      }}>
        <Icon name="check" size={28} color="#fff" strokeWidth={3} />
      </div>
    )
  }

  if (state === 'current') {
    return (
      <div style={{
        width: size, height: size, borderRadius: size / 2,
        background: `linear-gradient(180deg, ${A.primary} 0%, #0850B8 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 0 5px rgba(10,102,224,0.15), ${baseShadow}, 0 8px 20px rgba(10,102,224,0.4), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.15)`,
        animation: 'parcours-bounce 2.4s ease-in-out infinite',
        cursor: 'pointer',
      }}>
        <Icon name="bolt" size={26} color="#fff" />
      </div>
    )
  }

  if (state === 'unstarted') {
    return (
      <div style={{
        width: size, height: size, borderRadius: size / 2,
        background: 'linear-gradient(180deg, #F9FAFB 0%, #E5E7EB 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `${baseShadow}, inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -3px 0 rgba(0,0,0,0.06)`,
        cursor: 'pointer',
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#9CA3AF' }}>{number}</span>
      </div>
    )
  }

  // locked
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: '#F3F4F6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2.5px dashed #D1D5DB',
      cursor: 'pointer',
    }}>
      <Icon name="camera" size={24} color="#9CA3AF" />
    </div>
  )
}
