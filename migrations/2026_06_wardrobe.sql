-- Migration : garde-robe du compagnon (équipements par slot)
-- À exécuter dans l'éditeur SQL de Supabase.

alter table public.profiles
  add column if not exists equipped_accessories jsonb not null default '{}'::jsonb;
