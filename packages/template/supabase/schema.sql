-- {{PROJECT_NAME_TITLE}} Database Schema
-- Run this in your Supabase SQL Editor

-- ─────────────────────────────────────────
-- items — example table with RLS
-- ─────────────────────────────────────────
create table if not exists items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  title       text not null,
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- push_subscriptions — for push notifications
-- ─────────────────────────────────────────
create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  device_id    text not null,
  user_id      uuid references auth.users on delete set null,
  subscription jsonb not null,
  timezone     text,
  created_at   timestamptz not null default now(),
  unique (device_id)
);

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────
alter table items               enable row level security;
alter table push_subscriptions  enable row level security;

create policy "users manage own items"
  on items for all using (auth.uid() = user_id);

create policy "users manage own push subscriptions"
  on push_subscriptions for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Auto-update updated_at
-- ─────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_updated_at
  before update on items
  for each row execute function update_updated_at();
