import { computeXP, xpToLevel } from './xp'

export type BadgeId =
  | 'first_answer'
  | 'ten_questions'
  | 'centurion'
  | 'expert'
  | 'sharp_shooter'
  | 'week_streak'
  | 'month_streak'
  | 'explorer'
  | 'all_modules'
  | 'level3'
  | 'level5'
  | 'module_master'

export type Badge = {
  id: BadgeId
  emoji: string
  name: string
  desc: string
  unlocked: boolean
}

type Attempt = { module_id: string; is_correct: boolean; question_id?: string }

export function computeBadges(
  attempts: Attempt[],
  streak: number,
): Badge[] {
  const total = attempts.length
  const correct = attempts.filter(a => a.is_correct).length
  const accuracy = total > 0 ? correct / total : 0
  const xp = computeXP(attempts)
  const level = xpToLevel(xp)
  const modules = new Set(attempts.map(a => a.module_id))

  // Per-module accuracy
  const modStats: Record<string, { ok: number; total: number }> = {}
  for (const a of attempts) {
    if (!modStats[a.module_id]) modStats[a.module_id] = { ok: 0, total: 0 }
    modStats[a.module_id].ok += a.is_correct ? 1 : 0
    modStats[a.module_id].total++
  }
  const hasMasterModule = Object.values(modStats).some(
    s => s.total >= 10 && s.ok / s.total >= 0.8
  )

  return [
    {
      id: 'first_answer',
      emoji: '🐣',
      name: 'Premier pas',
      desc: 'Répondre à ta première question',
      unlocked: total >= 1,
    },
    {
      id: 'ten_questions',
      emoji: '🚀',
      name: 'Décollage',
      desc: '10 questions répondues',
      unlocked: total >= 10,
    },
    {
      id: 'centurion',
      emoji: '💯',
      name: 'Centurion',
      desc: '100 questions répondues',
      unlocked: total >= 100,
    },
    {
      id: 'expert',
      emoji: '⚡',
      name: 'Expert',
      desc: '500 questions répondues',
      unlocked: total >= 500,
    },
    {
      id: 'sharp_shooter',
      emoji: '🎯',
      name: "Tireur d'élite",
      desc: '90%+ précision (≥20 questions)',
      unlocked: total >= 20 && accuracy >= 0.9,
    },
    {
      id: 'week_streak',
      emoji: '🔥',
      name: 'Semaine de feu',
      desc: '7 jours de streak',
      unlocked: streak >= 7,
    },
    {
      id: 'month_streak',
      emoji: '👑',
      name: 'Invaincu',
      desc: '30 jours de streak',
      unlocked: streak >= 30,
    },
    {
      id: 'explorer',
      emoji: '🗺️',
      name: 'Explorateur',
      desc: 'Réviser sur 3 modules différents',
      unlocked: modules.size >= 3,
    },
    {
      id: 'all_modules',
      emoji: '🌟',
      name: 'Polymorphe',
      desc: '5 modules différents révisés',
      unlocked: modules.size >= 5,
    },
    {
      id: 'level3',
      emoji: '⭐',
      name: 'En progression',
      desc: 'Atteindre le niveau 3',
      unlocked: level >= 3,
    },
    {
      id: 'level5',
      emoji: '🏆',
      name: 'Maître',
      desc: 'Atteindre le niveau 5',
      unlocked: level >= 5,
    },
    {
      id: 'module_master',
      emoji: '🦷',
      name: 'Module maîtrisé',
      desc: '80%+ sur un module (≥10 questions)',
      unlocked: hasMasterModule,
    },
  ]
}
