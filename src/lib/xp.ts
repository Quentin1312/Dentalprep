// ─────────────────────────────────────────────────────────────────────────────
// XP & niveaux — DentalPrep
//
// XP contextuel (anti-farm) :
//   - Première bonne réponse à une question : +15 (vrai apprentissage)
//   - 2ème-3ème bonne réponse à la même Q   : +5  (entretien)
//   - 4ème+ bonne réponse à la même Q       : +2  (over-learning, anti-farm)
//   - Mauvaise réponse                      : +2  (effort récompensé)
//   - Bonus combo : +5 tous les 3 corrects consécutifs (chronologiquement)
//
// IMPORTANT : pour calculer correctement il faut que les attempts soient passés
// dans l'ordre chronologique. AppContext garantit ce tri.
// ─────────────────────────────────────────────────────────────────────────────

// Baseline values — utilisées par QuizSummary comme estimation in-session
// (la valeur réelle se recalcule sur le dashboard via computeXP).
export const XP_PER_CORRECT = 10
export const XP_PER_WRONG   = 2

const XP_FIRST_CORRECT      = 15
const XP_REVIEW_CORRECT     = 5     // 2ème-3ème bonne réponse à la même Q
const XP_OVERLEARN_CORRECT  = 2     // 4ème+ bonne réponse
const XP_WRONG              = 2
const XP_COMBO_BONUS        = 5
const COMBO_EVERY_N         = 3

// XP thresholds to reach level N (index = level-1). 10 niveaux désormais.
export const LEVEL_THRESHOLDS = [
  0,      // L1
  100,    // L2
  300,    // L3
  700,    // L4
  1500,   // L5 (ancien cap = "Maître")
  3000,   // L6
  5500,   // L7
  9500,   // L8
  16000,  // L9
  25000,  // L10
]

export const LEVEL_NAMES = [
  'Débutant',     // L1
  'Apprenti',     // L2
  'Révisant',     // L3
  'Avancé',       // L4
  'Maître',       // L5
  'Praticien',    // L6
  'Expert',       // L7
  'Spécialiste',  // L8
  'Mentor',       // L9
  'Légende',      // L10
]

export const LEVEL_COLORS = [
  '#94A3B8',  // L1 — gris
  '#3B82F6',  // L2 — bleu
  '#8B5CF6',  // L3 — violet
  '#F59E0B',  // L4 — ambre
  '#FFD84A',  // L5 — or (cap historique)
  '#FB923C',  // L6 — orange
  '#EF4444',  // L7 — rouge
  '#EC4899',  // L8 — rose
  '#A855F7',  // L9 — violet foncé
  '#06B6D4',  // L10 — cyan (légendaire)
]

type Attempt = {
  is_correct: boolean
  question_id?: string
}

/**
 * Calcule l'XP total à partir de la liste des tentatives.
 * Les attempts doivent être passés dans l'ordre chronologique (asc).
 *
 * Si tous les attempts ont un question_id → applique le scoring contextuel.
 * Sinon (back-compat) → fallback flat +10/+2.
 */
export function computeXP(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0

  // Fallback flat si on n'a pas les question_id (ancien code, tests, etc.)
  const hasIds = attempts.every(a => !!a.question_id)
  if (!hasIds) {
    return attempts.reduce((s, a) => s + (a.is_correct ? XP_PER_CORRECT : XP_PER_WRONG), 0)
  }

  let total = 0
  let streak = 0                                    // bonnes réponses consécutives
  const correctCount = new Map<string, number>()    // nb de bonnes par question

  for (const a of attempts) {
    if (a.is_correct) {
      const prevCorrect = correctCount.get(a.question_id!) ?? 0
      if (prevCorrect === 0)        total += XP_FIRST_CORRECT
      else if (prevCorrect < 3)     total += XP_REVIEW_CORRECT
      else                          total += XP_OVERLEARN_CORRECT
      correctCount.set(a.question_id!, prevCorrect + 1)
      streak += 1
      if (streak > 0 && streak % COMBO_EVERY_N === 0) {
        total += XP_COMBO_BONUS
      }
    } else {
      total += XP_WRONG
      streak = 0
    }
  }
  return total
}

export function xpToLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function xpProgress(xp: number): {
  level: number; name: string; color: string
  levelStart: number; levelEnd: number; pct: number
} {
  const level    = xpToLevel(xp)
  const levelStart = LEVEL_THRESHOLDS[level - 1]
  const levelEnd   = level < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[level] : levelStart
  const pct = level >= LEVEL_THRESHOLDS.length
    ? 100
    : Math.round(((xp - levelStart) / (levelEnd - levelStart)) * 100)
  return { level, name: LEVEL_NAMES[level - 1], color: LEVEL_COLORS[level - 1], levelStart, levelEnd, pct }
}
