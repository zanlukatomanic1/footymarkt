-- Prevent referred_by from being changed once set.
-- This closes the gap where a user could overwrite their referrer
-- by calling the Supabase client directly.

create or replace function public.lock_referred_by()
returns trigger
language plpgsql
as $$
begin
  if OLD.referred_by is not null and NEW.referred_by is distinct from OLD.referred_by then
    raise exception 'referred_by cannot be changed once set';
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_users_lock_referred_by on public.users;
create trigger on_users_lock_referred_by
  before update on public.users
  for each row execute function public.lock_referred_by();
