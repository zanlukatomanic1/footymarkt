-- Temporarily replace spin wheel with fixed 100-coin daily claim.
create or replace function public.claim_daily_spin(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
begin
  if exists (
    select 1 from public.daily_spins
    where user_id = p_user_id
      and (spun_at at time zone 'utc')::date = v_today
  ) then
    raise exception 'already_spun_today';
  end if;

  insert into public.daily_spins (user_id, coins_won)
  values (p_user_id, 100);

  update public.users
  set coins = coins + 100
  where id = p_user_id;

  return 100;
end;
$$;
