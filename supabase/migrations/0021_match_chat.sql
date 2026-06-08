-- Match chat: threaded comments and reactions scoped to a match.

create table if not exists public.match_comments (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  parent_id uuid references public.match_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists match_comments_match_idx on public.match_comments (match_id, created_at);
create index if not exists match_comments_parent_idx on public.match_comments (parent_id);

create table if not exists public.match_comment_reactions (
  comment_id uuid not null references public.match_comments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, emoji)
);

alter table public.match_comments enable row level security;
alter table public.match_comment_reactions enable row level security;

create policy "match_comments readable" on public.match_comments for select using (true);
create policy "match_comments insert self" on public.match_comments for insert with check (auth.uid() = user_id);
create policy "match_comments delete self" on public.match_comments for delete using (auth.uid() = user_id);

create policy "match_comment_reactions readable" on public.match_comment_reactions for select using (true);
create policy "match_comment_reactions write self" on public.match_comment_reactions for insert with check (auth.uid() = user_id);
create policy "match_comment_reactions delete self" on public.match_comment_reactions for delete using (auth.uid() = user_id);
