-- Viora schema init (MVP)
-- Creates: profiles, user_prefs, checkins + RLS + trigger on signup

create extension if not exists pgcrypto;

-- 1) profiles (basic user profile)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  display_name text,
  avatar_url text
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- 2) user prefs (privacy + feed detail)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'visibility_level') then
    create type public.visibility_level as enum ('public', 'friends', 'hidden');
  end if;

  if not exists (select 1 from pg_type where typname = 'feed_detail_level') then
    create type public.feed_detail_level as enum ('color', 'icon', 'text');
  end if;
end $$;

create table if not exists public.user_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  visibility public.visibility_level not null default 'friends',
  feed_detail public.feed_detail_level not null default 'icon',
  invisible_today boolean not null default false
);

alter table public.user_prefs enable row level security;

drop policy if exists "prefs_select_own" on public.user_prefs;
create policy "prefs_select_own"
on public.user_prefs for select
using (auth.uid() = user_id);

drop policy if exists "prefs_insert_own" on public.user_prefs;
create policy "prefs_insert_own"
on public.user_prefs for insert
with check (auth.uid() = user_id);

drop policy if exists "prefs_update_own" on public.user_prefs;
create policy "prefs_update_own"
on public.user_prefs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3) checkins (daily result)
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  day date not null,
  score int not null,
  color text not null,
  title text not null,
  blurb text,
  tip text,
  payload jsonb not null default '{}'::jsonb,
  unique (user_id, day)
);

create index if not exists checkins_user_day_idx on public.checkins(user_id, day);

alter table public.checkins enable row level security;

drop policy if exists "checkins_select_own" on public.checkins;
create policy "checkins_select_own"
on public.checkins for select
using (auth.uid() = user_id);

drop policy if exists "checkins_insert_own" on public.checkins;
create policy "checkins_insert_own"
on public.checkins for insert
with check (auth.uid() = user_id);

drop policy if exists "checkins_update_own" on public.checkins;
create policy "checkins_update_own"
on public.checkins for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "checkins_delete_own" on public.checkins;
create policy "checkins_delete_own"
on public.checkins for delete
using (auth.uid() = user_id);

-- 4) signup trigger: auto-create profile + prefs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email), null)
  on conflict (id) do nothing;

  insert into public.user_prefs (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
