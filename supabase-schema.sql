-- DentalPrep — Schéma Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase

-- Extension UUID
create extension if not exists "uuid-ossp";

-- Profils utilisateurs (lié à auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  exam_date date,
  daily_goal_minutes integer not null default 30,
  streak integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cours uploadés
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  module_id text not null check (module_id in ('M1','M2','M3','M4','M5','M6','M7')),
  title text not null,
  page_count integer not null default 0,
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Pages OCR des cours
create table public.course_pages (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  page_number integer not null,
  ocr_text text not null default '',
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Flashcards générées
create table public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  module_id text not null check (module_id in ('M1','M2','M3','M4','M5','M6','M7')),
  concept text not null,
  definition text not null,
  created_at timestamptz not null default now()
);

-- Questions de quiz générées
create table public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  module_id text not null check (module_id in ('M1','M2','M3','M4','M5','M6','M7')),
  question text not null,
  choices jsonb not null,
  correct_index integer not null,
  explanation text not null default '',
  created_at timestamptz not null default now()
);

-- Tentatives de quiz (tracking)
create table public.quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  module_id text not null check (module_id in ('M1','M2','M3','M4','M5','M6','M7')),
  question_id uuid references public.quiz_questions(id) on delete cascade not null,
  selected_index integer not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

-- Sessions quotidiennes (streak + temps étudié)
create table public.daily_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  minutes_studied integer not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_pages enable row level security;
alter table public.flashcards enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.daily_sessions enable row level security;

-- Policies : chaque user accède uniquement à ses données
create policy "profiles_own" on public.profiles for all using (auth.uid() = id);
create policy "courses_own" on public.courses for all using (auth.uid() = user_id);
create policy "course_pages_own" on public.course_pages for all using (
  exists (select 1 from public.courses where courses.id = course_pages.course_id and courses.user_id = auth.uid())
);
create policy "flashcards_own" on public.flashcards for all using (auth.uid() = user_id);
create policy "quiz_questions_own" on public.quiz_questions for all using (auth.uid() = user_id);
create policy "quiz_attempts_own" on public.quiz_attempts for all using (auth.uid() = user_id);
create policy "daily_sessions_own" on public.daily_sessions for all using (auth.uid() = user_id);

-- Trigger : créer le profil auto à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Progression des flashcards (mémoire entre sessions)
create table public.flashcard_progress (
  user_id uuid references public.profiles(id) on delete cascade not null,
  flashcard_id uuid references public.flashcards(id) on delete cascade not null,
  status text not null check (status in ('known', 'review')),
  updated_at timestamptz not null default now(),
  primary key (user_id, flashcard_id)
);
alter table public.flashcard_progress enable row level security;
create policy "flashcard_progress_own" on public.flashcard_progress for all using (auth.uid() = user_id);

-- Storage bucket pour les images des cours
insert into storage.buckets (id, name, public) values ('course-images', 'course-images', false);
create policy "course_images_own" on storage.objects for all using (
  bucket_id = 'course-images' and auth.uid()::text = (storage.foldername(name))[1]
);
