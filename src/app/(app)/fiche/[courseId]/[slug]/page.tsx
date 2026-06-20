'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppData } from '@/lib/app-context'
import FicheRenderer, { type FicheContent } from '@/components/lesson/FicheRenderer'
import { PALETTE, TYPE, WEIGHT, FONT_DISPLAY, RADIUS } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

type Fiche = {
  id: string
  course_id: string
  slug: string
  n: number
  title: string
  emoji: string | null
  subtitle: string | null
  content: FicheContent
}

export default function FichePage() {
  const router = useRouter()
  const params = useParams<{ courseId: string; slug: string }>()
  const sp = useSearchParams()
  const modId = sp.get('modId') ?? 'M2'
  const { data } = useAppData()
  const [fiche, setFiche] = useState<Fiche | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient() as any
    supabase.from('lesson_sheets')
      .select('*')
      .eq('course_id', params.courseId)
      .eq('slug', params.slug)
      .maybeSingle()
      .then(({ data: f }: any) => {
        if (f) setFiche(f as Fiche)
        setLoading(false)
      })
  }, [params.courseId, params.slug])

  // Compte des questions liées à cette fiche
  const questionCount = (data?.questions ?? []).filter(
    q => q.course_id === params.courseId && q.module_id === modId && q.lesson_slug === params.slug
  ).length

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: PALETTE.inkMute }}>Chargement…</div>
  }
  if (!fiche) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: PALETTE.red }}>Fiche introuvable.</div>
        <Link href="/library" style={{ color: PALETTE.brand, marginTop: 12, display: 'inline-block' }}>← Retour</Link>
      </div>
    )
  }

  const quizHref = `/quiz/${modId}?courseId=${params.courseId}&slug=${params.slug}`

  return (
    <div style={{ background: PALETTE.bg, minHeight: '100vh', paddingBottom: 100 }}>
      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${PALETTE.rule}`,
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={() => router.back()}
          aria-label="Retour"
          style={{
            background: 'transparent', border: 'none', padding: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: PALETTE.ink,
          }}
        >
          <Icon name="chevronL" size={20} color={PALETTE.ink} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: TYPE.xs.size, color: PALETTE.inkMute, fontWeight: WEIGHT.med, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            Chapitre {fiche.n}
          </div>
          <div style={{
            fontSize: TYPE.base.size, fontWeight: WEIGHT.bold, color: PALETTE.ink,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: -0.2,
          }}>{fiche.title}</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{
        margin: '20px 18px 0',
        background: `linear-gradient(135deg, ${PALETTE.brand} 0%, ${PALETTE.brandDeep} 100%)`,
        borderRadius: RADIUS.lg,
        padding: '24px 22px',
        color: '#fff',
        position: 'relative', overflow: 'hidden',
      }}>
        {fiche.emoji && (
          <div style={{
            position: 'absolute', top: 16, right: 18,
            fontSize: 42, opacity: 0.95,
          }}>{fiche.emoji}</div>
        )}
        <div style={{
          fontSize: TYPE.xs.size, color: 'rgba(255,255,255,0.7)',
          fontWeight: WEIGHT.med, textTransform: 'uppercase', letterSpacing: 0.6,
          marginBottom: 8,
        }}>Fiche de révision</div>
        <h1 style={{
          margin: 0,
          fontFamily: FONT_DISPLAY,
          fontSize: TYPE['2xl'].size, lineHeight: `${TYPE['2xl'].line}px`,
          fontWeight: WEIGHT.bold, letterSpacing: TYPE['2xl'].track,
          paddingRight: fiche.emoji ? 48 : 0,
        }}>{fiche.title}</h1>
        {fiche.subtitle && (
          <p style={{
            margin: '8px 0 0',
            fontSize: TYPE.sm.size, lineHeight: `${TYPE.sm.line + 2}px`,
            color: 'rgba(255,255,255,0.82)',
          }}>{fiche.subtitle}</p>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '24px 18px 0' }}>
        <FicheRenderer content={fiche.content} />
      </div>

      {/* CTA quiz — fixé en bas */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${PALETTE.rule}`,
        padding: '12px 18px 18px',
        zIndex: 20,
      }}>
        {questionCount > 0 ? (
          <Link href={quizHref} style={{ textDecoration: 'none' }}>
            <div style={{
              background: `linear-gradient(135deg, ${PALETTE.brand} 0%, ${PALETTE.brandDeep} 100%)`,
              borderRadius: RADIUS.lg,
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: `0 8px 22px -8px ${PALETTE.brand}80`,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="cards" size={20} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: TYPE.base.size, fontWeight: WEIGHT.bold, color: '#fff',
                  letterSpacing: -0.2,
                }}>Faire le quiz</div>
                <div style={{ fontSize: TYPE.xs.size, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>
                  Flashcards puis questions · {questionCount} questions
                </div>
              </div>
              <Icon name="chevronR" size={16} color="rgba(255,255,255,0.8)" />
            </div>
          </Link>
        ) : (
          <div style={{
            background: PALETTE.surfaceAlt,
            border: `1px dashed ${PALETTE.rule}`,
            borderRadius: RADIUS.md,
            padding: '14px 18px',
            textAlign: 'center',
            fontSize: TYPE.sm.size, color: PALETTE.inkMute,
          }}>Pas de quiz pour ce chapitre pour le moment</div>
        )}
      </div>
    </div>
  )
}
