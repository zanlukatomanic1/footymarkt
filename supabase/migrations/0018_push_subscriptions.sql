-- Web Push subscriptions. One row per (user, endpoint). A user can have
-- multiple devices, so user_id is NOT unique.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Only the owner can read or delete their subscriptions.
drop policy if exists "push readable self" on public.push_subscriptions;
create policy "push readable self" on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push delete self" on public.push_subscriptions;
create policy "push delete self" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- Inserts/updates happen via the service role from the API route, so no
-- insert/update policy is exposed to anon/authenticated roles.
