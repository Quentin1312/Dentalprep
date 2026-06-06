/**
 * Épreuve blanche CNQAOS
 *
 * Pondération par bloc (estimation officieuse mais cohérente avec la grille
 * du concours) — sur 50 questions :
 *   - M1 (Accueil/communication)   → 12
 *   - M2 (Assistance clinique)     → 11
 *   - M3 (Urgences médicales)      →  4
 *   - M4 (Hygiène/asepsie)         →  8
 *   - M5 (Prévention des risques)  →  4
 *   - M6 (Gestion administrative)  → 11
 *
 * Si un module n'a pas assez de questions disponibles, on rebalance vers les
 * autres modules pour atteindre TOTAL_QUESTIONS.
 */

import type { ModuleId } from '@/types/database'

export const TOTAL_QUESTIONS = 50
export const DURATION_SECONDS = 60 * 60          // 60 min
export const COOLDOWN_DAYS = 7                    // 1 mock par semaine

export const MOCK_DISTRIBUTION: Record<ModuleId, number> = {
  M1: 12, M2: 11, M3: 4, M4: 8, M5: 4, M6: 11,
}

type QuestionLike = { id: string; module_id: string }
type Sm2Like = { question_id: string; is_leech?: boolean; is_suspended?: boolean }

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Sélectionne les questions de l'épreuve.
 * - Exclut leeches et suspendues.
 * - Respecte la pondération MOCK_DISTRIBUTION.
 * - Si un module manque de questions, rebalance vers les autres.
 */
export function pickMockQuestions(
  pool: QuestionLike[],
  sm2: Sm2Like[],
  target = TOTAL_QUESTIONS,
): string[] {
  const excluded = new Set<string>()
  for (const s of sm2) {
    if (s.is_leech || s.is_suspended) excluded.add(s.question_id)
  }
  const eligible = pool.filter(q => !excluded.has(q.id))

  const byModule: Record<string, QuestionLike[]> = {}
  for (const q of eligible) {
    if (!byModule[q.module_id]) byModule[q.module_id] = []
    byModule[q.module_id].push(q)
  }

  const picked: string[] = []
  const leftover: string[] = []

  // 1er passage : respecter la pondération
  for (const [mod, target] of Object.entries(MOCK_DISTRIBUTION)) {
    const available = shuffle(byModule[mod] ?? [])
    const take = Math.min(target, available.length)
    for (let i = 0; i < take; i++) picked.push(available[i].id)
    // surplus reversé pour rebalance
    for (let i = take; i < available.length; i++) leftover.push(available[i].id)
  }

  // 2e passage : compléter avec le surplus si on n'a pas atteint la cible
  const need = target - picked.length
  if (need > 0) {
    const extra = shuffle(leftover).slice(0, need)
    picked.push(...extra)
  }

  return shuffle(picked).slice(0, target)
}

/**
 * Calcule la prochaine date à laquelle l'utilisateur pourra faire une mock.
 * Renvoie null s'il peut en faire une maintenant.
 */
export function nextMockAvailableAt(lastCompletedAt: string | null): Date | null {
  if (!lastCompletedAt) return null
  const last = new Date(lastCompletedAt).getTime()
  if (isNaN(last)) return null
  const next = last + COOLDOWN_DAYS * 86_400_000
  return Date.now() >= next ? null : new Date(next)
}

/**
 * Vrai si l'utilisateur peut démarrer une nouvelle mock.
 */
export function canStartMock(lastCompletedAt: string | null): boolean {
  return nextMockAvailableAt(lastCompletedAt) === null
}

/**
 * Score breakdown par module.
 */
export function scoreByModule(
  questionIds: string[],
  answers: Record<string, number>,
  questionMap: Map<string, { module_id: string; correct_index: number }>,
): Record<string, { correct: number; total: number; pct: number }> {
  const stats: Record<string, { correct: number; total: number }> = {}
  for (const qid of questionIds) {
    const q = questionMap.get(qid)
    if (!q) continue
    if (!stats[q.module_id]) stats[q.module_id] = { correct: 0, total: 0 }
    stats[q.module_id].total++
    if (answers[qid] === q.correct_index) stats[q.module_id].correct++
  }
  const result: Record<string, { correct: number; total: number; pct: number }> = {}
  for (const [mod, s] of Object.entries(stats)) {
    result[mod] = { ...s, pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0 }
  }
  return result
}
