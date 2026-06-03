-- Referral system: each user gets a unique referral code.
-- When a referred user makes 3 predictions, the referrer earns 100 coins.
-- Cap: 50 referral bonuses per referrer to limit abuse.

-- ============================================================
-- Schema additions
-- ============================================================

-- Helper to generate an 8-char alphanumeric referral code
create or replace function public.generate_referral_code()
returns text
language sql
as $$
  select substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);
$$;

alter table public.users
  add column if not exists referral_code text unique not null
    default public.generate_referral_code();

alter table public.users
  add column if not exists referred_by uuid references public.users(id);

-- Tracks whether the referrer has received their 100-coin bonus for this user
alter table public.users
  add column if not exists referral_bonus_paid boolean not null default false;

-- Backfill any existing rows that got a null referral_code
-- (shouldn't happen given the default, but just in case)
update public.users
  set referral_code = public.generate_referral_code()
  where referral_code is null;

create index if not exists users_referral_code_idx on public.users (referral_code);
create index if not exists users_referred_by_idx on public.users (referred_by);

-- ============================================================
-- Trigger: award 100 coins to referrer when referred user
-- makes their 3rd prediction (cap: 50 bonuses per referrer).
-- ============================================================

create or replace function public.try_award_referral_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pred_count   int;
  v_referrer_id  uuid;
  v_bonus_count  int;
begin
  -- Only bother counting after we have at least 3
  select count(*) into v_pred_count
    from public.predictions
    where user_id = NEW.user_id;

  if v_pred_count <> 3 then
    return NEW;
  end if;

  -- Find an unpaid referrer for this user
  select referred_by into v_referrer_id
    from public.users
    where id = NEW.user_id
      and referral_bonus_paid = false
      and referred_by is not null;

  if v_referrer_id is null then
    return NEW;
  end if;

  -- Enforce the 50-referral cap on the referrer
  select count(*) into v_bonus_count
    from public.users
    where referred_by = v_referrer_id
      and referral_bonus_paid = true;

  if v_bonus_count >= 50 then
    -- Cap reached — mark paid so we don't check again, but don't award
    update public.users
      set referral_bonus_paid = true
      where id = NEW.user_id;
    return NEW;
  end if;

  -- Award 100 coins to referrer
  update public.users
    set coins = coins + 100
    where id = v_referrer_id;

  -- Mark bonus as paid for the referred user
  update public.users
    set referral_bonus_paid = true
    where id = NEW.user_id;

  return NEW;
end;
$$;

drop trigger if exists on_prediction_check_referral on public.predictions;
create trigger on_prediction_check_referral
  after insert on public.predictions
  for each row execute function public.try_award_referral_bonus();
