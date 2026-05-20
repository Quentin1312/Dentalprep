export const XP_PER_CORRECT = 10
export const XP_PER_WRONG   = 2

// XP thresholds to reach level N (index = level-1)
export const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500]
export const LEVEL_NAMES  = ['Débutant', 'Apprenti', 'Révisant', 'Avancé', 'Maître']
export const LEVEL_COLORS = ['#94A3B8', '#3B82F6', '#8B5CF6', '#F59E0B', '#FFD84A']

export function computeXP(attempts: { is_correct: boolean }[]): number {
  return attempts.reduce((s, a) => s + (a.is_correct ? XP_PER_CORRECT : XP_PER_WRONG), 0)
}

export function xpToLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function xpProgress(xp: number): {
  level: number; name: string; color: string
  levelStart: number; levelEnd: number; pct: number
} {
  const level    = xpToLevel(xp)
  const levelStart = LEVEL_THRESHOLDS[level - 1]
  const levelEnd   = level < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[level] : levelStart
  const pct = level >= LEVEL_THRESHOLDS.length
    ? 100
    : Math.round(((xp - levelStart) / (levelEnd - levelStart)) * 100)
  return { level, name: LEVEL_NAMES[level - 1], color: LEVEL_COLORS[level - 1], levelStart, levelEnd, pct }
}
