-- Daily spin: users can spin the wheel once per UTC day to win coins.

-- ============================================================
-- daily_spins table
-- ============================================================
create table if not exists public.daily_spins (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.users(id) on delete cascade,
  coins_won  integer     not null,
  spun_at    timestamptz not null default now()
);

create index if not exists daily_spins_user_date_idx
  on public.daily_spins (user_id, spun_at);

-- RLS: users can only read their own spins
alter table public.daily_spins enable row level security;

drop policy if exists "daily_spins readable by owner" on public.daily_spins;
create policy "daily_spins readable by owner" on public.daily_spins
  for select using (auth.uid() = user_id);

-- ============================================================
-- claim_daily_spin(p_user_id)
--
-- Wheel segments (7 tiers, weighted):
--   50   coins — 30 %
--   100  coins — 25 %
--   150  coins — 20 %
--   200  coins — 13 %
--   300  coins —  7 %
--   500  coins —  4 %
--   1000 coins —  1 %
--
-- Returns: coins_won (integer)
-- Raises:  'already_spun_today' if the user already spun today (UTC)
-- ============================================================
create or replace function public.claim_daily_spin(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today     date    := (now() at time zone 'utc')::date;
  v_rand      float   := random();
  v_coins_won integer;
begin
  if exists (
    select 1 from public.daily_spins
    where user_id = p_user_id
      and (spun_at at time zone 'utc')::date = v_today
  ) then
    raise exception 'already_spun_today';
  end if;

  v_coins_won := case
    when v_rand < 0.30 then 50
    when v_rand < 0.55 then 100
    when v_rand < 0.75 then 150
    when v_rand < 0.88 then 200
    when v_rand < 0.95 then 300
    when v_rand < 0.99 then 500
    else 1000
  end;

  insert into public.daily_spins (user_id, coins_won)
  values (p_user_id, v_coins_won);

  update public.users
  set coins = coins + v_coins_won
  where id = p_user_id;

  return v_coins_won;
end;
$$;

-- ============================================================
-- has_spun_today(p_user_id)
-- Lightweight check used by the UI to show/disable the spin button.
-- Returns true if the user already spun today (UTC).
-- ============================================================
create or replace function public.has_spun_today(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.daily_spins
    where user_id = p_user_id
      and (spun_at at time zone 'utc')::date = (now() at time zone 'utc')::date
  );
$$;
