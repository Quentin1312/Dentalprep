-- DentalPrep — Migration 005 : Répétition espacée (SM-2) sur flashcard_progress
-- Ajoute les colonnes nécessaires à l'algo SM-2 (style Anki).
-- À exécuter dans l'éditeur SQL de Supabase.

alter table public.flashcard_progress
  add column if not exists ease_factor   real      not null default 2.5,
  add column if not exists interval_days integer   not null default 0,
  add column if not exists next_review_at timestamptz,
  add column if not exists reps          integer   not null default 0,
  add column if not exists lapses        integer   not null default 0;

-- Pour les enregistrements existants : si status='known' on les considère vus 1 fois
-- et planifiés pour relecture dans 1 jour (sera ajusté à la prochaine session).
update public.flashcard_progress
set next_review_at = updated_at + interval '1 day',
    interval_days = 1,
    reps = 1
where status = 'known' and next_review_at is null;

update public.flashcard_progress
set next_review_at = updated_at,
    interval_days = 0,
    reps = 0
where status = 'review' and next_review_at is null;

create index if not exists flashcard_progress_due_idx
  on public.flashcard_progress(user_id, next_review_at);
