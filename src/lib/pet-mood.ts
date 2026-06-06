/**
 * Humeur du pet basée sur la régularité de l'élève.
 *
 *   - 'excited'  : streak ≥ 7 et déjà actif aujourd'hui     → ✨ pet survolté
 *   - 'happy'    : streak ≥ 3 ou actif aujourd'hui          → sourire
 *   - 'normal'   : activité récente (< 1 jour)              → neutre
 *   - 'sad'      : streak cassée mais activité ≤ 48h        → ☁ pet déçu
 *   - 'sleepy'   : pas d'activité depuis > 48h              → 💤 pet endormi
 *
 * Levier de re-engagement : quand le pet est triste/endormi, on affiche un
 * message de retour ("Pixie t'attend...") pour donner envie de revenir.
 */

export type PetMood = 'excited' | 'happy' | 'normal' | 'sad' | 'sleepy'

export type MoodInfo = {
  mood: PetMood
  emoji: string                  // overlay au-dessus du pet
  label: string                  // ex. "Trop content"
  message: string | null         // message à afficher (null si normal/happy)
  color: string
}

const HOUR = 3_600_000
const DAY = 86_400_000

export function computeMood(
  streak: number,
  lastActivityISO: string | null,
  todayMinutes: number,
  now: Date = new Date(),
): MoodInfo {
  const lastTs = lastActivityISO ? new Date(lastActivityISO).getTime() : 0
  const sinceLast = lastTs > 0 ? now.getTime() - lastTs : Infinity
  const activeToday = todayMinutes > 0

  let mood: PetMood
  if (streak >= 7 && activeToday) {
    mood = 'excited'
  } else if (streak >= 3 || activeToday) {
    mood = 'happy'
  } else if (sinceLast > 2 * DAY) {
    mood = 'sleepy'
  } else if (sinceLast > 1 * DAY && streak === 0) {
    mood = 'sad'
  } else {
    mood = 'normal'
  }

  switch (mood) {
    case 'excited':
      return {
        mood, emoji: '✨', label: 'En feu !', message: null,
        color: '#FFD84A',
      }
    case 'happy':
      return {
        mood, emoji: '😊', label: 'Content', message: null,
        color: '#16A34A',
      }
    case 'normal':
      return {
        mood, emoji: '', label: 'Tranquille', message: null,
        color: '#5A6675',
      }
    case 'sad':
      return {
        mood, emoji: '☁️', label: 'Triste',
        message: 'Ta série est cassée — on reprend ?',
        color: '#0A66E0',
      }
    case 'sleepy':
      return {
        mood, emoji: '💤', label: 'Endormi',
        message: 'Ton compagnon s\'est endormi en t\'attendant…',
        color: '#7C3AED',
      }
  }
}
