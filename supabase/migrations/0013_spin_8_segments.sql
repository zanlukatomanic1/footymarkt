-- Update daily spin odds to match 8-segment wheel:
-- 50 coins  ×2 → 25.0 %
-- 100 coins ×3 → 37.5 %
-- 200 coins ×1 → 12.5 %
-- 300 coins ×1 → 12.5 %
-- 500 coins ×1 → 12.5 %

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
    when v_rand < 2.0/8 then 50
    when v_rand < 5.0/8 then 100
    when v_rand < 6.0/8 then 200
    when v_rand < 7.0/8 then 300
    else 500
  end;

  insert into public.daily_spins (user_id, coins_won)
  values (p_user_id, v_coins_won);

  update public.users
  set coins = coins + v_coins_won
  where id = p_user_id;

  return v_coins_won;
end;
$$;
