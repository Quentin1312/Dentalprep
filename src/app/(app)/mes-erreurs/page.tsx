'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import QuizClient from '@/app/(app)/quiz/[moduleId]/QuizClient'
import type { PetType } from '@/components/pet/PetCompanion'
import { MODULES } from '@/lib/modules'
import type { ModuleId } from '@/types/database'
import { useAppData } from '@/lib/app-context'
import { computeXP, xpToLevel } from '@/lib/xp'

type Question = {
  id: string; question: string; choices: unknown
  correct_index: number; explanation: string
  module_id: string; page_image_url?: string | null
}
type ModuleStat = { id: string; label: string; count: number; avgFail: number }

function Skel() {
  return <div style={{ height: 76, borderRadius: 16, background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

export default function MesErreursPage() {
  const router = useRouter()
  const { data: appData } = useAppData()
  const [phase, setPhase] = useState<'loading' | 'list' | 'quiz'>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [attemptStats, setAttemptStats] = useState<Map<string, { ok: number; total: number }>>(new Map())
  const [moduleStats, setModuleStats] = useState<ModuleStat[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [petType, setPetType] = useState<PetType>('cat')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)

      const [attemptsRes, profileRes] = await Promise.all([
        supabase.from('quiz_attempts').select('question_id,is_correct,module_id').eq('user_id', user.id),
        supabase.from('profiles').select('pet_type').eq('id', user.id).single(),
      ])

      if (profileRes.data?.pet_type) setPetType(profileRes.data.pet_type as PetType)

      const atts = (attemptsRes.data ?? []) as { question_id: string; is_correct: boolean; module_id: string }[]

      // Compute per-question stats
      const statsMap = new Map<string, { ok: number; total: number; module_id: string }>()
      for (const a of atts) {
        const s = statsMap.get(a.question_id) ?? { ok: 0, total: 0, module_id: a.module_id }
        statsMap.set(a.question_id, { ok: s.ok + (a.is_correct ? 1 : 0), total: s.total + 1, module_id: a.module_id })
      }

      // Keep only questions with at least 1 wrong, sorted by fail rate desc
      const errorEntries = Array.from(statsMap.entries())
        .filter(([, s]) => s.ok < s.total)
        .sort((a, b) => {
          const fA = (a[1].total - a[1].ok) / a[1].total
          const fB = (b[1].total - b[1].ok) / b[1].total
          return fB - fA
        })

      if (errorEntries.length === 0) { setPhase('list'); return }

      const errorIds = errorEntries.slice(0, 50).map(([id]) => id)

      const { data: qs } = await supabase
        .from('quiz_questions')
        .select('*')
        .in('id', errorIds)

      if (!qs?.length) { setPhase('list'); return }

      // Preserve fail-rate sort order
      const qMap = new Map(qs.map(q => [q.id, q]))
      const sorted = errorIds.map(id => qMap.get(id)).filter(Boolean) as Question[]

      // Build attempt stats for QuizClient
      const attMap = new Map<string, { ok: number; total: number }>()
      for (const [id, s] of statsMap.entries()) attMap.set(id, { ok: s.ok, total: s.total })

      // Module breakdown
      const mData: Record<string, { count: number; failSum: number }> = {}
      for (const q of sorted) {
        const s = statsMap.get(q.id)
        if (!s) continue
        if (!mData[q.module_id]) mData[q.module_id] = { count: 0, failSum: 0 }
        mData[q.module_id].count++
        mData[q.module_id].failSum += (s.total - s.ok) / s.total
      }

      const mStats: ModuleStat[] = Object.entries(mData)
        .map(([id, v]) => ({
          id,
          label: MODULES.find(m => m.id === id)?.label ?? id,
          count: v.count,
          avgFail: Math.round((v.failSum / v.count) * 100),
        }))
        .sort((a, b) => b.avgFail - a.avgFail)

      setQuestions(sorted)
      setAttemptStats(attMap)
      setModuleStats(mStats)
      setPhase('list')
    })
  }, [router])

  // ── QUIZ phase ────────────────────────────────────────────────
  if (phase === 'quiz' && questions.length > 0) {
    const globalXp = computeXP(appData?.attempts ?? []) + (appData?.flashXpBonus ?? 0)
    const petLevel = xpToLevel(globalXp)
    return (
      <QuizClient
        questions={questions}
        moduleId={(questions[0]?.module_id ?? 'M1') as ModuleId}
        userId={userId!}
        mode="smart"
        attemptStats={attemptStats}
        petType={petType}
        level={petLevel}
        backHref="/mes-erreurs"
        headerLabel="Erreurs"
      />
    )
  }

  // ── LIST / LOADING phase ──────────────────────────────────────
  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      <div style={{ padding: '62px 20px 0' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: A.font, padding: 0, marginBottom: 16 }}
        >
          <Icon name="chevronL" size={14} color={A.textMuted} /> Retour
        </button>
        <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Révision ciblée</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Mes erreurs</div>
        <div style={{ fontSize: 13, color: A.textMuted, marginTop: 4 }}>Questions ratées · triées du plus difficile au plus facile</div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {phase === 'loading' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 130, borderRadius: 20, background: '#F5C6C6', marginBottom: 4 }} />
            <Skel /><Skel /><Skel />
          </div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: A.text, marginBottom: 8 }}>Zéro erreur !</div>
            <div style={{ fontSize: 14, color: A.textMuted, lineHeight: 1.5 }}>
              Tu as répondu correctement à tout.{'\n'}Continue les quiz pour enrichir tes statistiques.
            </div>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              borderRadius: 20, padding: '20px 22px', color: '#fff',
              boxShadow: '0 10px 28px rgba(220,38,38,0.3)',
              position: 'relative', overflow: 'hidden', marginBottom: 14,
            }}>
              <div style={{ position: 'absolute', right: -24, top: -24, width: 130, height: 130, border: '18px solid rgba(255,255,255,0.07)', borderRadius: '50%' }} />
              <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="target" size={12} color="#fff" /> Questions à retravailler
              </div>
              <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2, lineHeight: 1, marginTop: 4 }}>
                {questions.length}
              </div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
                sur {new Set(questions.map(q => q.module_id)).size} module{new Set(questions.map(q => q.module_id)).size > 1 ? 's' : ''} · max 50 affichées
              </div>
            </div>

            {/* Module breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {moduleStats.map(m => {
                const isHigh = m.avgFail >= 70
                const color = isHigh ? A.red : A.amber
                const softBg = isHigh ? '#FEF2F2' : A.amberSoft
                return (
                  <div key={m.id} style={{ background: A.surface, borderRadius: 16, padding: '14px 16px', border: `0.5px solid ${A.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: softBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color }}>{m.id}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: A.textMuted, marginTop: 1 }}>{m.count} question{m.count > 1 ? 's' : ''} à revoir</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color, flexShrink: 0 }}>{m.avgFail}%</div>
                    </div>
                    <div style={{ height: 5, background: '#F1F3F7', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${m.avgFail}%`,
                        background: `linear-gradient(90deg, ${color}, ${isHigh ? '#F87171' : '#FCD34D'})`,
                        borderRadius: 3, transition: 'width 0.7s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      {phase === 'list' && questions.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <button
            onClick={() => setPhase('quiz')}
            style={{
              width: '100%', height: 56, borderRadius: 16, border: 'none',
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: A.font,
              cursor: 'pointer', boxShadow: '0 6px 18px rgba(220,38,38,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <Icon name="target" size={20} color="#fff" />
            Réviser mes {questions.length} erreurs
          </button>
          <div style={{ fontSize: 12, color: A.textMuted, textAlign: 'center', marginTop: 10 }}>
            Plus le taux d&apos;échec est élevé, plus la question arrive tôt
          </div>
        </div>
      )}
    </div>
  )
}
