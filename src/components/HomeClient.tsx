"use client";

import { useState, useMemo } from "react";
import MatchCard from "@/components/MatchCard";
import { fmtDateLabel } from "@/lib/dates";
import type { Match, Outcome, Sentiment } from "@/lib/types";

type Props = {
  matches: Match[];
  sentMap: Record<string, Sentiment>;
  userPicks: Record<string, Outcome>;
  signedIn: boolean;
  stats: {
    predictions: number;
    correct: number;
    coins: number;
    rank: number;
  } | null;
};

const FILTERS = [
  { id: "all",      label: "All" },
  { id: "today",    label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "week",     label: "This Week" },
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function HomeClient({ matches, sentMap, userPicks, signedIn, stats }: Props) {
  const [filter, setFilter] = useState<string>("all");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  const filtered = useMemo(() => {
    if (filter === "all") return matches;
    return matches.filter((m) => {
      const d = new Date(m.kickoff_at);
      if (filter === "today") return isSameDay(d, today);
      if (filter === "tomorrow") return isSameDay(d, tomorrow);
      if (filter === "week") return d >= today && d <= weekEnd;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, matches]);

  // Group by date
  const groups = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of filtered) {
      const key = fmtDateLabel(m.kickoff_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  const defaultSent = (id: string): Sentiment => ({
    match_id: id,
    home_count: 0,
    draw_count: 0,
    away_count: 0,
    total_count: 0,
  });

  return (
    <div className="p-[22px] md:p-6">
      {/* Stats strip */}
      {stats ? (
        <div className="mb-[22px] grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Predictions", val: stats.predictions.toString(), sub: "total" },
            { label: "Correct", val: stats.correct.toString(), sub: `${stats.predictions > 0 ? ((stats.correct / stats.predictions) * 100).toFixed(1) : "0.0"}%` },
            { label: "Coins", val: stats.coins.toLocaleString(), sub: "balance", accent: true },
            { label: "Rank", val: `#${stats.rank}`, sub: "global" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[10px] border border-line bg-card px-[14px] py-[12px]"
            >
              <div className="mb-[5px] font-mono text-[10px] uppercase tracking-[0.09em] text-ink-faint">
                {s.label}
              </div>
              <div
                className="font-mono text-[22px] font-bold leading-none tabular-nums"
                style={{ color: s.accent ? "#00ff87" : "#d0d0d0" }}
              >
                {s.val}
              </div>
              <div className="mt-[3px] font-mono text-[10.5px] text-ink-faint">
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-[22px] rounded-[10px] border border-line bg-card px-5 py-4 text-center">
          <span className="font-mono text-[11px] text-ink-faint">
            Sign in to track your predictions and earn coins.
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-[22px] flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="rounded-[6px] px-[13px] py-[5px] text-[12px] transition-colors"
            style={{
              background: filter === f.id ? "#00ff87" : "transparent",
              color: filter === f.id ? "#080808" : "#4a4a4a",
              border: `1px solid ${filter === f.id ? "#00ff87" : "#222"}`,
              fontWeight: filter === f.id ? 600 : 400,
            }}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="font-mono text-[11px] text-[#333]">Sorted by kickoff ↑</span>
      </div>

      {/* Match groups */}
      {groups.length === 0 && (
        <div className="rounded-[12px] border border-dashed border-line-subtle bg-[#0d0d0d] py-12 text-center">
          <span className="font-mono text-[11px] text-ink-silent">No matches for this period.</span>
        </div>
      )}

      {groups.map(([dateLabel, group]) => (
        <div key={dateLabel} className="mb-6">
          {/* Divider */}
          <div className="mb-3.5 flex items-center gap-3">
            <span className="whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
              {dateLabel} · {group.length} match{group.length !== 1 ? "es" : ""}
            </span>
            <div className="h-px flex-1 bg-line-subtle" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                sentiment={sentMap[m.id] ?? defaultSent(m.id)}
                userPick={userPicks[m.id] ?? null}
                signedIn={signedIn}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
