-- DentalPrep — Migration 003 : champ extra pour les exercices complexes
-- À exécuter dans l'éditeur SQL de Supabase.
-- Permet de stocker schéma dentaire, calculs AMO/AMC, devis, questions ouvertes.

alter table public.practical_exercises
  add column if not exists extra jsonb;

-- extra schema attendu (chaque clé est optionnelle) :
-- {
--   "schema_dentaire": { "11": "carie", "12": "composite", ... },
--   "calculs": { "montant_total": 75.40, "amo_pct": 70, "amc_pct": 30 },
--   "devis": [ { "libelle": "...", "code": "...", "honoraires": 600, "base_remb": 120 } ],
--   "questions": [ { "id": "qui_regle", "label": "Qui règle le praticien ?", "answer": "le patient" } ]
-- }
