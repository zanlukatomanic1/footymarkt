"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const RANK_COLOR: Record<number, string> = {
  1: "var(--color-gold)",
  2: "var(--color-silver)",
  3: "var(--color-bronze)",
};

type Member = {
  id: string;
  username: string;
  coins: number;
  correct: number;
  total: number;
  rate: number;
  isMe: boolean;
};

export default function LeaguePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [league, setLeague] = useState<{ name: string; invite_code: string; created_by: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [totalPreds, setTotalPreds] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: lg } = await supabase
        .from("leagues").select("name, invite_code, created_by").eq("id", params.id).single();
      if (!lg) { router.push("/leagues"); return; }
      setLeague(lg);
      setIsOwner(lg.created_by === user.id);

      const { data: memberRows } = await supabase
        .from("league_members")
        .select("user_id, users(id, username, coins)")
        .eq("league_id", params.id);

      const userIds = ((memberRows ?? []) as any[])
        .map((m) => m.users?.id).filter(Boolean) as string[];

      const { data: preds } = userIds.length
        ? await supabase
            .from("predictions")
            .select("user_id, was_correct")
            .in("user_id", userIds)
        : { data: [] };

      setTotalPreds((preds ?? []).length);

      const correctMap = new Map<string, number>();
      const totalMap = new Map<string, number>();
      for (const p of preds ?? []) {
        totalMap.set(p.user_id, (totalMap.get(p.user_id) ?? 0) + 1);
        if (p.was_correct) correctMap.set(p.user_id, (correctMap.get(p.user_id) ?? 0) + 1);
      }

      const rows: Member[] = ((memberRows ?? []) as any[])
        .map((m) => m.users).filter(Boolean)
        .map((u: any) => {
          const correct = correctMap.get(u.id) ?? 0;
          const total = totalMap.get(u.id) ?? 0;
          return {
            id: u.id,
            username: u.username ?? "—",
            coins: u.coins ?? 0,
            correct,
            total,
            rate: total > 0 ? (correct / total) * 100 : 0,
            isMe: u.id === user.id,
          };
        })
        .sort((a: Member, b: Member) => b.coins - a.coins);

      setMembers(rows);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleCopy = () => {
    if (!league) return;
    navigator.clipboard.writeText(league.invite_code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("leagues").delete().eq("id", params.id);
    if (error) { setDeleting(false); setConfirmDelete(false); return; }
    router.push("/leagues");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="font-mono text-[11px] text-ink-faint">Loading…</span>
      </div>
    );
  }

  return (
    <div className="p-[22px] md:p-6">
      {/* Back */}
      <Link href="/leagues" className="mb-[22px] flex w-fit items-center gap-[6px]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-ink-faint)" }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="font-mono text-[12px] text-ink-faint">My Leagues</span>
      </Link>

      {/* League header card */}
      <div className="mb-[22px] flex items-center justify-between rounded-[14px] border border-line bg-card px-6 py-[22px]">
        <div>
          <div className="font-display text-[22px] font-extrabold text-ink-bright tracking-[-0.5px] mb-[5px]">
            {league?.name}
          </div>
          <div className="flex gap-4">
            <span className="font-mono text-[12px] text-ink-faint">
              {members.length} members
            </span>
            <span className="font-mono text-[12px] text-ink-faint">
              {totalPreds} predictions
            </span>
          </div>
        </div>

        {/* Right side: invite code + delete */}
        <div className="flex items-center gap-3">
        {isOwner && (
          confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[#ff5050]">Delete league?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-[7px] px-3 py-[6px] font-mono text-[11px] font-semibold transition-all"
                style={{ background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.35)", color: "#ff5050" }}
              >
                {deleting ? "Deleting…" : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-[7px] px-3 py-[6px] font-mono text-[11px] text-ink-faint transition-colors hover:text-ink"
                style={{ background: "var(--color-element)", border: "1px solid var(--color-line)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-[5px] rounded-[7px] px-3 py-[6px] font-mono text-[11px] text-[#ff5050] transition-all hover:bg-[rgba(255,80,80,0.08)]"
              style={{ border: "1px solid rgba(255,80,80,0.2)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              Delete
            </button>
          )
        )}

        {/* Invite code */}
        <div className="flex items-center gap-[10px] rounded-[10px] border border-line-strong bg-topbar px-4 py-[10px]">
          <div>
            <div className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-faint">
              Invite code
            </div>
            <code className="font-mono text-[15px] tracking-[0.1em] text-brand font-medium">
              {league?.invite_code}
            </code>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-[5px] rounded-[7px] border px-[10px] py-[6px] font-mono text-[11px] transition-all duration-150"
            style={{
              background: copied ? "var(--lb-me-bg)" : "var(--color-element)",
              border: `1px solid ${copied ? "var(--lb-me-border)" : "var(--color-line-strong)"}`,
              color: copied ? "var(--color-brand)" : "var(--color-ink-faint)",
            }}
          >
            {copied ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        </div> {/* end right side */}
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Standings */}
        <div className="overflow-hidden rounded-[12px] border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line-subtle px-5 py-3.5">
            <span className="text-[12px] font-semibold text-ink-muted">League Standings</span>
            <span className="font-mono text-[10.5px] text-ink-ghost">WC 2026</span>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-line">
                {["Rank", "Player", "Coins", "Correct", "Rate"].map((h, i) => (
                  <th
                    key={h}
                    className="px-4 py-[9px] font-mono text-[10px] uppercase tracking-[0.09em] text-ink-ghost"
                    style={{ textAlign: i > 1 ? "right" : i === 1 ? "left" : "center" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((row, i) => {
                const rank = i + 1;
                const rc = RANK_COLOR[rank];
                return (
                  <tr
                    key={row.id}
                    className="border-b border-line-subtle"
                    style={{ background: row.isMe ? "var(--lb-me-bg)" : "transparent" }}
                  >
                    <td
                      className="px-4 py-[10px] text-center"
                      style={{
                        borderLeft: `2px solid ${rank <= 3 ? rc : row.isMe ? "var(--lb-me-border)" : "transparent"}`,
                      }}
                    >
                      {rank <= 3 ? (
                        <span className="text-[14px]">{"🥇🥈🥉"[rank - 1]}</span>
                      ) : (
                        <span className="font-mono text-[11px]" style={{ color: "var(--lb-rank-other)" }}>#{rank}</span>
                      )}
                    </td>
                    <td className="px-4 py-[10px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{
                            background: row.isMe ? "var(--lb-me-avatar)" : "var(--lb-avatar-other-bg)",
                            color: row.isMe ? "var(--lb-me-avatar-tx)" : "var(--lb-avatar-other-tx)",
                          }}
                        >
                          {row.username[0].toUpperCase()}
                        </div>
                        <span
                          className="text-[12.5px]"
                          style={{
                            fontWeight: row.isMe ? 600 : 400,
                            color: row.isMe ? "var(--color-brand)" : rank <= 3 ? rc : "var(--lb-username-other)",
                          }}
                        >
                          {row.isMe ? "you" : row.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-[10px] text-right font-mono text-[12px] tabular-nums text-ink-muted">
                      {row.coins.toLocaleString()}
                    </td>
                    <td className="px-4 py-[10px] text-right font-mono text-[12px] tabular-nums" style={{ color: "var(--lb-correct-num)" }}>
                      {row.correct}
                    </td>
                    <td
                      className="px-4 py-[10px] text-right font-mono text-[12px] tabular-nums"
                      style={{ color: row.rate >= 65 ? "var(--color-brand)" : "var(--lb-rate-low)" }}
                    >
                      {row.rate.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Members list */}
        <div className="overflow-hidden rounded-[12px] border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3.5">
            <span className="text-[12px] font-semibold text-ink-muted">Members</span>
            <span className="font-mono text-[10.5px] text-ink-ghost">
              {members.length} / 50
            </span>
          </div>
          <div className="py-2">
            {members.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center gap-[10px] px-4 py-2"
                style={{ background: m.isMe ? "var(--lb-me-bg)" : "transparent" }}
              >
                <div
                  className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    background: m.isMe ? "var(--lb-me-avatar)" : "var(--lb-avatar-other-bg)",
                    color: m.isMe ? "var(--lb-me-avatar-tx)" : "var(--lb-avatar-other-tx)",
                  }}
                >
                  {m.username[0].toUpperCase()}
                </div>
                <span
                  className="flex-1 text-[12.5px]"
                  style={{ color: m.isMe ? "var(--color-brand)" : "var(--lb-username-other)" }}
                >
                  {m.isMe ? "you" : m.username}
                </span>
                {i < 3 && (
                  <span className="text-[12px]" style={{ color: RANK_COLOR[i + 1] }}>
                    #{i + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
