/**
 * Score de préparation examen — un seul chiffre 0-100 qui résume "suis-je prêt ?".
 *
 * Pondération (somme = 100) :
 *   - Couverture (25)         : % des questions tentées au moins 1 fois
 *   - Précision (25)          : % bonnes réponses sur tentatives uniques
 *   - Maîtrise SM-2 (30)      : % des questions avec interval >= 7j (= ancrées long terme)
 *   - Cas pratiques (10)      : % d'exos complétés à 100%
 *   - Codes CCAM (10)         : % de codes touchés via le drill
 *
 * Un élève à 0% sur les 5 dimensions = 0 ; à 100% partout = 100.
 * Le score est conçu pour qu'un état "réaliste à l'examen" (couverture 90%,
 * précision 75%, maîtrise 70%, pratiques 100%, CCAM 80%) tombe autour de 80.
 */

export type ReadinessBreakdown = {
  coverage: number       // 0-100
  accuracy: number       // 0-100
  mastery: number        // 0-100
  practice: number       // 0-100
  ccam: number           // 0-100
}

export type ReadinessResult = {
  score: number          // 0-100
  level: 'commencement' | 'construction' | 'consolidation' | 'pret' | 'maitrise'
  label: string
  color: string
  breakdown: ReadinessBreakdown
}

const MASTERY_INTERVAL_DAYS = 7  // une question ancrée long terme = interval ≥ 7j

type Input = {
  totalQuestions: number
  attemptedQuestionIds: Set<string>            // distinctes
  correctQuestionIds: Set<string>              // distinctes ayant au moins 1 bonne réponse
  quizProgress: { question_id: string; interval_days: number; is_suspended: boolean }[]
  practiceTotal: number
  practiceCompleted: number                    // best_score >= 1
  ccamCodesTotal: number
  ccamMastered: number
}

export function computeReadiness(i: Input): ReadinessResult {
  const coverage = i.totalQuestions > 0
    ? (i.attemptedQuestionIds.size / i.totalQuestions) * 100
    : 0
  const accuracy = i.attemptedQuestionIds.size > 0
    ? (i.correctQuestionIds.size / i.attemptedQuestionIds.size) * 100
    : 0
  const masteredCount = i.quizProgress.filter(
    p => !p.is_suspended && p.interval_days >= MASTERY_INTERVAL_DAYS
  ).length
  const mastery = i.totalQuestions > 0
    ? (masteredCount / i.totalQuestions) * 100
    : 0
  const practice = i.practiceTotal > 0
    ? (i.practiceCompleted / i.practiceTotal) * 100
    : 0
  const ccam = i.ccamCodesTotal > 0
    ? (i.ccamMastered / i.ccamCodesTotal) * 100
    : 0

  const score = Math.round(
    coverage * 0.25 +
    accuracy * 0.25 +
    mastery  * 0.30 +
    practice * 0.10 +
    ccam     * 0.10
  )

  const level = score >= 85 ? 'maitrise'
              : score >= 70 ? 'pret'
              : score >= 50 ? 'consolidation'
              : score >= 30 ? 'construction'
              :               'commencement'

  const label = level === 'maitrise'      ? 'Maîtrise'
              : level === 'pret'          ? 'Prêt pour l\'examen'
              : level === 'consolidation' ? 'En consolidation'
              : level === 'construction'  ? 'En construction'
              :                             'Au commencement'

  const color = level === 'maitrise'      ? '#16A34A'
              : level === 'pret'          ? '#0A66E0'
              : level === 'consolidation' ? '#D97706'
              : level === 'construction'  ? '#F59E0B'
              :                             '#8A95A5'

  return {
    score,
    level,
    label,
    color,
    breakdown: {
      coverage: Math.round(coverage),
      accuracy: Math.round(accuracy),
      mastery:  Math.round(mastery),
      practice: Math.round(practice),
      ccam:     Math.round(ccam),
    },
  }
}
