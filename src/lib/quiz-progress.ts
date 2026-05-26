export type QuizQuestionRef = {
  id: string
  module_id: string
  course_id: string
}

export type QuizAttemptRef = {
  question_id: string
  is_correct: boolean
}

export function quizCompletionPct(questions: QuizQuestionRef[], attempts: QuizAttemptRef[]) {
  if (questions.length === 0) return 0

  const questionIds = new Set(questions.map(q => q.id))
  const correctlyAnswered = new Set(
    attempts
      .filter(a => a.is_correct && questionIds.has(a.question_id))
      .map(a => a.question_id)
  )

  return Math.round((correctlyAnswered.size / questionIds.size) * 100)
}

export function quizCompletionCount(questions: QuizQuestionRef[], attempts: QuizAttemptRef[]) {
  const questionIds = new Set(questions.map(q => q.id))
  const correctlyAnswered = new Set(
    attempts
      .filter(a => a.is_correct && questionIds.has(a.question_id))
      .map(a => a.question_id)
  )

  return { done: correctlyAnswered.size, total: questionIds.size }
}
