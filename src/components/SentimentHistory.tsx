"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export type HistoryPoint = {
  t: number;
  home: number;
  draw: number;
  away: number;
};

type Props = {
  points: HistoryPoint[];
  homeTeam: string;
  awayTeam: string;
};

function fmtTime(ts: number, span: number): string {
  const d = new Date(ts);
  if (span > 1000 * 60 * 60 * 24 * 3) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const RANGES: { key: string; label: string; hours: number | null }[] = [
  { key: "1h", label: "1H", hours: 1 },
  { key: "6h", label: "6H", hours: 6 },
  { key: "12h", label: "12H", hours: 12 },
  { key: "1d", label: "1D", hours: 24 },
  { key: "7d", label: "7D", hours: 24 * 7 },
  { key: "all", label: "ALL", hours: null },
];

export default function SentimentHistory({ points, homeTeam, awayTeam }: Props) {
  const [rangeKey, setRangeKey] = useState("all");

  const filtered = useMemo(() => {
    const r = RANGES.find((x) => x.key === rangeKey) ?? RANGES[RANGES.length - 1];
    if (r.hours === null || points.length === 0) return points;
    const cutoff = Date.now() - r.hours * 3600 * 1000;
    const inRange = points.filter((p) => p.t >= cutoff);
    // Anchor the line so a selected window with only 1 in-range point still draws.
    if (inRange.length < 2) {
      const before = [...points].reverse().find((p) => p.t < cutoff);
      if (before) return [{ ...before, t: cutoff }, ...inRange];
    }
    return inRange;
  }, [points, rangeKey]);

  const span =
    filtered.length > 1 ? filtered[filtered.length - 1].t - filtered[0].t : 0;

  const data = useMemo(
    () =>
      filtered.map((p) => ({
        t: p.t,
        home: Math.round(p.home * 10) / 10,
        draw: Math.round(p.draw * 10) / 10,
        away: Math.round(p.away * 10) / 10,
      })),
    [filtered]
  );

  if (points.length < 2) return null;

  return (
    <div className="mt-5 rounded-[14px] border border-line bg-card px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
          Market sentiment over time
        </div>
        <div className="flex items-center gap-3 font-mono text-[10.5px]">
          <span className="flex items-center gap-[5px]">
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: "var(--pick-home-color)" }} />
            <span style={{ color: "var(--color-ink-muted)" }}>{homeTeam}</span>
          </span>
          <span className="flex items-center gap-[5px]">
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: "var(--pick-draw-color)" }} />
            <span style={{ color: "var(--color-ink-muted)" }}>Draw</span>
          </span>
          <span className="flex items-center gap-[5px]">
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: "var(--pick-away-color)" }} />
            <span style={{ color: "var(--color-ink-muted)" }}>{awayTeam}</span>
          </span>
        </div>
      </div>
      <div className="mb-3 flex gap-[6px]">
        {RANGES.map((r) => {
          const active = r.key === rangeKey;
          return (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className="rounded-[6px] px-[10px] py-[4px] font-mono text-[11px] font-semibold transition-colors"
              style={{
                background: active ? "var(--nav-active-bg)" : "transparent",
                color: active ? "var(--color-brand)" : "var(--color-ink-faint)",
                border: `1px solid ${active ? "var(--lb-me-border)" : "var(--color-line)"}`,
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      {data.length < 2 ? (
        <div className="flex h-[240px] items-center justify-center font-mono text-[11px] text-ink-faint">
          No activity in this window
        </div>
      ) : (
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
            <CartesianGrid stroke="var(--color-line)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => fmtTime(v, span)}
              stroke="var(--color-ink-ghost)"
              tick={{ fontSize: 10, fontFamily: "var(--font-dm-mono)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              stroke="var(--color-ink-ghost)"
              tick={{ fontSize: 10, fontFamily: "var(--font-dm-mono)" }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-line-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v) => fmtTime(v as number, span)}
              formatter={(v, name) => [`${Number(v).toFixed(1)}%`, String(name)]}
              labelStyle={{ color: "var(--color-ink-muted)", fontFamily: "var(--font-dm-mono)" }}
              itemStyle={{ color: "var(--color-ink)" }}
            />
            <Line
              type="stepAfter"
              dataKey="home"
              name={homeTeam}
              stroke="var(--pick-home-color)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="draw"
              name="Draw"
              stroke="var(--pick-draw-color)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="away"
              name={awayTeam}
              stroke="var(--pick-away-color)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      )}
    </div>
  );
}
