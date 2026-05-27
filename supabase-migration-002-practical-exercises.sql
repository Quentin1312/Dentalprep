-- DentalPrep — Migration 002 : Exercices pratiques (feuille de soins CCAM)
-- À exécuter dans l'éditeur SQL de Supabase

create extension if not exists "uuid-ossp";

-- Exercices pratiques (énoncés + corrections attendues)
create table public.practical_exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  n integer not null,                          -- numéro d'exo (1, 2, 3...)
  category text not null check (category in (
    'actes_isoles', 'procedures', 'gestes_compl', 'associations',
    'modificateurs', 'prothese_fixe', 'cmu_css',
    'calculs_amo_amc', 'ebd', 'devis', 'css', 'cas_complet'
  )),
  title text not null,                         -- ex: "Radiographie panoramique dentomaxillaire"
  prompt text not null,                        -- énoncé complet
  rows jsonb not null,                         -- tableau de lignes attendues
  tarifs jsonb,                                -- tarifs spécifiques (devis/css)
  explanation text default '',
  created_at timestamptz not null default now()
);

create index practical_exercises_user_idx on public.practical_exercises(user_id);
create index practical_exercises_category_idx on public.practical_exercises(category);

-- Tentatives sur les exercices pratiques
create table public.practical_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  exercise_id uuid references public.practical_exercises(id) on delete cascade not null,
  answers jsonb not null,                      -- ce que l'utilisateur a saisi
  cells_correct integer not null,
  cells_total integer not null,
  score real not null,                         -- 0.0 à 1.0
  created_at timestamptz not null default now()
);

create index practical_attempts_user_idx on public.practical_attempts(user_id);
create index practical_attempts_exercise_idx on public.practical_attempts(exercise_id);

-- RLS
alter table public.practical_exercises enable row level security;
alter table public.practical_attempts enable row level security;

create policy "practical_exercises owner read"   on public.practical_exercises for select using (auth.uid() = user_id);
create policy "practical_exercises owner insert" on public.practical_exercises for insert with check (auth.uid() = user_id);
create policy "practical_exercises owner update" on public.practical_exercises for update using (auth.uid() = user_id);
create policy "practical_exercises owner delete" on public.practical_exercises for delete using (auth.uid() = user_id);

create policy "practical_attempts owner read"   on public.practical_attempts for select using (auth.uid() = user_id);
create policy "practical_attempts owner insert" on public.practical_attempts for insert with check (auth.uid() = user_id);
