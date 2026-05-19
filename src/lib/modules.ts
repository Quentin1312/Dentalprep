import type { ModuleId } from '@/types/database'

export interface Module {
  id: ModuleId
  label: string
  description: string
  bloc: number
}

export interface Fascicule {
  n: number
  title: string
  modules: ModuleId[]
}

export const MODULES: Module[] = [
  { id: 'M1', label: 'Accueil et communication', description: 'Communication, accueil patient, éducation santé bucco-dentaire', bloc: 1 },
  { id: 'M2', label: 'Assistance clinique', description: 'Assistance au fauteuil, pharmacologie, anesthésie, pathologies, imagerie', bloc: 2 },
  { id: 'M3', label: 'Urgences médicales', description: 'AFGSU 1+2, gestes d\'urgence, anatomie appliquée', bloc: 2 },
  { id: 'M4', label: 'Hygiène et asepsie', description: 'Microbiologie, gestion des stocks, stérilisation', bloc: 3 },
  { id: 'M5', label: 'Prévention des risques', description: 'Risques professionnels, gestion des stocks', bloc: 3 },
  { id: 'M6', label: 'Gestion administrative', description: 'Dossier patient, CCAM, remboursements, nomenclatures', bloc: 4 },
]

export const FASCICULES: Fascicule[] = [
  { n: 5,  title: 'Anatomie tête et cou',                        modules: ['M1', 'M2', 'M3', 'M4'] },
  { n: 6,  title: 'Communication - Accueil',                     modules: ['M1'] },
  { n: 7,  title: 'Éducation Promotion à la santé Bucco-dentaire', modules: ['M1', 'M4'] },
  { n: 8,  title: 'Douleur et anesthésie',                       modules: ['M2'] },
  { n: 9,  title: 'Pharmacologie',                               modules: ['M2'] },
  { n: 10, title: 'Pathologies dentaires et buccales',           modules: ['M1', 'M2', 'M6'] },
  { n: 11, title: 'Microbiologie',                               modules: ['M2', 'M4'] },
  { n: 12, title: 'Travail au fauteuil',                         modules: ['M2'] },
  { n: 13, title: 'Imagerie médicale',                           modules: ['M3'] },
  { n: 14, title: 'AFGSU 1 + 2',                                 modules: ['M3'] },
  { n: 15, title: 'Gestion des stocks',                          modules: ['M4', 'M5'] },
  { n: 16, title: 'Évaluation et prévention des risques au travail', modules: ['M5'] },
  { n: 17, title: 'Créer et suivre un dossier patient',          modules: ['M6'] },
  { n: 18, title: 'CCAM - Honoraires et nomenclatures',          modules: ['M6'] },
]

export const MODULE_MAP = Object.fromEntries(MODULES.map(m => [m.id, m])) as Record<ModuleId, Module>

export const BLOCS: { n: number; label: string }[] = [
  { n: 1, label: 'Relation patient' },
  { n: 2, label: 'Assistance au praticien' },
  { n: 3, label: 'Gestion du risque' },
  { n: 4, label: 'Gestion administrative' },
]
