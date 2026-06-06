import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import { formatRelative } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forum",
  description: "Ask questions and discuss matches with the FootyMarkt community.",
};

export default async function ForumPage() {
  const supabase = createClient();

  const { data: posts, error } = await supabase
    .from("forum_posts")
    .select("id, title, description, created_at, user_id")
    .order("created_at", { ascending: false });
  if (error) console.error("[forum] posts query error:", error);

  const list = (posts ?? []) as any[];

  const userIds = Array.from(new Set(list.map((d) => d.user_id)));
  const { data: usersData } = userIds.length
    ? await supabase.from("users").select("id, username").in("id", userIds)
    : { data: [] as any[] };
  const usernameById: Record<string, string | null> = {};
  ((usersData ?? []) as any[]).forEach((u) => {
    usernameById[u.id] = u.username;
  });

  const ids = list.map((d) => d.id);
  const [commentCounts, reactionCounts] = await Promise.all([
    ids.length
      ? supabase.from("forum_comments").select("post_id").in("post_id", ids)
      : Promise.resolve({ data: [] as any[] }),
    ids.length
      ? supabase.from("forum_post_reactions").select("post_id").in("post_id", ids)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const cCount: Record<string, number> = {};
  ((commentCounts.data ?? []) as any[]).forEach((r) => {
    cCount[r.post_id] = (cCount[r.post_id] ?? 0) + 1;
  });
  const rCount: Record<string, number> = {};
  ((reactionCounts.data ?? []) as any[]).forEach((r) => {
    rCount[r.post_id] = (rCount[r.post_id] ?? 0) + 1;
  });

  return (
    <>
      <TopBar
        title="Forum"
        subtitle={`${list.length} thread${list.length !== 1 ? "s" : ""}`}
      />
      <div className="p-[22px] md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-muted">
            Community · {list.length} active
          </span>
          <Link
            href="/forum/new"
            className="rounded-[8px] bg-brand px-4 py-[7px] text-[12.5px] font-semibold text-[#080808]"
          >
            New post
          </Link>
        </div>

        {list.length === 0 && (
          <div className="rounded-[12px] border border-dashed border-line-strong bg-card py-12 text-center">
            <span className="font-mono text-[11px] text-ink-muted">
              No posts yet. Start the first one.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {list.map((d) => (
            <Link
              key={d.id}
              href={`/forum/${d.id}`}
              className="rounded-[12px] border border-line bg-card p-5 transition-all duration-150 hover:border-line-strong hover:bg-element"
            >
              <div className="mb-1 text-[15px] font-bold tracking-[-0.2px] text-ink">
                {d.title}
              </div>
              <div className="mb-3 line-clamp-2 text-[13px] text-ink-muted">
                {d.description}
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-ink-muted">
                <span>@{usernameById[d.user_id] ?? "—"}</span>
                <span>·</span>
                <span>{formatRelative(d.created_at)}</span>
                <span>·</span>
                <span>{cCount[d.id] ?? 0} comments</span>
                <span>·</span>
                <span>{rCount[d.id] ?? 0} reactions</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
