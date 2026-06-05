import { xpToLevel } from './xp'

export type AccessorySlot = 'head' | 'eyes' | 'neck' | 'body' | 'chest'

export type EquippedAccessories = Partial<Record<AccessorySlot, string>>

export type UnlockRule =
  | { kind: 'level'; level: number }
  | { kind: 'streak'; days: number }
  | { kind: 'attempts'; count: number }
  | { kind: 'badges'; count: number }
  | { kind: 'allBadges' }

export type Accessory = {
  id: string
  slot: AccessorySlot
  name: string
  description: string
  unlock: UnlockRule
}

export const ACCESSORIES: Accessory[] = [
  // ── Tête ────────────────────────────────────────────────────
  { id: 'cap',          slot: 'head',  name: 'Casquette',        description: 'Décontracté mais sérieux.',         unlock: { kind: 'attempts', count: 50 } },
  { id: 'grad_cap',     slot: 'head',  name: 'Toque de diplômé', description: "L'académie, ça compte.",            unlock: { kind: 'level',    level: 4 } },
  { id: 'crown_gold',   slot: 'head',  name: 'Couronne dorée',   description: 'Pour les rois de la révision.',     unlock: { kind: 'attempts', count: 100 } },
  { id: 'crown_royal',  slot: 'head',  name: 'Couronne royale',  description: 'Avec joyaux. Rien que ça.',         unlock: { kind: 'level',    level: 5 } },

  // ── Yeux ────────────────────────────────────────────────────
  { id: 'round_glasses', slot: 'eyes', name: 'Lunettes rondes',  description: 'Look intello assumé.',              unlock: { kind: 'level',  level: 3 } },
  { id: 'sunglasses',    slot: 'eyes', name: 'Lunettes soleil',  description: 'Trop cool pour réviser. (Si.)',     unlock: { kind: 'streak', days: 30 } },

  // ── Cou ─────────────────────────────────────────────────────
  { id: 'collar',     slot: 'neck',  name: 'Collier',          description: 'Avec breloque thématique.',            unlock: { kind: 'level',  level: 2 } },
  { id: 'bowtie',     slot: 'neck',  name: 'Nœud papillon',    description: "Pour l'élégance.",                     unlock: { kind: 'streak', days: 7 } },
  { id: 'stetho',     slot: 'neck',  name: 'Stéthoscope',      description: 'Esprit dentaire.',                     unlock: { kind: 'badges', count: 5 } },

  // ── Corps ───────────────────────────────────────────────────
  { id: 'lab_coat',   slot: 'body',  name: 'Blouse blanche',   description: 'Mode chirurgien.',                     unlock: { kind: 'attempts', count: 200 } },
  { id: 'hero_cape',  slot: 'body',  name: 'Cape de héros',    description: 'Sauveur du CNQAOS.',                   unlock: { kind: 'allBadges' } },

  // ── Poitrail ────────────────────────────────────────────────
  { id: 'medallion',  slot: 'chest', name: 'Médaillon doré',   description: 'Une médaille bien méritée.',           unlock: { kind: 'level',  level: 5 } },
]

export const ACCESSORY_BY_ID: Record<string, Accessory> = Object.fromEntries(
  ACCESSORIES.map(a => [a.id, a])
)

export type UnlockStats = {
  xp: number
  streak: number
  attemptCount: number
  badgeCount: number
  totalBadges: number
}

export function isUnlocked(acc: Accessory, stats: UnlockStats): boolean {
  switch (acc.unlock.kind) {
    case 'level':     return xpToLevel(stats.xp) >= acc.unlock.level
    case 'streak':    return stats.streak >= acc.unlock.days
    case 'attempts':  return stats.attemptCount >= acc.unlock.count
    case 'badges':    return stats.badgeCount >= acc.unlock.count
    case 'allBadges': return stats.totalBadges > 0 && stats.badgeCount >= stats.totalBadges
  }
}

export function unlockRuleLabel(rule: UnlockRule): string {
  switch (rule.kind) {
    case 'level':     return `Niveau ${rule.level}`
    case 'streak':    return `${rule.days} jours de streak`
    case 'attempts':  return `${rule.count} questions répondues`
    case 'badges':    return `${rule.count} badges débloqués`
    case 'allBadges': return 'Tous les badges débloqués'
  }
}

export function unlockedAccessories(stats: UnlockStats): Accessory[] {
  return ACCESSORIES.filter(a => isUnlocked(a, stats))
}

export const SLOT_LABELS: Record<AccessorySlot, string> = {
  head:  'Tête',
  eyes:  'Yeux',
  neck:  'Cou',
  body:  'Corps',
  chest: 'Poitrail',
}

export const SLOT_ORDER: AccessorySlot[] = ['head', 'eyes', 'neck', 'body', 'chest']
