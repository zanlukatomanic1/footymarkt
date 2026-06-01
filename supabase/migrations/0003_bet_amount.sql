-- Add bet_amount to predictions
alter table public.predictions
  add column if not exists bet_amount integer not null default 100;

-- Rewrite award_match_coins to use per-prediction bet_amount
-- Winners receive bet_amount * multiplier coins added to their balance.
-- Losers keep their coins already deducted (no extra change).
create or replace function public.award_match_coins(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.match_outcome;
  v_total   int;
  v_winners int;
  v_share   numeric;
  v_multiplier numeric;
begin
  select result into v_result from public.matches where id = p_match_id;
  if v_result is null then
    raise exception 'Match % has no result set', p_match_id;
  end if;

  select count(*) into v_total from public.predictions where match_id = p_match_id;
  select count(*) into v_winners from public.predictions
    where match_id = p_match_id and prediction = v_result;

  if v_total = 0 then
    return;
  end if;

  v_share      := case when v_total > 0 then v_winners::numeric / v_total else 0 end;
  v_multiplier := 1 + (1 - v_share);

  -- Mark all losers (reset in case of re-run)
  update public.predictions
    set was_correct = false, coins_earned = 0
    where match_id = p_match_id;

  -- Mark winners and compute their individual reward
  update public.predictions
    set
      was_correct  = true,
      coins_earned = round(bet_amount * v_multiplier)::int
    where match_id = p_match_id and prediction = v_result;

  -- Credit winners' balances (add reward, not recompute from scratch)
  update public.users u
    set coins = u.coins + p.coins_earned
    from public.predictions p
    where p.match_id = p_match_id
      and p.user_id  = u.id
      and p.was_correct = true;
end;
$$;
