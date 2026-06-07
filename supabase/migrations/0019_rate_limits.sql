-- Per-user sliding-window rate limiter.
-- Events are written atomically by check_rate_limit() when allowed.
-- Old rows are best-effort pruned inside the function so the table stays small.

create table if not exists public.api_rate_events (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  route text not null,
  created_at timestamptz not null default now()
);

create index if not exists api_rate_events_user_route_idx
  on public.api_rate_events (user_id, route, created_at desc);

alter table public.api_rate_events enable row level security;
-- No policies: only the service role (admin client) ever touches this table.

-- Returns true if the request is allowed (and records the event); false if blocked.
create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_route text,
  p_window_secs int,
  p_max int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_since timestamptz := now() - make_interval(secs => p_window_secs);
  v_count int;
begin
  select count(*) into v_count
    from public.api_rate_events
    where user_id = p_user_id
      and route   = p_route
      and created_at >= v_since;

  if v_count >= p_max then
    return false;
  end if;

  insert into public.api_rate_events (user_id, route) values (p_user_id, p_route);

  -- Opportunistic prune: drop this user's events older than 1 hour on every Nth call.
  if random() < 0.05 then
    delete from public.api_rate_events
      where user_id = p_user_id
        and created_at < now() - interval '1 hour';
  end if;

  return true;
end;
$$;
