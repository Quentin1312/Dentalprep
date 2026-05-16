import type { ModuleId } from '@/types/database'

export interface Module {
  id: ModuleId
  label: string
  bloc: number
}

export const MODULES: Module[] = [
  { id: 'M1', label: 'Communication', bloc: 1 },
  { id: 'M2', label: 'Assistance', bloc: 2 },
  { id: 'M3', label: 'Urgences', bloc: 2 },
  { id: 'M4', label: 'Traçabilité', bloc: 3 },
  { id: 'M5', label: 'RGPD', bloc: 4 },
  { id: 'M6', label: 'Organisation', bloc: 4 },
  { id: 'M7', label: 'Risque infectieux', bloc: 3 },
]

export const MODULE_MAP = Object.fromEntries(MODULES.map(m => [m.id, m])) as Record<ModuleId, Module>
