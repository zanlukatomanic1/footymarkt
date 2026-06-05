-- Definitive 8-segment equal-weight spin function.
-- Wheel layout (clockwise from 12-o'clock):
--   slot 0: 50  (white)
--   slot 1: 300 (green)
--   slot 2: 100 (white)
--   slot 3: 50  (green)
--   slot 4: 100 (white)
--   slot 5: 500 (green)
--   slot 6: 100 (white)
--   slot 7: 200 (green)
--
-- Each slot has equal 1/8 probability:
--   50  coins → 2/8 = 25.0 %
--   100 coins → 3/8 = 37.5 %
--   200 coins → 1/8 = 12.5 %
--   300 coins → 1/8 = 12.5 %
--   500 coins → 1/8 = 12.5 %

create or replace function public.claim_daily_spin(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today     date  := (now() at time zone 'utc')::date;
  v_rand      float := random();
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
    when v_rand < 2.0/8 then 50    -- slots 0, 3
    when v_rand < 5.0/8 then 100   -- slots 2, 4, 6
    when v_rand < 6.0/8 then 200   -- slot 7
    when v_rand < 7.0/8 then 300   -- slot 1
    else                      500  -- slot 5
  end;

  insert into public.daily_spins (user_id, coins_won)
  values (p_user_id, v_coins_won);

  update public.users
  set coins = coins + v_coins_won
  where id = p_user_id;

  return v_coins_won;
end;
$$;
