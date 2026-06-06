/**
 * Plan de révision adaptatif.
 *
 * Trois phases déterminées par daysUntilExam :
 *   - "construction"   (J > 90 ou aucune date)   : on bâtit les bases — flashcards,
 *                                                  nouveau contenu, premiers codes CCAM.
 *   - "consolidation"  (30 < J ≤ 90)             : on entretient — quiz SM-2 dus,
 *                                                  cas pratiques, drill CCAM.
 *   - "sprint"         (J ≤ 30)                  : on bachote — quiz dus, modules
 *                                                  faibles, cas pratiques, codes CCAM.
 *
 * Le plan calcule jusqu'à 6 candidats, leur attribue une urgence (0-100) modulée
 * par la phase, et renvoie les 3 meilleurs (urgence > 0).
 */

import type { ModuleId } from '@/types/database'
import { canStartMock } from '@/lib/mock-exam'

export type StudyPhase = 'construction' | 'consolidation' | 'sprint'

export type StudyPlanItem = {
  id: string
  icon: string            // nom d'icône (cf src/components/ui/Icon.tsx)
  title: string
  detail: string
  estimatedMin: number
  href: string
  accent: string
  urgency: number         // 0-100
}

type Attempt = { module_id: string; is_correct: boolean; question_id: string }
type ModuleStat = { id: ModuleId; label: string; pct: number; doneQuestions: number; totalQuestions: number }

type Input = {
  daysUntilExam: number | null
  dailyGoalMinutes: number
  flashcardsDueCount: number
  quizDueCount: number
  attempts: Attempt[]
  moduleStats: ModuleStat[]
  practiceTodoCount: number
  recentWrongQuestionCount: number
  totalQuestionsCount: number
  ccamCodesCount: number
  ccamMasteredCount: number
  lastMockCompletedAt: string | null
  totalAttempts: number   // pour évaluer si l'élève a assez progressé pour passer une mock
}

const MODULE_ACCENT: Record<string, string> = {
  M1: '#0A66E0', M2: '#0D9488', M3: '#7C3AED',
  M4: '#E11D48', M5: '#D97706', M6: '#5B21B6',
}

const CARDS_PER_SESSION = 15
const QUIZ_PER_SESSION = 20
const PRACTICE_PER_SESSION = 3

export function getPhase(daysUntilExam: number | null): StudyPhase {
  if (daysUntilExam === null) return 'construction'
  if (daysUntilExam <= 30) return 'sprint'
  if (daysUntilExam <= 90) return 'consolidation'
  return 'construction'
}

export function phaseLabel(phase: StudyPhase): string {
  return phase === 'sprint'      ? 'Sprint examen'
       : phase === 'consolidation' ? 'Consolidation'
       :                              'Construction'
}

export function phaseSubtitle(phase: StudyPhase, days: number | null): string {
  if (phase === 'sprint')      return `J−${days} · on bachote les points faibles`
  if (phase === 'consolidation') return `J−${days} · on ancre et on enchaîne`
  return days !== null ? `J−${days} · on bâtit les bases` : 'On bâtit les bases'
}

// ─────────────────────────────────────────────────────────────────────────────
// Builders de candidats
// ─────────────────────────────────────────────────────────────────────────────

function dueFlashcards(i: Input, phase: StudyPhase): StudyPlanItem | null {
  if (i.flashcardsDueCount === 0) return null
  const shown = Math.min(i.flashcardsDueCount, CARDS_PER_SESSION)
  // Urgence : très haute en construction, baisse mais reste forte en sprint
  const base = phase === 'construction' ? 85 : phase === 'consolidation' ? 70 : 60
  const urgency = Math.min(100, base + Math.min(15, i.flashcardsDueCount / 5))
  return {
    id: 'due-flashcards',
    icon: 'cards',
    title: `Réviser ${shown} flashcard${shown > 1 ? 's' : ''}`,
    detail: i.flashcardsDueCount > CARDS_PER_SESSION
      ? `${i.flashcardsDueCount} en attente · on commence par les + urgentes`
      : 'Répétition espacée — quelques minutes',
    estimatedMin: Math.max(5, Math.ceil(shown * 0.5)),
    href: '/flashcards/due',
    accent: '#0A66E0',
    urgency,
  }
}

