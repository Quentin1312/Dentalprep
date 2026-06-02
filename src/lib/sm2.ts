/**
 * Algorithme SM-2 (SuperMemo 2 — celui utilisé par Anki, en version simplifiée).
 *
 * On garde 2 actions utilisateur (vs les 4 de SM-2 classique) :
 *  - "Je sais"  : qualité ~5 (parfait)
 *  - "À revoir" : qualité ~2 (erreur)
 *
 * À partir de l'état précédent (ease_factor, interval_days, reps) on calcule
 * le prochain intervalle et la date de prochaine révision.
 */

export type Sm2State = {
  ease_factor: number      // EF, démarre à 2.5
  interval_days: number    // jours avant la prochaine révision
  reps: number             // nombre de réussites consécutives
  lapses: number           // nombre total d'oublis
}

export const DEFAULT_SM2: Sm2State = {
  ease_factor: 2.5,
  interval_days: 0,
  reps: 0,
  lapses: 0,
}

const MIN_EF = 1.3

export function reviewKnown(prev: Sm2State): Sm2State & { next_review_at: string } {
  // qualité ≈ 5 (parfait)
  // delta EF = +0.1
  const ease_factor = Math.max(MIN_EF, prev.ease_factor + 0.1)
  let interval_days: number
  if (prev.reps === 0)      interval_days = 1
  else if (prev.reps === 1) interval_days = 6
  else                      interval_days = Math.round(prev.interval_days * ease_factor)
  const reps = prev.reps + 1
  const next = new Date()
  next.setDate(next.getDate() + interval_days)
  next.setHours(0, 0, 0, 0)
  return {
    ease_factor,
    interval_days,
    reps,
    lapses: prev.lapses,
    next_review_at: next.toISOString(),
  }
}

export function reviewLapse(prev: Sm2State): Sm2State & { next_review_at: string } {
  // qualité ≈ 2 (erreur) — on reset reps + intervalle 1j
  const ease_factor = Math.max(MIN_EF, prev.ease_factor - 0.2)
  const next = new Date()
  next.setDate(next.getDate() + 1)
  next.setHours(0, 0, 0, 0)
  return {
    ease_factor,
    interval_days: 1,
    reps: 0,
    lapses: prev.lapses + 1,
    next_review_at: next.toISOString(),
  }
}

/** True si la carte est due (next_review_at <= now). */
export function isDue(next_review_at: string | null | undefined): boolean {
  if (!next_review_at) return true   // jamais vue = due
  return new Date(next_review_at).getTime() <= Date.now()
}
