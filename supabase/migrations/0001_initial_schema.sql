-- FootyMarkt initial schema
-- Run in Supabase SQL editor (or via supabase CLI).

create extension if not exists "pgcrypto";

-- ============================================================
-- users (mirror of auth.users with app-level profile fields)
-- ============================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  coins integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Create a row in public.users whenever a new auth.users row appears.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ============================================================
-- matches
-- ============================================================
create type public.match_outcome as enum ('home', 'draw', 'away');

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  kickoff_at timestamptz not null,
  result public.match_outcome,
  competition text not null default 'WC2026',
  created_at timestamptz not null default now()
);

create index if not exists matches_kickoff_idx on public.matches (kickoff_at);

-- ============================================================
-- predictions
-- ============================================================
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  prediction public.match_outcome not null,
  coins_earned integer not null default 0,
  was_correct boolean,
  created_at timestamptz not null default now(),
  unique (user_id, match_id)
);

create index if not exists predictions_match_idx on public.predictions (match_id);
create index if not exists predictions_user_idx on public.predictions (user_id);

-- ============================================================
-- leagues
-- ============================================================
create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

-- ============================================================
-- Sentiment view: count of each outcome per match
-- ============================================================
create or replace view public.match_sentiment as
select
  m.id as match_id,
  coalesce(sum((p.prediction = 'home')::int), 0)::int as home_count,
  coalesce(sum((p.prediction = 'draw')::int), 0)::int as draw_count,
  coalesce(sum((p.prediction = 'away')::int), 0)::int as away_count,
  count(p.id)::int as total_count
from public.matches m
left join public.predictions p on p.match_id = m.id
group by m.id;

-- ============================================================
-- Award coins for a match. Called by admin after entering result.
-- Multiplier: 1 + (1 - share), where share = same-pick count / total.
-- Base: 100 coins. Only correct predictions earn.
-- ============================================================
create or replace function public.award_match_coins(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.match_outcome;
  v_total int;
  v_winners int;
  v_share numeric;
  v_multiplier numeric;
  v_reward int;
begin
  select result into v_result from public.matches where id = p_match_id;
  if v_result is null then
    raise exception 'Match % has no result set', p_match_id;
  end if;

  select count(*) into v_total from public.predictions where match_id = p_match_id;
  select count(*) into v_winners from public.predictions
    where match_id = p_match_id and prediction = v_result;

  if v_total = 0 then
    return;
  end if;

  v_share := case when v_total > 0 then v_winners::numeric / v_total else 0 end;
  v_multiplier := 1 + (1 - v_share);
  v_reward := round(100 * v_multiplier)::int;

  -- Reset earnings on this match in case re-run
  update public.predictions
    set coins_earned = 0, was_correct = false
    where match_id = p_match_id;

  -- Award winners
  update public.predictions
    set coins_earned = v_reward, was_correct = true
    where match_id = p_match_id and prediction = v_result;

  -- Recompute each user's coin balance from scratch
  update public.users u
    set coins = coalesce(s.total, 0)
    from (
      select user_id, sum(coins_earned)::int as total
      from public.predictions
      group by user_id
    ) s
    where s.user_id = u.id;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.users enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- users: anyone signed-in can read public profile bits; user can update own username.
drop policy if exists "users readable by anyone" on public.users;
create policy "users readable by anyone" on public.users
  for select using (true);

drop policy if exists "users update self" on public.users;
create policy "users update self" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- matches: world-readable; writes only via service role.
drop policy if exists "matches readable" on public.matches;
create policy "matches readable" on public.matches
  for select using (true);

-- predictions: anyone can read counts (used by view); insert/update only own row, and only before kickoff.
drop policy if exists "predictions readable" on public.predictions;
create policy "predictions readable" on public.predictions
  for select using (true);

drop policy if exists "predictions insert self" on public.predictions;
create policy "predictions insert self" on public.predictions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.kickoff_at > now() and m.result is null
    )
  );

drop policy if exists "predictions update self" on public.predictions;
create policy "predictions update self" on public.predictions
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.matches m
      where m.id = match_id and m.kickoff_at > now() and m.result is null
    )
  ) with check (auth.uid() = user_id);

-- leagues: members can read; any signed-in user can create.
drop policy if exists "leagues readable by members" on public.leagues;
create policy "leagues readable by members" on public.leagues
  for select using (
    auth.uid() = created_by
    or exists (
      select 1 from public.league_members lm
      where lm.league_id = id and lm.user_id = auth.uid()
    )
  );

drop policy if exists "leagues insertable by authed" on public.leagues;
create policy "leagues insertable by authed" on public.leagues
  for insert with check (auth.uid() = created_by);

-- league_members: members can read; user can join themselves.
drop policy if exists "league_members readable to members" on public.league_members;
create policy "league_members readable to members" on public.league_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.league_members lm
      where lm.league_id = league_members.league_id and lm.user_id = auth.uid()
    )
  );

drop policy if exists "league_members join self" on public.league_members;
create policy "league_members join self" on public.league_members
  for insert with check (auth.uid() = user_id);
