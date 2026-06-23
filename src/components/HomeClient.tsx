"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import MatchCard from "@/components/MatchCard";
import { createClient } from "@/lib/supabase/client";
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
  const [sentiments, setSentiments] = useState<Record<string, Sentiment>>(sentMap);
  const [live, setLive] = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("predictions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions" },
        async (payload: any) => {
          const matchId = payload.new?.match_id ?? payload.old?.match_id;
          if (!matchId) return;
          const { data } = await supabase
            .from("match_sentiment")
            .select("*")
            .eq("match_id", matchId)
            .single();
          if (data) setSentiments((prev) => ({ ...prev, [matchId]: data as Sentiment }));
        }
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Visible matches based on finished toggle
  const visibleMatches = useMemo(
    () => showFinished ? matches : matches.filter(m => !m.result),
    [matches, showFinished]
  );

  // All unique match days in order
  const allDays = useMemo(() => {
    const seen = new Set<string>();
    const days: string[] = [];
    for (const m of visibleMatches) {
      const key = localDateKey(m.kickoff_at);
      if (!seen.has(key)) { seen.add(key); days.push(key); }
    }
    return days;
  }, [visibleMatches]);

  // Count per day
  const countByDay = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of visibleMatches) {
      const key = localDateKey(m.kickoff_at);
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [visibleMatches]);

  // Filtered + grouped
  const groups = useMemo(() => {
    const src = selectedDay === "all" ? visibleMatches : visibleMatches.filter(m => localDateKey(m.kickoff_at) === selectedDay);
    const map = new Map<string, Match[]>();
    for (const m of src) {
      const key = localDateKey(m.kickoff_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [selectedDay, visibleMatches]);

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
              <div className="font-mono text-[22px] font-bold leading-none tabular-nums" style={{ color: s.accent ? "var(--color-brand)" : "var(--color-ink)" }}>{s.val}</div>
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
          {/* Finished toggle */}
          <button
            onClick={() => { setShowFinished(v => !v); setSelectedDay("all"); }}
            className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all duration-150"
            style={{
              background: showFinished ? "var(--chip-active-bg)" : "var(--chip-inactive-bg)",
              borderColor: showFinished ? "var(--chip-active-bg)" : "var(--chip-inactive-border)",
            }}
          >
            <div
              className="relative h-[10px] w-[18px] rounded-full transition-colors duration-150"
              style={{ background: showFinished ? "var(--color-brand)" : "var(--color-line-strong)" }}
            >
              <div
                className="absolute top-[1px] h-[8px] w-[8px] rounded-full bg-white transition-transform duration-150"
                style={{ transform: showFinished ? "translateX(9px)" : "translateX(1px)" }}
              />
            </div>
            <span className="font-mono text-[10px]" style={{ color: showFinished ? "var(--chip-active-text)" : "var(--chip-inactive-text)" }}>
              Finished
            </span>
          </button>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-[6px] w-[6px] rounded-full"
              style={{ background: live ? "var(--color-brand)" : "var(--color-line-strong)", boxShadow: live ? "0 0 6px var(--color-brand)" : "none" }}
            />
            <span className="font-mono text-[10px] text-ink-silent">
              {live ? "live" : "connecting…"} · {allDays.length} days · {visibleMatches.length} fixtures
            </span>
          </div>
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
              background: selectedDay === "all" ? "var(--chip-active-bg)" : "var(--chip-inactive-bg)",
              borderColor: selectedDay === "all" ? "var(--chip-active-bg)" : "var(--chip-inactive-border)",
              color: selectedDay === "all" ? "var(--chip-active-text)" : "var(--chip-inactive-text)",
            }}
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">All</div>
            <div className="font-mono text-[11px]" style={{ color: selectedDay === "all" ? "var(--chip-active-sub)" : "var(--chip-inactive-count)" }}>
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
                  background: active ? "var(--chip-active-bg)" : "var(--chip-inactive-bg)",
                  borderColor: active ? "var(--chip-active-bg)" : "var(--chip-inactive-border)",
                  color: active ? "var(--chip-active-text)" : "var(--chip-inactive-text)",
                  minWidth: 58,
                }}
              >
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: active ? "var(--chip-active-sub)" : "var(--chip-inactive-day)" }}>
                  {day}
                </div>
                <div className="font-mono text-[11.5px] font-semibold" style={{ color: active ? "var(--chip-active-text)" : "var(--chip-inactive-date)" }}>
                  {date}
                </div>
                <div className="font-mono text-[10px]" style={{ color: active ? "var(--chip-active-sub)" : "var(--chip-inactive-count)" }}>
                  {count}m
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Match groups */}
      {groups.length === 0 && (
        <div className="rounded-[12px] border border-dashed border-line-subtle bg-card py-12 text-center">
          <span className="font-mono text-[11px] text-ink-silent">No matches found.</span>
        </div>
      )}

      {groups.map(([key, group]) => (
        <div key={key} className="mb-8">
          {/* Day header */}
          <div className="mb-4 flex items-center gap-3">
            <div>
              <div className="font-mono text-[13px] font-semibold text-ink">{groupLabel(key)}</div>
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
                  style={{ background: m.result ? "var(--match-dot-settled)" : "var(--match-dot-open)" }}
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
                sentiment={sentiments[m.id] ?? defaultSent(m.id)}
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
