'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A, PALETTE, RADIUS, SHADOW, sp, monoStyle, displayStyle, typeStyle } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import {
  TOTAL_QUESTIONS, DURATION_SECONDS, COOLDOWN_DAYS,
  pickMockQuestions, canStartMock, nextMockAvailableAt,
} from '@/lib/mock-exam'

type PastSession = {
  id: string
  started_at: string
  completed_at: string | null
  is_completed: boolean
  score_correct: number
  total_questions: number
}

function Skel({ h }: { h: number }) {
  return <div style={{
    height: h, borderRadius: 14,
    background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
  }} />
}

export default function MockExamLobbyPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [pastSessions, setPastSessions] = useState<PastSession[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [inProgressId, setInProgressId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const supaAny = supabase as any
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      supaAny.from('mock_exam_sessions')
        .select('id,started_at,completed_at,is_completed,score_correct,total_questions')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(10)
        .then(({ data }: any) => {
          const rows = (data ?? []) as PastSession[]
          setPastSessions(rows)
          const ongoing = rows.find(r => !r.is_completed)
          if (ongoing) setInProgressId(ongoing.id)
          setLoading(false)
        })
    })
  }, [router])

  const lastCompleted = pastSessions.find(s => s.is_completed)
  const canStart = canStartMock(lastCompleted?.completed_at ?? null)
  const nextAvailable = nextMockAvailableAt(lastCompleted?.completed_at ?? null)

  async function start() {
    if (!userId || starting) return
    setStarting(true)
    const supabase = createClient()
    const supaAny = supabase as any

    // Fetch pool + SM-2 state pour exclure leeches
    const [{ data: questions }, sm2Res] = await Promise.all([
      supabase.from('quiz_questions').select('id,module_id').eq('user_id', userId),
      supaAny.from('quiz_question_progress').select('question_id,is_leech,is_suspended').eq('user_id', userId),
    ])

    const ids = pickMockQuestions(
      (questions ?? []) as { id: string; module_id: string }[],
      ((sm2Res as any).data ?? []) as { question_id: string; is_leech: boolean; is_suspended: boolean }[],
    )

    if (ids.length === 0) {
      alert('Pas assez de questions pour une épreuve blanche. Ajoute des cours puis génère des quiz.')
      setStarting(false)
      return
    }

    const { data: session, error } = await supaAny.from('mock_exam_sessions').insert({
      user_id: userId,
      duration_seconds: DURATION_SECONDS,
      total_questions: ids.length,
      question_ids: ids,
      answers: {},
    }).select('id').single()

    if (error || !session) {
      alert('Erreur lors du démarrage de l\'épreuve.')
      setStarting(false)
      return
    }
    router.push(`/mock-exam/run/${session.id}`)
  }

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 100 }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Header */}
      <div style={{ padding: `${sp(12)}px ${sp(5)}px 0`, display: 'flex', alignItems: 'center', gap: sp(2) }}>
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Retour"
          style={{
            width: 36, height: 36, borderRadius: 12, background: PALETTE.surface,
            border: `1px solid ${PALETTE.rule}`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer',
          }}>
          <Icon name="chevronL" size={16} color={PALETTE.ink} strokeWidth={2.2} />
        </button>
        <div>
          <div style={{
            ...monoStyle('xs', 'med', PALETTE.brand),
            textTransform: 'uppercase', letterSpacing: 1.4,
          }}>
            CNQAOS
          </div>
          <div style={displayStyle('2xl', 'bold')}>Épreuve blanche</div>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ padding: `${sp(4)}px ${sp(5)}px 0` }}>
        <div style={{
          background: `linear-gradient(135deg, ${PALETTE.brand} 0%, ${PALETTE.brandDeep} 100%)`,
          borderRadius: RADIUS.xl, padding: '24px 22px', color: '#fff',
          boxShadow: `0 10px 30px ${PALETTE.brandDeep}55`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -30, top: -30,
            width: 160, height: 160, opacity: 0.5,
            fontSize: 140, lineHeight: 1, transform: 'rotate(-10deg)',
          }}>⏱</div>
          <div style={{
            ...monoStyle('xs', 'med', 'rgba(255,255,255,0.7)'),
            textTransform: 'uppercase', letterSpacing: 1.4,
          }}>
            Conditions réelles
          </div>
          <div style={{ ...displayStyle('3xl', 'bold', '#fff'), marginTop: sp(1), lineHeight: 1.05 }}>
            {TOTAL_QUESTIONS} questions<br />en {DURATION_SECONDS / 60} min
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
            marginTop: sp(2), maxWidth: '70%', lineHeight: 1.4,
          }}>
            Tirage pondéré par bloc · pas de retour en arrière · score final par module
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: `${sp(4)}px ${sp(5)}px 0` }}>
        {loading ? (
          <Skel h={64} />
        ) : inProgressId ? (
          <Link href={`/mock-exam/run/${inProgressId}`} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '18px 22px', borderRadius: 16,
              background: PALETTE.amberSoft, border: `1px solid ${PALETTE.amber}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: PALETTE.amber, letterSpacing: 0.4 }}>
                  EN COURS
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: PALETTE.ink, marginTop: 2 }}>
                  Reprendre ton épreuve
                </div>
              </div>
              <Icon name="chevronR" size={20} color={PALETTE.amber} strokeWidth={2.4} />
            </div>
          </Link>
        ) : canStart ? (
          <button
            onClick={start}
            disabled={starting}
            style={{
              width: '100%', height: 60, borderRadius: 16, border: 'none',
              background: starting ? PALETTE.inkDim : PALETTE.brand,
              color: '#fff', fontSize: 17, fontWeight: 900, letterSpacing: -0.2,
              fontFamily: A.font, cursor: starting ? 'wait' : 'pointer',
              boxShadow: `0 10px 24px -6px ${PALETTE.brand}77`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
            {starting ? 'Préparation…' : (
              <>Démarrer l'épreuve <Icon name="arrowR" size={18} color="#fff" strokeWidth={2.4} /></>
            )}
          </button>
        ) : (
          <div style={{
            padding: '18px 22px', borderRadius: 16,
            background: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.rule}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: PALETTE.inkMute, letterSpacing: 0.4 }}>
              PROCHAINE ÉPREUVE
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: PALETTE.ink, marginTop: 4 }}>
              {nextAvailable?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ fontSize: 12, color: PALETTE.inkMute, marginTop: 4 }}>
              1 épreuve par semaine pour préserver son sens
            </div>
          </div>
        )}
      </div>

      {/* Règles */}
      <div style={{ padding: `${sp(5)}px ${sp(5)}px 0` }}>
        <div style={{ ...monoStyle('xs', 'med', PALETTE.inkMute), textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: sp(2) }}>
          Règles
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp(2) }}>
          {[
            { icon: '⏱', label: `${DURATION_SECONDS / 60} minutes chrono — décompte visible` },
            { icon: '🚫', label: 'Pas de retour en arrière sur les questions' },
            { icon: '📚', label: 'Tirage pondéré par bloc CNQAOS' },
            { icon: '🔁', label: `1 épreuve tous les ${COOLDOWN_DAYS} jours` },
            { icon: '📊', label: 'Correction détaillée à la fin' },
          ].map(r => (
            <div key={r.label} style={{
              display: 'flex', alignItems: 'center', gap: sp(2),
              padding: sp(3), background: PALETTE.surface,
              border: `1px solid ${PALETTE.rule}`, borderRadius: RADIUS.md,
            }}>
              <div style={{ fontSize: 22 }}>{r.icon}</div>
              <div style={typeStyle('sm', 'med')}>{r.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Historique */}
      {!loading && pastSessions.filter(s => s.is_completed).length > 0 && (
        <div style={{ padding: `${sp(5)}px ${sp(5)}px 0` }}>
          <div style={{ ...monoStyle('xs', 'med', PALETTE.inkMute), textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: sp(2) }}>
            Historique
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp(2) }}>
            {pastSessions.filter(s => s.is_completed).slice(0, 5).map(s => {
              const pct = s.total_questions > 0 ? Math.round((s.score_correct / s.total_questions) * 100) : 0
              const color = pct >= 70 ? PALETTE.green : pct >= 50 ? PALETTE.brand : PALETTE.amber
              return (
                <Link key={s.id} href={`/mock-exam/result/${s.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: sp(3), background: PALETTE.surface,
                    border: `1px solid ${PALETTE.rule}`, borderRadius: RADIUS.md,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: PALETTE.ink }}>
                        {new Date(s.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 11, color: PALETTE.inkMute, marginTop: 2 }}>
                        {s.score_correct}/{s.total_questions} questions
                      </div>
                    </div>
                    <div style={{
                      fontSize: 20, fontWeight: 900, color, letterSpacing: -0.5,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {pct}%
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
