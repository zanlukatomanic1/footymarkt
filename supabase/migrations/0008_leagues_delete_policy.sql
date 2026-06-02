-- Only the creator can delete their league.
-- league_members rows are removed automatically via ON DELETE CASCADE.
drop policy if exists "leagues deletable by creator" on public.leagues;

create policy "leagues deletable by creator" on public.leagues
  for delete using (auth.uid() = created_by);
