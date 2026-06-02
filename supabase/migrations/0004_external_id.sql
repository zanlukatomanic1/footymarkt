-- Link matches to football-data.org fixture IDs
alter table matches
  add column if not exists external_id integer unique;
