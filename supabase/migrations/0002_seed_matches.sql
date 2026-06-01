-- Seed: first 10 WC 2026 group stage matches.
-- Kickoff times are placeholder UTC; adjust once FIFA confirms the full slate.

insert into public.matches (home_team, away_team, kickoff_at, competition) values
  ('Mexico',       'TBD A2',     '2026-06-11 19:00+00', 'WC2026'),
  ('Canada',       'TBD B2',     '2026-06-12 19:00+00', 'WC2026'),
  ('USA',          'TBD C2',     '2026-06-12 22:00+00', 'WC2026'),
  ('Argentina',    'TBD D2',     '2026-06-13 19:00+00', 'WC2026'),
  ('England',      'TBD E2',     '2026-06-13 22:00+00', 'WC2026'),
  ('France',       'TBD F2',     '2026-06-14 19:00+00', 'WC2026'),
  ('Brazil',       'TBD G2',     '2026-06-14 22:00+00', 'WC2026'),
  ('Germany',      'TBD H2',     '2026-06-15 19:00+00', 'WC2026'),
  ('Spain',        'TBD I2',     '2026-06-15 22:00+00', 'WC2026'),
  ('Portugal',     'TBD J2',     '2026-06-16 19:00+00', 'WC2026')
on conflict do nothing;
