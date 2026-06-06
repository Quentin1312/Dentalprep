-- DentalPrep — Migration 0003 : notifications push (Web Push API)
-- À exécuter dans l'éditeur SQL de Supabase.

-- Table des abonnements push : 1 entrée par appareil (un user peut en avoir plusieurs)
create table if not exists public.push_subscriptions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  endpoint      text not null unique,        -- URL du push service (FCM, Mozilla, Apple)
  p256dh        text not null,                -- clé publique
  auth          text not null,                -- secret d'auth
  user_agent    text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  last_error    text,
  failure_count integer not null default 0
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_own"
  on public.push_subscriptions
  for all using (auth.uid() = user_id);

create index if not exists push_sub_user_idx
  on public.push_subscriptions (user_id);

-- Préférences de rappel sur profiles
alter table public.profiles
  add column if not exists reminders_enabled boolean not null default false;
alter table public.profiles
  add column if not exists reminder_time text;        -- 'HH:MM' (ex. '19:00')
alter table public.profiles
  add column if not exists reminder_tz text;          -- ex. 'Europe/Paris'
alter table public.profiles
  add column if not exists last_reminder_sent_at timestamptz;
