-- DentalPrep — Migration 004 : Drill codes CCAM
-- Pool de codes (libellé + code) + tracking par utilisateur.
-- À exécuter dans l'éditeur SQL de Supabase.

create extension if not exists "uuid-ossp";

-- Pool des codes à apprendre (par utilisateur, pour qu'on puisse en ajouter
-- via le même mécanisme que les exos pratiques)
create table public.ccam_codes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text not null,                     -- ex: "HBGD036" ou "BR4"
  label text not null,                    -- description de l'acte
  family text not null,                   -- "radio", "avulsion", "restauration", ...
  created_at timestamptz not null default now(),
  unique(user_id, code)
);

create index ccam_codes_user_idx on public.ccam_codes(user_id);
create index ccam_codes_family_idx on public.ccam_codes(family);

-- Tentatives drill — chaque réponse à une question du drill
create table public.ccam_drill_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  code text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index ccam_drill_attempts_user_idx on public.ccam_drill_attempts(user_id);
create index ccam_drill_attempts_code_idx on public.ccam_drill_attempts(code);

-- RLS
alter table public.ccam_codes enable row level security;
alter table public.ccam_drill_attempts enable row level security;

create policy "ccam_codes owner read"   on public.ccam_codes for select using (auth.uid() = user_id);
create policy "ccam_codes owner insert" on public.ccam_codes for insert with check (auth.uid() = user_id);
create policy "ccam_codes owner update" on public.ccam_codes for update using (auth.uid() = user_id);
create policy "ccam_codes owner delete" on public.ccam_codes for delete using (auth.uid() = user_id);

create policy "ccam_drill_attempts owner read"   on public.ccam_drill_attempts for select using (auth.uid() = user_id);
create policy "ccam_drill_attempts owner insert" on public.ccam_drill_attempts for insert with check (auth.uid() = user_id);
