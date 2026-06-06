-- Forum: user-created posts with threaded comments and emoji reactions.

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  created_at timestamptz not null default now()
);
create index if not exists forum_posts_created_idx on public.forum_posts (created_at desc);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  parent_id uuid references public.forum_comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists forum_comments_post_idx on public.forum_comments (post_id);
create index if not exists forum_comments_parent_idx on public.forum_comments (parent_id);

create table if not exists public.forum_post_reactions (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, emoji)
);

create table if not exists public.forum_comment_reactions (
  comment_id uuid not null references public.forum_comments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, emoji)
);

alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
alter table public.forum_post_reactions enable row level security;
alter table public.forum_comment_reactions enable row level security;

drop policy if exists "forum_posts readable" on public.forum_posts;
create policy "forum_posts readable" on public.forum_posts for select using (true);
drop policy if exists "forum_posts insert self" on public.forum_posts;
create policy "forum_posts insert self" on public.forum_posts for insert with check (auth.uid() = user_id);
drop policy if exists "forum_posts delete self" on public.forum_posts;
create policy "forum_posts delete self" on public.forum_posts for delete using (auth.uid() = user_id);

drop policy if exists "forum_comments readable" on public.forum_comments;
create policy "forum_comments readable" on public.forum_comments for select using (true);
drop policy if exists "forum_comments insert self" on public.forum_comments;
create policy "forum_comments insert self" on public.forum_comments for insert with check (auth.uid() = user_id);
drop policy if exists "forum_comments delete self" on public.forum_comments;
create policy "forum_comments delete self" on public.forum_comments for delete using (auth.uid() = user_id);

drop policy if exists "forum_post_reactions readable" on public.forum_post_reactions;
create policy "forum_post_reactions readable" on public.forum_post_reactions for select using (true);
drop policy if exists "forum_post_reactions write self" on public.forum_post_reactions;
create policy "forum_post_reactions write self" on public.forum_post_reactions for insert with check (auth.uid() = user_id);
drop policy if exists "forum_post_reactions delete self" on public.forum_post_reactions;
create policy "forum_post_reactions delete self" on public.forum_post_reactions for delete using (auth.uid() = user_id);

drop policy if exists "forum_comment_reactions readable" on public.forum_comment_reactions;
create policy "forum_comment_reactions readable" on public.forum_comment_reactions for select using (true);
drop policy if exists "forum_comment_reactions write self" on public.forum_comment_reactions;
create policy "forum_comment_reactions write self" on public.forum_comment_reactions for insert with check (auth.uid() = user_id);
drop policy if exists "forum_comment_reactions delete self" on public.forum_comment_reactions;
create policy "forum_comment_reactions delete self" on public.forum_comment_reactions for delete using (auth.uid() = user_id);
