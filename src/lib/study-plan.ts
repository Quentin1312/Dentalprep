/**
 * Plan de révision auto.
 *
 * À partir de l'état actuel de l'élève (XP, modules faibles, flashcards dues,
 * quiz ratés, cas pratiques non validés), compose une liste de 2-4 tâches
 * adaptées à son objectif quotidien.
 */

import type { ModuleId } from '@/types/database'

export type StudyPlanItem = {
  id: string
  icon: string            // nom d'icône (cf src/components/ui/Icon.tsx)
  title: string
  detail: string
  estimatedMin: number
  href: string
  accent: string
  priority: number        // 0 = top
}

type Attempt = { module_id: string; is_correct: boolean; question_id: string }
type ModuleStat = { id: ModuleId; label: string; pct: number; doneQuestions: number; totalQuestions: number }

type Input = {
  daysUntilExam: number | null
  dailyGoalMinutes: number
  flashcardsDueCount: number
  attempts: Attempt[]
  moduleStats: ModuleStat[]
  practiceTodoCount: number     // nb de cas pratiques non validés à 100%
  recentWrongQuestionCount: number  // dernière tentative = fausse
  totalQuestionsCount: number
}

const MODULE_ACCENT: Record<string, string> = {
  M1: '#0A66E0', M2: '#0D9488', M3: '#7C3AED',
  M4: '#E11D48', M5: '#D97706', M6: '#5B21B6',
}

export function buildStudyPlan(i: Input): StudyPlanItem[] {
  const items: StudyPlanItem[] = []

  // 1. Flashcards dues (priorité absolue — la mémoire décroît chaque jour)
  if (i.flashcardsDueCount > 0) {
    const min = Math.max(3, Math.ceil(i.flashcardsDueCount * 0.5))   // ~30s/carte
    items.push({
      id: 'due-cards',
      icon: 'cards',
      title: `${i.flashcardsDueCount} flashcard${i.flashcardsDueCount > 1 ? 's' : ''} à revoir`,
      detail: 'Tes révisions du jour (répétition espacée)',
      estimatedMin: min,
      href: '/library',
      accent: '#0A66E0',
      priority: 0,
    })
  }

  // 2. Quiz ratés à reprendre
  if (i.recentWrongQuestionCount > 0) {
    items.push({
      id: 'wrong-quiz',
      icon: 'refresh',
      title: `Tes ${i.recentWrongQuestionCount} erreurs récentes`,
      detail: 'Refais les questions où tu t\'es trompé',
      estimatedMin: Math.min(15, i.recentWrongQuestionCount),
      href: '/mes-erreurs',
      accent: '#E11D48',
      priority: 1,
    })
  }

  // 3. Module le plus faible (< 60% de précision avec assez de tentatives)
  const weakestModule = i.moduleStats
    .filter(m => m.totalQuestions >= 10 && m.pct < 60)
    .sort((a, b) => a.pct - b.pct)[0]
  if (weakestModule) {
    items.push({
      id: `weak-${weakestModule.id}`,
      icon: 'target',
      title: `${weakestModule.id} — module à renforcer`,
      detail: `${weakestModule.pct}% de précision · "${weakestModule.label}"`,
      estimatedMin: 15,
      href: `/quiz/${weakestModule.id}?mode=smart`,
      accent: MODULE_ACCENT[weakestModule.id] ?? '#0A66E0',
      priority: 2,
    })
  }

  // 4. Cas pratiques en cours / pas faits
  if (i.practiceTodoCount > 0) {
    items.push({
      id: 'practice',
      icon: 'edit',
      title: `${i.practiceTodoCount} cas pratique${i.practiceTodoCount > 1 ? 's' : ''} à faire`,
      detail: 'Coder une feuille de soins CCAM',
      estimatedMin: Math.min(20, i.practiceTodoCount * 4),
      href: '/practice',
      accent: '#D97706',
      priority: 3,
    })
  }

  // 5. Filler : urgence pré-examen (J-30 et moins → push session générale)
  if (i.daysUntilExam !== null && i.daysUntilExam <= 30 && items.length < 2) {
    items.push({
      id: 'general',
      icon: 'sparkle',
      title: 'Quiz tout-modules',
      detail: 'Brassage mélangé pour entretenir',
      estimatedMin: 10,
      href: '/global-quiz',
      accent: '#5B21B6',
      priority: 4,
    })
  }

  // 6. Backup si rien à proposer
  if (items.length === 0) {
    items.push({
      id: 'discover',
      icon: 'bookOpen',
      title: 'Découvre un nouveau fascicule',
      detail: 'Continue ton apprentissage à ton rythme',
      estimatedMin: i.dailyGoalMinutes,
      href: '/library',
      accent: '#0A66E0',
      priority: 5,
    })
  }

  return items.sort((a, b) => a.priority - b.priority).slice(0, 4)
}

export function planTotalMinutes(items: StudyPlanItem[]): number {
  return items.reduce((s, i) => s + i.estimatedMin, 0)
}