function dueQuiz(i: Input, phase: StudyPhase): StudyPlanItem | null {
  if (i.quizDueCount === 0) {
    // Fallback : si SM-2 vide mais erreurs récentes, propose "Mes erreurs"
    if (i.recentWrongQuestionCount >= 3) {
      const shown = Math.min(i.recentWrongQuestionCount, 10)
      return {
        id: 'wrong-quiz',
        icon: 'refresh',
        title: `Reprendre ${shown} erreur${shown > 1 ? 's' : ''}`,
        detail: 'Refaire les questions ratées',
        estimatedMin: Math.min(12, shown),
        href: '/mes-erreurs',
        accent: '#E11D48',
        urgency: 65,
      }
    }
    return null
  }
  const shown = Math.min(i.quizDueCount, QUIZ_PER_SESSION)
  const base = phase === 'sprint' ? 95 : phase === 'consolidation' ? 85 : 70
  const urgency = Math.min(100, base + Math.min(10, i.quizDueCount / 10))
  return {
    id: 'due-quiz',
    icon: 'refresh',
    title: `Réviser ${shown} question${shown > 1 ? 's' : ''}`,
    detail: i.quizDueCount > QUIZ_PER_SESSION
      ? `${i.quizDueCount} à revoir · on commence par les + urgentes`
      : 'Questions à revoir aujourd\'hui',
    estimatedMin: Math.max(5, Math.ceil(shown * 0.8)),
    href: '/quiz/due',
    accent: '#E11D48',
    urgency,
  }
}

function weakModule(i: Input, phase: StudyPhase): StudyPlanItem | null {
  const weak = i.moduleStats
    .filter(m => m.totalQuestions >= 15 && m.pct < 60)
    .sort((a, b) => a.pct - b.pct)[0]
  if (!weak) return null
  // Urgence : énorme en sprint, modérée sinon
  const base = phase === 'sprint' ? 90 : phase === 'consolidation' ? 60 : 45
  const urgency = Math.min(100, base + (60 - weak.pct) * 0.5)
  return {
    id: `weak-${weak.id}`,
    icon: 'target',
    title: `Renforcer ${weak.id}`,
    detail: `${weak.pct}% de précision · ${weak.label}`,
    estimatedMin: 15,
    href: `/quiz/${weak.id}?mode=smart`,
    accent: MODULE_ACCENT[weak.id] ?? '#0A66E0',
    urgency,
  }
}

function practice(i: Input, phase: StudyPhase): StudyPlanItem | null {
  if (i.practiceTodoCount === 0) return null
  const shown = Math.min(i.practiceTodoCount, PRACTICE_PER_SESSION)
  // Cas pratiques = CCAM appliqué → de + en + critique à mesure que l'examen approche
  const base = phase === 'sprint' ? 80 : phase === 'consolidation' ? 65 : 35
  const urgency = base + Math.min(15, i.practiceTodoCount / 4)
  return {
    id: 'practice',
    icon: 'edit',
    title: `${shown} cas pratique${shown > 1 ? 's' : ''}`,
    detail: 'Coder une feuille de soins CCAM',
    estimatedMin: shown * 4,
    href: '/practice',
    accent: '#D97706',
    urgency,
  }
}

