-- Allow any authenticated user to read leagues.
-- Previously only members/creators could read them, which meant
-- a non-member couldn't look up a league by invite code to join it.
drop policy if exists "leagues readable by members" on public.leagues;

create policy "leagues readable by authed" on public.leagues
  for select using (auth.uid() is not null);
