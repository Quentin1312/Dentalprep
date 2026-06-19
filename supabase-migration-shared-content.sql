-- ════════════════════════════════════════════════════════════════════
-- Migration : contenu partagé entre tous les utilisateurs
-- ════════════════════════════════════════════════════════════════════
-- Problème : toutes les courses / questions / flashcards / exos / codes
-- CCAM ont été créés avec mon user_id, donc les autres comptes ne voient
-- rien (RLS bloque + queries filtrent par user_id).
--
-- Solution : RLS ouverte en LECTURE sur les tables de CONTENU pour tout
-- utilisateur authentifié. INSERT / UPDATE / DELETE restent réservés au
-- propriétaire (= moi, l'auteur du contenu).
--
-- Tables CONTENU (lecture partagée) :
--   - courses, course_pages, quiz_questions, flashcards,
--     practical_exercises, ccam_codes
--
-- Tables ACTIVITÉ (lecture privée — inchangées) :
--   - profiles, quiz_attempts, daily_sessions, flashcard_progress,
--     quiz_question_progress, practical_attempts, ccam_drill_attempts,
--     mock_exam_sessions
-- ════════════════════════════════════════════════════════════════════

-- ─── COURSES ────────────────────────────────────────────────────────
drop policy if exists "courses_own"            on public.courses;
drop policy if exists "courses_read_all"       on public.courses;
drop policy if exists "courses_owner_write"    on public.courses;
create policy "courses_read_all"    on public.courses
  for select to authenticated using (true);
create policy "courses_owner_write" on public.courses
  for insert to authenticated with check (auth.uid() = user_id);
create policy "courses_owner_update" on public.courses
  for update to authenticated using (auth.uid() = user_id);
create policy "courses_owner_delete" on public.courses
  for delete to authenticated using (auth.uid() = user_id);

-- ─── COURSE_PAGES ───────────────────────────────────────────────────
drop policy if exists "course_pages_own"            on public.course_pages;
drop policy if exists "course_pages_read_all"       on public.course_pages;
drop policy if exists "course_pages_owner_write"    on public.course_pages;
create policy "course_pages_read_all"    on public.course_pages
  for select to authenticated using (true);
create policy "course_pages_owner_write" on public.course_pages
  for all to authenticated using (
    exists (select 1 from public.courses
            where courses.id = course_pages.course_id
              and courses.user_id = auth.uid())
  );

-- ─── QUIZ_QUESTIONS ─────────────────────────────────────────────────
drop policy if exists "quiz_questions_own"            on public.quiz_questions;
drop policy if exists "quiz_questions_read_all"       on public.quiz_questions;
drop policy if exists "quiz_questions_owner_write"    on public.quiz_questions;
create policy "quiz_questions_read_all"    on public.quiz_questions
  for select to authenticated using (true);
create policy "quiz_questions_owner_write" on public.quiz_questions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "quiz_questions_owner_update" on public.quiz_questions
  for update to authenticated using (auth.uid() = user_id);
create policy "quiz_questions_owner_delete" on public.quiz_questions
  for delete to authenticated using (auth.uid() = user_id);

-- ─── FLASHCARDS ─────────────────────────────────────────────────────
drop policy if exists "flashcards_own"            on public.flashcards;
drop policy if exists "flashcards_read_all"       on public.flashcards;
drop policy if exists "flashcards_owner_write"    on public.flashcards;
create policy "flashcards_read_all"    on public.flashcards
  for select to authenticated using (true);
create policy "flashcards_owner_write" on public.flashcards
  for insert to authenticated with check (auth.uid() = user_id);
create policy "flashcards_owner_update" on public.flashcards
  for update to authenticated using (auth.uid() = user_id);
create policy "flashcards_owner_delete" on public.flashcards
  for delete to authenticated using (auth.uid() = user_id);

-- ─── PRACTICAL_EXERCISES ────────────────────────────────────────────
drop policy if exists "practical_exercises_own"            on public.practical_exercises;
drop policy if exists "practical_exercises_read_all"       on public.practical_exercises;
drop policy if exists "practical_exercises_owner_write"    on public.practical_exercises;
create policy "practical_exercises_read_all"    on public.practical_exercises
  for select to authenticated using (true);
create policy "practical_exercises_owner_write" on public.practical_exercises
  for insert to authenticated with check (auth.uid() = user_id);
create policy "practical_exercises_owner_update" on public.practical_exercises
  for update to authenticated using (auth.uid() = user_id);
create policy "practical_exercises_owner_delete" on public.practical_exercises
  for delete to authenticated using (auth.uid() = user_id);

-- ─── CCAM_CODES ─────────────────────────────────────────────────────
drop policy if exists "ccam_codes_own"            on public.ccam_codes;
drop policy if exists "ccam_codes_read_all"       on public.ccam_codes;
drop policy if exists "ccam_codes_owner_write"    on public.ccam_codes;
create policy "ccam_codes_read_all"    on public.ccam_codes
  for select to authenticated using (true);
create policy "ccam_codes_owner_write" on public.ccam_codes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "ccam_codes_owner_update" on public.ccam_codes
  for update to authenticated using (auth.uid() = user_id);
create policy "ccam_codes_owner_delete" on public.ccam_codes
  for delete to authenticated using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
-- Storage : course-images doit être lisible par tous les users authentifiés
-- ════════════════════════════════════════════════════════════════════
drop policy if exists "course_images_own"      on storage.objects;
drop policy if exists "course_images_read_all" on storage.objects;
drop policy if exists "course_images_owner_write" on storage.objects;
create policy "course_images_read_all" on storage.objects
  for select to authenticated using (bucket_id = 'course-images');
create policy "course_images_owner_write" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'course-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "course_images_owner_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'course-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "course_images_owner_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'course-images' and auth.uid()::text = (storage.foldername(name))[1]
  );
