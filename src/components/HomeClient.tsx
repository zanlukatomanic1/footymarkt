"use client";

import { useState, useMemo, useRef } from "react";
import MatchCard from "@/components/MatchCard";
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function pad(n: number) { return n.toString().padStart(2, "0"); }

function localDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function chipLabel(key: string): { day: string; date: string } {
  const [y, m, dd] = key.split("-").map(Number);
  const d = new Date(y, m - 1, dd);
  return { day: DAYS[d.getDay()], date: `${MONTHS[m - 1]} ${dd}` };
}

function groupLabel(key: string): string {
  const [y, m, dd] = key.split("-").map(Number);
  const d = new Date(y, m - 1, dd);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return `Today, ${MONTHS[m - 1]} ${dd}`;
  if (sameDay(d, tomorrow)) return `Tomorrow, ${MONTHS[m - 1]} ${dd}`;
  return `${DAYS[d.getDay()]}, ${MONTHS[m - 1]} ${dd}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HomeClient({ matches, sentMap, userPicks, signedIn, stats }: Props) {
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const stripRef = useRef<HTMLDivElement>(null);

  // All unique match days in order
  const allDays = useMemo(() => {
    const seen = new Set<string>();
    const days: string[] = [];
    for (const m of matches) {
      const key = localDateKey(m.kickoff_at);
      if (!seen.has(key)) { seen.add(key); days.push(key); }
    }
    return days;
  }, [matches]);

  // Count per day
  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of matches) {
      const key = localDateKey(m.kickoff_at);
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [matches]);

  // Filtered + grouped
  const groups = useMemo(() => {
    const src = selectedDay === "all" ? matches : matches.filter(m => localDateKey(m.kickoff_at) === selectedDay);
    const map = new Map<string, Match[]>();
    for (const m of src) {
      const key = localDateKey(m.kickoff_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [selectedDay, matches]);

  const defaultSent = (id: string): Sentiment => ({
    match_id: id, home_count: 0, draw_count: 0, away_count: 0, total_count: 0,
  });

  return (
    <div className="p-[22px] md:p-6">
      {/* Stats strip */}
      {stats ? (
        <div className="mb-[22px] grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Predictions", val: stats.predictions.toString(), sub: "total" },
            { label: "Correct",     val: stats.correct.toString(),     sub: `${stats.predictions > 0 ? ((stats.correct / stats.predictions) * 100).toFixed(1) : "0.0"}%` },
            { label: "Coins",       val: stats.coins.toLocaleString(), sub: "balance", accent: true },
            { label: "Rank",        val: `#${stats.rank}`,             sub: "global" },
          ].map((s) => (
            <div key={s.label} className="rounded-[10px] border border-line bg-card px-[14px] py-[12px]">
              <div className="mb-[5px] font-mono text-[10px] uppercase tracking-[0.09em] text-ink-faint">{s.label}</div>
              <div className="font-mono text-[22px] font-bold leading-none tabular-nums" style={{ color: s.accent ? "#00ff87" : "#d0d0d0" }}>{s.val}</div>
              <div className="mt-[3px] font-mono text-[10.5px] text-ink-faint">{s.sub}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-[22px] rounded-[10px] border border-line bg-card px-5 py-4 text-center">
          <span className="font-mono text-[11px] text-ink-faint">Sign in to track your predictions and earn coins.</span>
        </div>
      )}

      {/* Date navigator */}
      <div className="mb-[22px]">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-ghost">Match Days</span>
          <div className="h-px flex-1 bg-line-subtle" />
          <span className="font-mono text-[10px] text-ink-silent">{allDays.length} days · {matches.length} fixtures</span>
        </div>
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* All chip */}
          <button
            onClick={() => setSelectedDay("all")}
            className="flex-shrink-0 rounded-[8px] border px-3 py-[7px] transition-all duration-150"
            style={{
              background: selectedDay === "all" ? "#00ff87" : "#111",
              borderColor: selectedDay === "all" ? "#00ff87" : "#222",
              color: selectedDay === "all" ? "#080808" : "#555",
            }}
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">All</div>
            <div className="font-mono text-[11px]" style={{ color: selectedDay === "all" ? "#0a2a18" : "#333" }}>
              {matches.length}
            </div>
          </button>

          {allDays.map((key) => {
            const { day, date } = chipLabel(key);
            const active = selectedDay === key;
            const count = countByDay[key] ?? 0;
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(key)}
                className="flex-shrink-0 rounded-[8px] border px-3 py-[7px] text-left transition-all duration-150"
                style={{
                  background: active ? "#00ff87" : "#111",
                  borderColor: active ? "#00ff87" : "#1e1e1e",
                  color: active ? "#080808" : "#888",
                  minWidth: 58,
                }}
              >
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: active ? "#0a2a18" : "#444" }}>
                  {day}
                </div>
                <div className="font-mono text-[11.5px] font-semibold" style={{ color: active ? "#080808" : "#ccc" }}>
                  {date}
                </div>
                <div className="font-mono text-[10px]" style={{ color: active ? "#0a2a18" : "#333" }}>
                  {count}m
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Match groups */}
      {groups.length === 0 && (
        <div className="rounded-[12px] border border-dashed border-line-subtle bg-[#0d0d0d] py-12 text-center">
          <span className="font-mono text-[11px] text-ink-silent">No matches found.</span>
        </div>
      )}

      {groups.map(([key, group]) => (
        <div key={key} className="mb-8">
          {/* Day header */}
          <div className="mb-4 flex items-center gap-3">
            <div>
              <div className="font-mono text-[13px] font-semibold text-[#ccc]">{groupLabel(key)}</div>
              <div className="font-mono text-[10px] text-ink-ghost">
                {group.length} match{group.length !== 1 ? "es" : ""} · {group.filter(m => !m.result).length} open
              </div>
            </div>
            <div className="h-px flex-1 bg-line-subtle" />
            <div className="flex gap-[5px]">
              {group.map(m => (
                <div
                  key={m.id}
                  className="h-[5px] w-[5px] rounded-full"
                  style={{ background: m.result ? "#00ff87" : "#2a2a2a" }}
                  title={`${fmtTime(m.kickoff_at)} ${m.result ? "settled" : "open"}`}
                />
              ))}
            </div>
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
