-- ════════════════════════════════════════════════════════════════════
-- Migration : fiches de révision (lesson_sheets) + tagging questions
-- ════════════════════════════════════════════════════════════════════

-- Nouvelle table : contenu pédagogique structuré par chapitre
create table if not exists public.lesson_sheets (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade not null,
  slug text not null,                  -- ex: "traumatologie"
  n integer not null,                  -- ordre d'affichage dans le fascicule
  title text not null,                 -- ex: "Traumatologie"
  emoji text,                          -- ex: "🦷"
  subtitle text,                       -- sous-titre court
  content jsonb not null,              -- structure : sections + blocks
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

alter table public.lesson_sheets enable row level security;

drop policy if exists "lesson_sheets_read_all"     on public.lesson_sheets;
drop policy if exists "lesson_sheets_owner_write"  on public.lesson_sheets;
drop policy if exists "lesson_sheets_owner_update" on public.lesson_sheets;
drop policy if exists "lesson_sheets_owner_delete" on public.lesson_sheets;
create policy "lesson_sheets_read_all"    on public.lesson_sheets
  for select to authenticated using (true);
create policy "lesson_sheets_owner_write" on public.lesson_sheets
  for insert to authenticated with check (
    exists (select 1 from public.courses
            where courses.id = lesson_sheets.course_id
              and courses.user_id = auth.uid())
  );
create policy "lesson_sheets_owner_update" on public.lesson_sheets
  for update to authenticated using (
    exists (select 1 from public.courses
            where courses.id = lesson_sheets.course_id
              and courses.user_id = auth.uid())
  );
create policy "lesson_sheets_owner_delete" on public.lesson_sheets
  for delete to authenticated using (
    exists (select 1 from public.courses
            where courses.id = lesson_sheets.course_id
              and courses.user_id = auth.uid())
  );

-- Lien quiz_questions → lesson_sheets (par slug, optionnel)
alter table public.quiz_questions
  add column if not exists lesson_slug text;

create index if not exists quiz_questions_lesson_slug_idx
  on public.quiz_questions (course_id, module_id, lesson_slug);
