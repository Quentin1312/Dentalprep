-- DentalPrep — Migration 0001 : SM-2 sur les questions de quiz
-- À exécuter dans l'éditeur SQL de Supabase, puis exécuter le bloc backfill en bas.

-- ─────────────────────────────────────────────────────────────────────────────
-- Table d'état SM-2 par (user, question). Jumelle de flashcard_progress.
-- Aucune modif des tables existantes : quiz_attempts reste le log immutable,
-- cette table contient l'état dérivé courant (EF, intervalle, prochaine revue).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.quiz_question_progress (
  user_id        uuid references public.profiles(id) on delete cascade not null,
  question_id    uuid references public.quiz_questions(id) on delete cascade not null,
  ease_factor    real    not null default 2.5,
  interval_days  integer not null default 0,
  reps           integer not null default 0,
  lapses         integer not null default 0,
  next_review_at timestamptz,
  is_leech       boolean not null default false,    -- déclenché à lapses >= 6
  is_suspended   boolean not null default false,    -- l'utilisateur a écarté la question
  updated_at     timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.quiz_question_progress enable row level security;

create policy "quiz_question_progress_own"
  on public.quiz_question_progress
  for all using (auth.uid() = user_id);

-- Index pour la requête "questions dues" (mode /quiz/due et dashboard)
create index if not exists quiz_qp_due_idx
  on public.quiz_question_progress (user_id, next_review_at)
  where is_suspended = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKFILL (one-shot, à exécuter une fois après création de la table).
-- Reconstitue un état SM-2 approximatif depuis l'historique des attempts :
--  - reps   = nb de bonnes réponses
--  - lapses = nb de mauvaises réponses
--  - next_review_at = now() : tout est dû immédiatement, l'algo reprend dès
--    le prochain passage de la question.
-- ─────────────────────────────────────────────────────────────────────────────
-- insert into public.quiz_question_progress
--   (user_id, question_id, reps, lapses, next_review_at, ease_factor, interval_days, is_leech)
-- select
--   user_id, question_id,
--   sum(case when is_correct then 1 else 0 end)::int as reps,
--   sum(case when is_correct then 0 else 1 end)::int as lapses,
--   now() as next_review_at,
--   2.5 as ease_factor,
--   0 as interval_days,
--   (sum(case when is_correct then 0 else 1 end) >= 6) as is_leech
-- from public.quiz_attempts
-- group by user_id, question_id
-- on conflict (user_id, question_id) do nothing;
