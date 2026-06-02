-- Fix infinite recursion in league_members SELECT policy.
-- The original policy queried league_members from within its own policy,
-- causing Postgres to recurse infinitely.
-- Solution: a SECURITY DEFINER function reads membership bypassing RLS.

create or replace function public.get_my_league_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select league_id from public.league_members where user_id = auth.uid();
$$;

-- Drop and recreate the offending policy
drop policy if exists "league_members readable to members" on public.league_members;

create policy "league_members readable to members" on public.league_members
  for select using (
    league_id in (select public.get_my_league_ids())
  );
