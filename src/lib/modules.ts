import type { ModuleId } from '@/types/database'

export interface Module {
  id: ModuleId
  label: string
  bloc: string
  color: string
  colorSoft: string
}

export const MODULES: Module[] = [
  { id: 'M1', label: 'Communication', bloc: 'Bloc 1 — Relation patient', color: '#0A66E0', colorSoft: '#E6EFFC' },
  { id: 'M2', label: 'Assistance', bloc: 'Bloc 1 — Relation patient', color: '#0A66E0', colorSoft: '#E6EFFC' },
  { id: 'M3', label: 'Urgences', bloc: 'Bloc 2 — Sécurité', color: '#DC2626', colorSoft: '#FEE2E2' },
  { id: 'M4', label: 'Traçabilité', bloc: 'Bloc 2 — Sécurité', color: '#DC2626', colorSoft: '#FEE2E2' },
  { id: 'M5', label: 'RGPD', bloc: 'Bloc 3 — Gestion', color: '#7C3AED', colorSoft: '#EDE9FE' },
  { id: 'M6', label: 'Organisation', bloc: 'Bloc 3 — Gestion', color: '#7C3AED', colorSoft: '#EDE9FE' },
  { id: 'M7', label: 'Risque infectieux', bloc: 'Bloc 4 — Hygiène', color: '#059669', colorSoft: '#D1FAE5' },
]

export const MODULE_MAP = Object.fromEntries(MODULES.map(m => [m.id, m])) as Record<ModuleId, Module>
