/**
 * Projection des révisions à venir.
 *
 * Pour chaque jour des N prochains jours, compte combien de flashcards et de
 * questions de quiz vont devenir dues (next_review_at = ce jour).
 *
 * Permet d'afficher une "courbe d'oubli" / charge à venir pour aider l'élève
 * à anticiper sa semaine (pic de révisions, soulagement, etc.).
 */

type ProgressRow = {
  next_review_at: string | null
  is_suspended?: boolean
}

export type ForecastDay = {
  date: string        // ISO YYYY-MM-DD
  dayLabel: string    // 'L', 'M', etc.
  flashcards: number
  quiz: number
  total: number
  isToday: boolean
}

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function projectDueLoad(
  flashcardProgress: ProgressRow[],
  quizProgress: ProgressRow[],
  days = 7,
  now = new Date(),
): ForecastDay[] {
  const todayMidnight = new Date(now)
  todayMidnight.setHours(0, 0, 0, 0)

  // Initialise les buckets pour chaque jour
  const buckets: ForecastDay[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(todayMidnight)
    d.setDate(d.getDate() + i)
    buckets.push({
      date: dateKey(d),
      dayLabel: DAY_LETTERS[d.getDay()],
      flashcards: 0,
      quiz: 0,
      total: 0,
      isToday: i === 0,
    })
  }

  const byKey = new Map(buckets.map(b => [b.date, b]))

  function addRow(row: ProgressRow, kind: 'flashcards' | 'quiz') {
    if (row.is_suspended) return
    if (!row.next_review_at) return
    const d = new Date(row.next_review_at)
    if (isNaN(d.getTime())) return
    // Les overdue (passé) tombent sur aujourd'hui
    const targetDate = d.getTime() < todayMidnight.getTime() ? todayMidnight : d
    targetDate.setHours(0, 0, 0, 0)
    const key = dateKey(targetDate)
    const bucket = byKey.get(key)
    if (!bucket) return  // au-delà de N jours, on ignore
    bucket[kind] += 1
    bucket.total += 1
  }

  for (const r of flashcardProgress) addRow(r, 'flashcards')
  for (const r of quizProgress)      addRow(r, 'quiz')

  return buckets
}
