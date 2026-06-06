/**
 * Défis hebdomadaires.
 *
 * 3 défis générés au lundi 00:00 (reset chaque semaine), choisis de manière
 * déterministe à partir de la semaine ISO + de la phase de l'élève.
 *
 * Pas de leaderboard — on joue contre soi-même (concours = anxiogène par nature,
 * on évite d'ajouter de la comparaison sociale).
 */

import type { StudyPhase } from './study-plan'

export type ChallengeId =
  | 'questions_100'
  | 'days_5'
  | 'flashcards_20'
  | 'practice_3'
  | 'ccam_drill_3'
  | 'mock_exam_1'
  | 'no_wrong_50'      // 50 questions consécutives sans 2 erreurs d'affilée
  | 'module_focus'     // 50 questions sur un module précis

export type Challenge = {
  id: ChallengeId
  icon: string         // nom d'icône (cf src/components/ui/Icon.tsx)
  title: string
  detail: string
  target: number
  current: number      // calculé runtime
  unit: string         // ex. "questions", "jours"
  accent: string
  done: boolean
}

const CHALLENGE_DEFS: Record<ChallengeId, Omit<Challenge, 'current' | 'done'>> = {
  questions_100: {
    id: 'questions_100', icon: 'target', title: '100 questions',
    detail: 'Réponds à 100 questions cette semaine',
    target: 100, unit: 'questions', accent: '#0A66E0',
  },
  days_5: {
    id: 'days_5', icon: 'flame', title: '5 jours actifs',
    detail: 'Étudie au moins 5 jours différents',
    target: 5, unit: 'jours', accent: '#E11D48',
  },
  flashcards_20: {
    id: 'flashcards_20', icon: 'cards', title: '20 flashcards maîtrisées',
    detail: 'Marque 20 flashcards comme "Je sais"',
    target: 20, unit: 'cartes', accent: '#7C3AED',
  },
  practice_3: {
    id: 'practice_3', icon: 'fileText', title: '3 cas pratiques',
    detail: 'Valide 3 cas pratiques à 100%',
    target: 3, unit: 'cas', accent: '#D97706',
  },
  ccam_drill_3: {
    id: 'ccam_drill_3', icon: 'tooth', title: '3 drills CCAM',
    detail: 'Termine 3 rounds de drill codes CCAM',
    target: 3, unit: 'rounds', accent: '#0D9488',
  },
  mock_exam_1: {
    id: 'mock_exam_1', icon: 'clock', title: 'Une épreuve blanche',
    detail: 'Passe une épreuve blanche cette semaine',
    target: 1, unit: 'épreuve', accent: '#7C3AED',
  },
  no_wrong_50: {
    id: 'no_wrong_50', icon: 'bolt', title: '50 sans erreur',
    detail: 'Réponds à 50 questions avec au moins 80% de réussite',
    target: 50, unit: 'questions', accent: '#FFD84A',
  },
  module_focus: {
    id: 'module_focus', icon: 'bookOpen', title: 'Module focus',
    detail: 'Fais 50 questions sur ton module le plus faible',
    target: 50, unit: 'questions', accent: '#5B21B6',
  },
}

/** Lundi 00:00 (locale) de la semaine en cours. */
export function weekStart(now: Date = new Date()): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  const dayIdx = (d.getDay() + 6) % 7    // 0=L
  d.setDate(d.getDate() - dayIdx)
  return d
}

/** Numéro de semaine ISO (utilisé comme seed déterministe). */
function isoWeekNumber(d: Date): number {
  const t = new Date(d.getTime())
  t.setHours(0, 0, 0, 0)
  // Jeudi de la même semaine → year & week
  t.setDate(t.getDate() + 4 - (t.getDay() || 7))
  const yearStart = new Date(t.getFullYear(), 0, 1)
  return Math.ceil((((t.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
}

/**
 * Choisit 3 défis pour la semaine en cours.
 * - Toujours inclut "questions_100" et "days_5" (les piliers de régularité).
 * - Le 3ème varie selon la phase et la semaine ISO.
 */
function pickChallengeIds(phase: StudyPhase, now: Date = new Date()): ChallengeId[] {
  const week = isoWeekNumber(now)
  const variants: ChallengeId[] =
    phase === 'sprint'
      ? ['mock_exam_1', 'no_wrong_50', 'module_focus', 'practice_3']
      : phase === 'consolidation'
        ? ['practice_3', 'ccam_drill_3', 'flashcards_20', 'mock_exam_1']
        : ['flashcards_20', 'ccam_drill_3', 'practice_3']
  const variant = variants[week % variants.length]
  return ['questions_100', 'days_5', variant]
}

type Input = {
  phase: StudyPhase
  attemptsThisWeek: number
  correctThisWeek: number
  activeDaysThisWeek: number
  flashcardsMasteredThisWeek: number
  practiceCompletedThisWeek: number
  ccamRoundsThisWeek: number
  mockCompletedThisWeek: number
  moduleFocusAttemptsThisWeek: number
  now?: Date
}

export function computeChallenges(i: Input): Challenge[] {
  const ids = pickChallengeIds(i.phase, i.now)
  return ids.map(id => {
    const def = CHALLENGE_DEFS[id]
    let current = 0
    switch (id) {
      case 'questions_100':  current = i.attemptsThisWeek; break
      case 'days_5':         current = i.activeDaysThisWeek; break
      case 'flashcards_20':  current = i.flashcardsMasteredThisWeek; break
      case 'practice_3':     current = i.practiceCompletedThisWeek; break
      case 'ccam_drill_3':   current = i.ccamRoundsThisWeek; break
      case 'mock_exam_1':    current = i.mockCompletedThisWeek; break
      case 'no_wrong_50':    {
        // accuracy threshold-based : current = nb de questions si >= 80% de réussite, sinon proportionnel
        const acc = i.attemptsThisWeek > 0 ? i.correctThisWeek / i.attemptsThisWeek : 0
        current = acc >= 0.8 ? i.attemptsThisWeek : Math.floor(i.attemptsThisWeek * (acc / 0.8))
        break
      }
      case 'module_focus':   current = i.moduleFocusAttemptsThisWeek; break
    }
    const capped = Math.min(current, def.target)
    return { ...def, current: capped, done: capped >= def.target }
  })
}
