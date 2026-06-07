-- Stadium / venue name from football-data.org. Nullable — older fixtures may not have it,
-- and the API itself sometimes leaves it empty until close to kickoff.
alter table public.matches
  add column if not exists venue text;