function ccamDrill(i: Input, phase: StudyPhase): StudyPlanItem | null {
  if (i.ccamCodesCount === 0) return null
  const coverage = i.ccamMasteredCount / i.ccamCodesCount
  if (coverage >= 0.85) return null   // bien maîtrisé, pas besoin
  const remaining = i.ccamCodesCount - i.ccamMasteredCount
  // Très utile en consolidation et sprint, optionnel en construction
  const base = phase === 'sprint' ? 70 : phase === 'consolidation' ? 60 : 40
  const urgency = base + Math.min(25, (1 - coverage) * 30)
  const pct = Math.round(coverage * 100)
  return {
    id: 'ccam-drill',
    icon: 'target',
    title: 'Drill codes CCAM',
    detail: `${pct}% maîtrisés · ${remaining} codes restants · ~1 min`,
    estimatedMin: 2,
    href: '/practice/drill',
    accent: '#0D9488',
    urgency,
  }
}

function mockExam(i: Input, phase: StudyPhase): StudyPlanItem | null {
  // Pré-requis : au moins 100 attempts pour que ça ait du sens
  if (i.totalAttempts < 100) return null
  // Cooldown : 1 mock / 7 jours
  if (!canStartMock(i.lastMockCompletedAt)) return null

  // Urgence : essentielle en sprint, importante en consolidation, faible en construction
  const base = phase === 'sprint' ? 92 : phase === 'consolidation' ? 75 : 50
  const sub = phase === 'sprint'
    ? '50 Q · 60 min · conditions réelles'
    : phase === 'consolidation'
      ? 'Mesure ton niveau · 50 Q chrono'
      : 'Essaie une épreuve blanche · 50 Q'

  return {
    id: 'mock-exam',
    icon: 'target',
    title: 'Épreuve blanche',
    detail: sub,
    estimatedMin: 60,
    href: '/mock-exam',
    accent: '#7C3AED',
    urgency: base,
  }
}

function discoverModule(i: Input, phase: StudyPhase): StudyPlanItem | null {
  // Module avec peu de questions tentées (couverture < 30%) — utile en construction
  if (phase === 'sprint') return null
  const candidate = i.moduleStats
    .filter(m => m.totalQuestions > 0 && m.doneQuestions / m.totalQuestions < 0.3)
    .sort((a, b) => (a.doneQuestions / a.totalQuestions) - (b.doneQuestions / b.totalQuestions))[0]
  if (!candidate) return null
  const base = phase === 'construction' ? 55 : 35
  return {
    id: `discover-${candidate.id}`,
    icon: 'bookOpen',
    title: `Découvrir ${candidate.id}`,
    detail: `${candidate.label} · ${candidate.doneQuestions}/${candidate.totalQuestions} questions vues`,
    estimatedMin: 10,
    href: `/quiz/${candidate.id}?mode=smart`,
    accent: MODULE_ACCENT[candidate.id] ?? '#0A66E0',
    urgency: base,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan principal — calcule les candidats, trie par urgence, renvoie le top 3.
// ─────────────────────────────────────────────────────────────────────────────

export function buildStudyPlan(i: Input): StudyPlanItem[] {
  const phase = getPhase(i.daysUntilExam)

  const candidates: (StudyPlanItem | null)[] = [
    dueFlashcards(i, phase),
    dueQuiz(i, phase),
    weakModule(i, phase),
    practice(i, phase),
    ccamDrill(i, phase),
    mockExam(i, phase),
    discoverModule(i, phase),
  ]

  const sorted = candidates
    .filter((c): c is StudyPlanItem => c !== null && c.urgency > 0)
    .sort((a, b) => b.urgency - a.urgency)

  // Backup si tout est vide (élève tout neuf ou parfait)
  if (sorted.length === 0) {
    return [{
      id: 'discover',
      icon: 'bookOpen',
      title: 'Continue ton apprentissage',
      detail: 'Découvre tes cours dans la bibliothèque',
      estimatedMin: i.dailyGoalMinutes,
      href: '/library',
      accent: '#0A66E0',
      urgency: 10,
    }]
  }

  return sorted.slice(0, 3)
}

export function planTotalMinutes(items: StudyPlanItem[]): number {
  return items.reduce((s, i) => s + i.estimatedMin, 0)
}
