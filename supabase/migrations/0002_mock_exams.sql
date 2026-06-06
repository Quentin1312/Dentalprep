-- DentalPrep — Migration 0002 : Épreuves blanches chronométrées
-- À exécuter dans l'éditeur SQL de Supabase.

create table if not exists public.mock_exam_sessions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  started_at        timestamptz not null default now(),
  completed_at      timestamptz,
  duration_seconds  integer not null default 3600,            -- 60 min
  total_questions   integer not null,
  question_ids      jsonb not null,                            -- ordre des questions
  answers           jsonb not null default '{}'::jsonb,        -- { question_id: selected_index }
  score_correct     integer not null default 0,
  is_completed      boolean not null default false,
  created_at        timestamptz not null default now()
);

alter table public.mock_exam_sessions enable row level security;

create policy "mock_exam_sessions_own"
  on public.mock_exam_sessions
  for all using (auth.uid() = user_id);

create index if not exists mock_exam_user_started_idx
  on public.mock_exam_sessions (user_id, started_at desc);
