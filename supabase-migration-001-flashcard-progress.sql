-- Migration 001 — Table flashcard_progress
-- À exécuter dans l'éditeur SQL Supabase (une seule fois)

create table if not exists public.flashcard_progress (
  user_id uuid references public.profiles(id) on delete cascade not null,
  flashcard_id uuid references public.flashcards(id) on delete cascade not null,
  status text not null check (status in ('known', 'review')),
  updated_at timestamptz not null default now(),
  primary key (user_id, flashcard_id)
);

alter table public.flashcard_progress enable row level security;

create policy "flashcard_progress_own" on public.flashcard_progress
  for all using (auth.uid() = user_id);
