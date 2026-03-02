-- Viora social layer (MVP)
-- Creates: invites, friendships + RPC helpers + friend-readable RLS (prefs/checkins)
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1) Invites
create table if not exists public.invites (
  code text primary key,
  inviter_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz
);

alter table public.invites enable row level security;

drop policy if exists invites_select_own on public.invites;
create policy invites_select_own
on public.invites for select
using (auth.uid() = inviter_id);

drop policy if exists invites_insert_own on public.invites;
create policy invites_insert_own
on public.invites for insert
with check (auth.uid() = inviter_id);

drop policy if exists invites_delete_own on public.invites;
create policy invites_delete_own
on public.invites for delete
using (auth.uid() = inviter_id);

-- 2) Friendships (store normalized pair user1 < user2)
create table if not exists public.friendships (
  user1 uuid not null references auth.users(id) on delete cascade,
  user2 uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user1, user2),
  check (user1 <> user2)
);

alter table public.friendships enable row level security;

drop policy if exists friendships_select_participant on public.friendships;
create policy friendships_select_participant
on public.friendships for select
using (auth.uid() = user1 or auth.uid() = user2);

drop policy if exists friendships_delete_participant on public.friendships;
create policy friendships_delete_participant
on public.friendships for delete
using (auth.uid() = user1 or auth.uid() = user2);

-- 3) Helpers
create or replace function public.normalize_pair(a uuid, b uuid)
returns table(user1 uuid, user2 uuid)
language sql
immutable
as $$
  select
    case when a::text < b::text then a else b end as user1,
    case when a::text < b::text then b else a end as user2;
$$;

-- 4) RPC: create_invite (revokes older active invites)
create or replace function public.create_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.invites
    set revoked_at = now()
  where inviter_id = v_uid
    and accepted_at is null
    and revoked_at is null;

  v_code := lower(substr(md5(gen_random_uuid()::text), 1, 6));

  insert into public.invites(code, inviter_id, expires_at)
  values (v_code, v_uid, now() + interval '7 days');

  return v_code;
end;
$$;

-- 5) RPC: revoke_invite
create or replace function public.revoke_invite(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  update public.invites
    set revoked_at = now()
  where code = lower(trim(p_code))
    and inviter_id = v_uid
    and revoked_at is null;

  return found;
end;
$$;

-- 6) RPC: accept_invite (creates friendship + marks invite accepted)
create or replace function public.accept_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_inviter uuid;
  a uuid;
  b uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select inviter_id into v_inviter
  from public.invites
  where code = lower(trim(p_code))
    and revoked_at is null
    and accepted_at is null
    and (expires_at is null or expires_at > now())
  for update;

  if v_inviter is null then
    raise exception 'invalid_or_used_invite';
  end if;

  if v_inviter = v_uid then
    raise exception 'cannot_friend_self';
  end if;

  select user1, user2 into a, b from public.normalize_pair(v_uid, v_inviter);

  insert into public.friendships(user1, user2)
  values (a, b)
  on conflict do nothing;

  update public.invites
    set accepted_at = now(),
        accepted_by = v_uid
  where code = lower(trim(p_code))
    and accepted_at is null
    and revoked_at is null;

  return v_inviter;
end;
$$;

grant execute on function public.create_invite() to authenticated;
grant execute on function public.revoke_invite(text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;

-- 7) Friend-readable RLS for profiles/user_prefs/checkins

-- profiles: allow friends to read basic profile
drop policy if exists profiles_select_friends on public.profiles;
create policy profiles_select_friends
on public.profiles for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.friendships f
    where (f.user1 = auth.uid() and f.user2 = profiles.id)
       or (f.user2 = auth.uid() and f.user1 = profiles.id)
  )
);

-- user_prefs: allow friends/public (if not hidden) to read prefs
drop policy if exists prefs_select_shared on public.user_prefs;
create policy prefs_select_shared
on public.user_prefs for select
using (
  auth.uid() = user_id
  or (
    visibility <> 'hidden'
    and (
      visibility = 'public'
      or exists (
        select 1
        from public.friendships f
        where (f.user1 = auth.uid() and f.user2 = user_prefs.user_id)
           or (f.user2 = auth.uid() and f.user1 = user_prefs.user_id)
      )
    )
  )
);

-- checkins: allow friends/public to read latest states if user is not invisible today
drop policy if exists checkins_select_shared on public.checkins;
create policy checkins_select_shared
on public.checkins for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.user_prefs p
    where p.user_id = checkins.user_id
      and p.invisible_today = false
      and p.visibility in ('friends', 'public')
      and (
        p.visibility = 'public'
        or exists (
          select 1
          from public.friendships f
          where (f.user1 = auth.uid() and f.user2 = checkins.user_id)
             or (f.user2 = auth.uid() and f.user1 = checkins.user_id)
        )
      )
  )
);
