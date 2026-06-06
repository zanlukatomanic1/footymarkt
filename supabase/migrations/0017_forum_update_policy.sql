-- Allow forum post/comment authors to edit their own content.

drop policy if exists "forum_posts update self" on public.forum_posts;
create policy "forum_posts update self" on public.forum_posts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "forum_comments update self" on public.forum_comments;
create policy "forum_comments update self" on public.forum_comments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
