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
  quizDueCount: number          // SM-2 : questions de quiz dues
  attempts: Attempt[]
  moduleStats: ModuleStat[]
  practiceTodoCount: number     // nb de cas pratiques non validés à 100%
  recentWrongQuestionCount: number  // dernière tentative = fausse (fallback si SM-2 vide)
  totalQuestionsCount: number
}

const MODULE_ACCENT: Record<string, string> = {
  M1: '#0A66E0', M2: '#0D9488', M3: '#7C3AED',
  M4: '#E11D48', M5: '#D97706', M6: '#5B21B6',
}

// Cap les nombres pour ne pas effrayer l'étudiant (109 flashcards = panique)
const CARDS_PER_SESSION = 15
const PRACTICE_PER_SESSION = 3
const WRONG_PER_SESSION = 10

export function buildStudyPlan(i: Input): StudyPlanItem[] {
  const items: StudyPlanItem[] = []

  // 1. Flashcards dues (priorité absolue) — capé à 15 par session
  if (i.flashcardsDueCount > 0) {
    const shown = Math.min(i.flashcardsDueCount, CARDS_PER_SESSION)
    items.push({
      id: 'due-cards',
      icon: 'cards',
      title: `Réviser ${shown} flashcard${shown > 1 ? 's' : ''}`,
      detail: i.flashcardsDueCount > CARDS_PER_SESSION
        ? `${i.flashcardsDueCount} en attente · on commence par les + urgentes`
        : 'Répétition espacée — quelques minutes',
      estimatedMin: Math.max(5, Math.ceil(shown * 0.5)),
      href: '/library',
      accent: '#0A66E0',
      priority: 0,
    })
  }

  // 2. Questions de quiz dues (SM-2) — priorité haute, capé à 20
  const QUIZ_PER_SESSION = 20
  if (i.quizDueCount > 0) {
    const shown = Math.min(i.quizDueCount, QUIZ_PER_SESSION)
    items.push({
      id: 'due-quiz',
      icon: 'refresh',
      title: `Réviser ${shown} question${shown > 1 ? 's' : ''}`,
      detail: i.quizDueCount > QUIZ_PER_SESSION
        ? `${i.quizDueCount} à revoir · on commence par les + urgentes`
        : 'Questions à revoir aujourd\'hui',
      estimatedMin: Math.max(5, Math.ceil(shown * 0.8)),
      href: '/quiz/due',
      accent: '#E11D48',
      priority: 1,
    })
  } else if (i.recentWrongQuestionCount >= 3) {
    // Fallback tant que SM-2 n'est pas encore alimenté (utilisateur avant backfill)
    const shown = Math.min(i.recentWrongQuestionCount, WRONG_PER_SESSION)
    items.push({
      id: 'wrong-quiz',
      icon: 'refresh',
      title: `Reprendre ${shown} erreur${shown > 1 ? 's' : ''}`,
      detail: 'Refaire les questions que tu as ratées',
      estimatedMin: Math.min(12, shown),
      href: '/mes-erreurs',
      accent: '#E11D48',
      priority: 1,
    })
  }

  // 3. Module faible — seulement si ≥ 15 tentatives ET < 60% (sinon "0% sur 0" = pas faible, jamais touché)
  const weakestModule = i.moduleStats
    .filter(m => m.totalQuestions >= 15 && m.pct < 60)
    .sort((a, b) => a.pct - b.pct)[0]
  if (weakestModule) {
    items.push({
      id: `weak-${weakestModule.id}`,
      icon: 'target',
      title: `Renforcer ${weakestModule.id}`,
      detail: `${weakestModule.pct}% de précision · ${weakestModule.label}`,
      estimatedMin: 15,
      href: `/quiz/${weakestModule.id}?mode=smart`,
      accent: MODULE_ACCENT[weakestModule.id] ?? '#0A66E0',
      priority: 2,
    })
  }

  // 4. Cas pratiques — n'apparaît QUE si rien d'autre de plus urgent OU peu de cas restants
  // et capé à 3 pour pas effrayer
  if (i.practiceTodoCount > 0 && items.length < 2) {
    const shown = Math.min(i.practiceTodoCount, PRACTICE_PER_SESSION)
    items.push({
      id: 'practice',
      icon: 'edit',
      title: `${shown} cas pratique${shown > 1 ? 's' : ''}`,
      detail: 'Coder une feuille de soins CCAM',
      estimatedMin: shown * 4,
      href: '/practice',
      accent: '#D97706',
      priority: 3,
    })
  }

  // 5. Backup si rien à proposer (utilisateur tout neuf ou parfait)
  if (items.length === 0) {
    items.push({
      id: 'discover',
      icon: 'bookOpen',
      title: 'Continue ton apprentissage',
      detail: 'Découvre tes cours dans la bibliothèque',
      estimatedMin: i.dailyGoalMinutes,
      href: '/library',
      accent: '#0A66E0',
      priority: 5,
    })
  }

  // Limite à 2 items max — un plan trop long décourage
  return items.sort((a, b) => a.priority - b.priority).slice(0, 2)
}

export function planTotalMinutes(items: StudyPlanItem[]): number {
  return items.reduce((s, i) => s + i.estimatedMin, 0)
}
