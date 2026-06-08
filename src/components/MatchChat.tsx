"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/dates";

const EMOJIS = ["👍", "❤️", "😂", "😮", "🔥", "⚽"];
const POLL_MS = 5_000;

type Comment = {
  id: string;
  match_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  username: string | null;
};

type Reaction = { user_id: string; emoji: string };

export default function MatchChat({ matchId }: { matchId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [me, setMe] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user?.id ?? null);

    const { data: cs } = await supabase
      .from("match_comments")
      .select("id, match_id, user_id, parent_id, body, created_at")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    const list = (cs ?? []) as any[];
    const userIds = Array.from(new Set(list.map((c) => c.user_id)));
    const byId: Record<string, string | null> = {};
    if (userIds.length) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, username")
        .in("id", userIds);
      ((usersData ?? []) as any[]).forEach((u) => (byId[u.id] = u.username));
    }

    setComments(
      list.map((c) => ({ ...c, username: byId[c.user_id] ?? null })) as Comment[]
    );

    const commentIds = list.map((c) => c.id);
    if (commentIds.length) {
      const { data: cr } = await supabase
        .from("match_comment_reactions")
        .select("comment_id, user_id, emoji")
        .in("comment_id", commentIds);
      const grouped: Record<string, Reaction[]> = {};
      ((cr ?? []) as any[]).forEach((r) => {
        (grouped[r.comment_id] ??= []).push({ user_id: r.user_id, emoji: r.emoji });
      });
      setReactions(grouped);
    } else {
      setReactions({});
    }

    setLoading(false);
  }, [matchId, supabase]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const postComment = async (parentId: string | null) => {
    if (!me) return;
    const body = (parentId ? replyBody : newComment).trim();
    if (!body) return;
    setPosting(true);
    await supabase.from("match_comments").insert({
      match_id: matchId,
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
    await load();
    setPosting(false);
  };

  const toggleReaction = async (commentId: string, emoji: string) => {
    if (!me) return;
    const list = reactions[commentId] ?? [];
    const has = list.some((r) => r.user_id === me && r.emoji === emoji);
    if (has) {
      await supabase
        .from("match_comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", me)
        .eq("emoji", emoji);
    } else {
      await supabase
        .from("match_comment_reactions")
        .insert({ comment_id: commentId, user_id: me, emoji });
    }
    load();
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesOf = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
        Match Chat · {comments.length} message{comments.length !== 1 ? "s" : ""}
      </div>

      {/* New comment */}
      {me ? (
        <div className="rounded-[12px] border border-line bg-card p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            placeholder="Say something about this match..."
            className="w-full resize-none rounded-[8px] border border-line bg-element px-3 py-2 text-[13.5px] text-ink outline-none focus:border-line-strong"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                postComment(null);
              }
            }}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => postComment(null)}
              disabled={!newComment.trim() || posting}
              className="rounded-[8px] bg-brand px-4 py-[7px] text-[12.5px] font-semibold text-[#080808] disabled:opacity-50"
            >
              {posting ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-line-subtle bg-card p-4 text-center font-mono text-[11px] text-ink-silent">
          <Link href="/login" className="text-brand">Sign in</Link> to join the chat.
        </div>
      )}

      {loading && comments.length === 0 && (
        <div className="font-mono text-[11px] text-ink-faint">Loading chat...</div>
      )}

      {!loading && comments.length === 0 && (
        <div className="rounded-[12px] border border-dashed border-line-subtle bg-card py-8 text-center font-mono text-[11px] text-ink-silent">
          No messages yet. Be the first to comment!
        </div>
      )}

      {/* Comments */}
      {topLevel.map((c) => (
        <div key={c.id} className="rounded-[12px] border border-line bg-card p-4">
          <CommentBody
            c={c}
            reactions={reactions[c.id] ?? []}
            me={me}
            onToggleReaction={(emoji) => toggleReaction(c.id, emoji)}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    postComment(c.id);
                  }
                }}
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
                  disabled={!replyBody.trim() || posting}
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
                    reactions={reactions[r.id] ?? []}
                    me={me}
                    onToggleReaction={(emoji) => toggleReaction(r.id, emoji)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
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
        <span className="text-ink-muted">@{c.username ?? "—"}</span>
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
