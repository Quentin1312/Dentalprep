export const FLASH_XP_KEY = 'dentalprep_flash_xp'
export const FLASH_Q_KEY  = 'dentalprep_flash_questions'
const MAX_POOL = 100

export type FlashQuestion = {
  question: string
  choices: string[]
  correct_index: number
  explanation: string
}

export function readFlashXP(): number {
  try { return Number(localStorage.getItem(FLASH_XP_KEY)) || 0 } catch { return 0 }
}

export function addFlashXP(xp: number): void {
  try { localStorage.setItem(FLASH_XP_KEY, String(readFlashXP() + xp)) } catch {}
}

export function readFlashQuestions(): FlashQuestion[] {
  try {
    const raw = localStorage.getItem(FLASH_Q_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FlashQuestion[]
  } catch { return [] }
}

export function saveFlashQuestions(newQs: FlashQuestion[]): void {
  try {
    const existing = readFlashQuestions()
    const seen = new Set(existing.map(q => q.question))
    const combined = [...existing, ...newQs.filter(q => !seen.has(q.question))].slice(-MAX_POOL)
    localStorage.setItem(FLASH_Q_KEY, JSON.stringify(combined))
  } catch {}
}
