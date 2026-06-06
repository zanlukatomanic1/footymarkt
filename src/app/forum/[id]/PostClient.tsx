"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/dates";

const EMOJIS = ["👍", "❤️", "😂", "😮", "🔥", "⚽"];

type Post = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  users: { username: string | null } | null;
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  users: { username: string | null } | null;
};

type Reaction = { user_id: string; emoji: string };

export default function ForumPostClient({ id }: { id: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [postReactions, setPostReactions] = useState<Reaction[]>([]);
  const [commentReactions, setCommentReactions] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user?.id ?? null);

    const { data: d } = await supabase
      .from("forum_posts")
      .select("id, user_id, title, description, created_at")
      .eq("id", id)
      .maybeSingle();
    if (!d) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const [{ data: cs }, { data: prs }] = await Promise.all([
      supabase
        .from("forum_comments")
        .select("id, post_id, user_id, parent_id, body, created_at")
        .eq("post_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("forum_post_reactions").select("user_id, emoji").eq("post_id", id),
    ]);

    const csList = (cs ?? []) as any[];
    const userIds = Array.from(new Set([d.user_id, ...csList.map((c) => c.user_id)]));
    const { data: usersData } = await supabase
      .from("users")
      .select("id, username")
      .in("id", userIds);
    const byId: Record<string, string | null> = {};
    ((usersData ?? []) as any[]).forEach((u) => (byId[u.id] = u.username));

    setPost({ ...(d as any), users: { username: byId[d.user_id] ?? null } });
    setComments(
      csList.map((c) => ({ ...c, users: { username: byId[c.user_id] ?? null } })) as any
    );
    setPostReactions((prs ?? []) as any);

    const commentIds = ((cs ?? []) as any[]).map((c) => c.id);
    if (commentIds.length) {
      const { data: cr } = await supabase
        .from("forum_comment_reactions")
        .select("comment_id, user_id, emoji")
        .in("comment_id", commentIds);
      const grouped: Record<string, Reaction[]> = {};
      ((cr ?? []) as any[]).forEach((r) => {
        (grouped[r.comment_id] ??= []).push({ user_id: r.user_id, emoji: r.emoji });
      });
      setCommentReactions(grouped);
    } else {
      setCommentReactions({});
    }

    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const postComment = async (parentId: string | null) => {
    if (!me) return;
    const body = (parentId ? replyBody : newComment).trim();
    if (!body) return;
    await supabase.from("forum_comments").insert({
      post_id: id,
      user_id: me,
      parent_id: parentId,
      body,
    });
    if (parentId) {
      setReplyBody("");
      setReplyTo(null);
    } else {
      setNewComment("");
    }
    load();
  };

  const startEdit = () => {
    if (!post) return;
    setEditTitle(post.title);
    setEditDescription(post.description);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!post || !editTitle.trim() || !editDescription.trim()) return;
    setSavingEdit(true);
    await supabase
      .from("forum_posts")
      .update({ title: editTitle.trim(), description: editDescription.trim() })
      .eq("id", post.id);
    setEditing(false);
    setSavingEdit(false);
    load();
  };

  const deletePost = async () => {
    if (!post) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await supabase.from("forum_posts").delete().eq("id", post.id);
    router.push("/forum");
    router.refresh();
  };

  const togglePostReaction = async (emoji: string) => {
    if (!me) return;
    const has = postReactions.some((r) => r.user_id === me && r.emoji === emoji);
    if (has) {
      await supabase
        .from("forum_post_reactions")
        .delete()
        .eq("post_id", id)
        .eq("user_id", me)
        .eq("emoji", emoji);
    } else {
      await supabase
        .from("forum_post_reactions")
        .insert({ post_id: id, user_id: me, emoji });
    }
    load();
  };

  const toggleCommentReaction = async (commentId: string, emoji: string) => {
    if (!me) return;
    const list = commentReactions[commentId] ?? [];
    const has = list.some((r) => r.user_id === me && r.emoji === emoji);
    if (has) {
      await supabase
        .from("forum_comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", me)
        .eq("emoji", emoji);
    } else {
      await supabase
        .from("forum_comment_reactions")
        .insert({ comment_id: commentId, user_id: me, emoji });
    }
    load();
  };

  if (loading) {
    return <div className="font-mono text-[11px] text-ink-faint">Loading...</div>;
  }
  if (notFound || !post) {
    return (
      <div className="rounded-[12px] border border-dashed border-line-subtle bg-card py-12 text-center">
        <div className="mb-2 font-mono text-[11px] text-ink-silent">Post not found.</div>
        <Link href="/forum" className="text-[12.5px] text-brand">Back to forum</Link>
      </div>
    );
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/forum" className="font-mono text-[11px] text-ink-faint hover:text-ink-muted">
        ← All posts
      </Link>

      {/* Post */}
      <div className="rounded-[12px] border border-line bg-card p-5">
        {editing ? (
          <div className="flex flex-col gap-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={140}
              className="rounded-[8px] border border-line bg-element px-3 py-2.5 text-[15px] font-semibold text-ink outline-none focus:border-line-strong"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={5}
              className="resize-none rounded-[8px] border border-line bg-element px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-line-strong"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-[8px] border border-line px-3 py-[6px] text-[12px] text-ink-muted hover:border-line-strong"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={savingEdit || !editTitle.trim() || !editDescription.trim()}
                className="rounded-[8px] bg-brand px-3 py-[6px] text-[12px] font-semibold text-[#080808] disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="text-[18px] font-bold tracking-[-0.2px] text-ink">
                {post.title}
              </div>
              {me === post.user_id && (
                <div className="flex flex-shrink-0 gap-1.5">
                  <button
                    onClick={startEdit}
                    className="rounded-[6px] border border-line px-2 py-[3px] font-mono text-[10.5px] text-ink-muted hover:border-line-strong hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    onClick={deletePost}
                    className="rounded-[6px] border border-line px-2 py-[3px] font-mono text-[10.5px] text-red-400 hover:border-red-400/50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="mb-3 font-mono text-[11px] text-ink-faint">
              @{post.users?.username ?? "—"} · {formatRelative(post.created_at)}
            </div>
            <div className="mb-4 whitespace-pre-wrap text-[14px] text-ink-muted">
              {post.description}
            </div>
            <ReactionBar
              emojis={EMOJIS}
              reactions={postReactions}
              me={me}
              onToggle={togglePostReaction}
            />
          </>
        )}
      </div>

      {/* New comment */}
      {me ? (
        <div className="rounded-[12px] border border-line bg-card p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder="Add a comment..."
            className="w-full resize-none rounded-[8px] border border-line bg-element px-3 py-2 text-[13.5px] text-ink outline-none focus:border-line-strong"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => postComment(null)}
              disabled={!newComment.trim()}
              className="rounded-[8px] bg-brand px-4 py-[7px] text-[12.5px] font-semibold text-[#080808] disabled:opacity-50"
            >
              Comment
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-line-subtle bg-card p-4 text-center font-mono text-[11px] text-ink-silent">
          <Link href="/login" className="text-brand">Sign in</Link> to comment and react.
        </div>
      )}

      {/* Comments */}
      <div className="flex flex-col gap-3">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </div>
        {topLevel.map((c) => (
          <div key={c.id} className="rounded-[12px] border border-line bg-card p-4">
            <CommentBody
              c={c}
              reactions={commentReactions[c.id] ?? []}
              me={me}
              onToggleReaction={(emoji) => toggleCommentReaction(c.id, emoji)}
              onReply={() => {
                setReplyTo(c.id);
                setReplyBody("");
              }}
            />

            {replyTo === c.id && (
              <div className="mt-3 pl-4 border-l border-line-subtle">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={2}
                  placeholder="Write a reply..."
                  className="w-full resize-none rounded-[8px] border border-line bg-element px-3 py-2 text-[13px] text-ink outline-none focus:border-line-strong"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setReplyTo(null)}
                    className="rounded-[8px] border border-line px-3 py-[6px] text-[12px] text-ink-muted hover:border-line-strong"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => postComment(c.id)}
                    disabled={!replyBody.trim()}
                    className="rounded-[8px] bg-brand px-3 py-[6px] text-[12px] font-semibold text-[#080808] disabled:opacity-50"
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}

            {repliesOf(c.id).length > 0 && (
              <div className="mt-3 flex flex-col gap-3 pl-4 border-l border-line-subtle">
                {repliesOf(c.id).map((r) => (
                  <div key={r.id} className="rounded-[8px] bg-element p-3">
                    <CommentBody
                      c={r}
                      reactions={commentReactions[r.id] ?? []}
                      me={me}
                      onToggleReaction={(emoji) => toggleCommentReaction(r.id, emoji)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommentBody({
  c,
  reactions,
  me,
  onToggleReaction,
  onReply,
}: {
  c: Comment;
  reactions: Reaction[];
  me: string | null;
  onToggleReaction: (emoji: string) => void;
  onReply?: () => void;
}) {
  return (
    <>
      <div className="mb-1 flex items-center gap-2 font-mono text-[11px] text-ink-faint">
        <span className="text-ink-muted">@{c.users?.username ?? "—"}</span>
        <span>·</span>
        <span>{formatRelative(c.created_at)}</span>
      </div>
      <div className="mb-2 whitespace-pre-wrap text-[13.5px] text-ink">{c.body}</div>
      <div className="flex items-center gap-2">
        <ReactionBar emojis={EMOJIS} reactions={reactions} me={me} onToggle={onToggleReaction} />
        {onReply && me && (
          <button
            onClick={onReply}
            className="ml-auto font-mono text-[11px] text-ink-faint hover:text-ink-muted"
          >
            Reply
          </button>
        )}
      </div>
    </>
  );
}

function ReactionBar({
  emojis,
  reactions,
  me,
  onToggle,
}: {
  emojis: string[];
  reactions: Reaction[];
  me: string | null;
  onToggle: (emoji: string) => void;
}) {
  const counts: Record<string, number> = {};
  const mine = new Set<string>();
  reactions.forEach((r) => {
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
    if (r.user_id === me) mine.add(r.emoji);
  });

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {emojis.map((e) => {
        const count = counts[e] ?? 0;
        const active = mine.has(e);
        return (
          <button
            key={e}
            onClick={() => onToggle(e)}
            disabled={!me}
            className="flex items-center gap-1 rounded-full border px-2 py-[3px] text-[12px] transition-colors disabled:opacity-50"
            style={{
              borderColor: active ? "var(--color-brand)" : "var(--color-line)",
              background: active ? "rgba(0,255,135,0.08)" : "transparent",
            }}
          >
            <span>{e}</span>
            {count > 0 && (
              <span className="font-mono text-[10.5px] text-ink-muted">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
