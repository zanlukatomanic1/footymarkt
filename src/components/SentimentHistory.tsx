"use client";

import { useMemo } from "react";
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

export default function SentimentHistory({ points, homeTeam, awayTeam }: Props) {
  const span = points.length > 1 ? points[points.length - 1].t - points[0].t : 0;

  const data = useMemo(
    () =>
      points.map((p) => ({
        t: p.t,
        home: Math.round(p.home * 10) / 10,
        draw: Math.round(p.draw * 10) / 10,
        away: Math.round(p.away * 10) / 10,
      })),
    [points]
  );

  if (points.length < 2) return null;

  return (
    <div className="mb-5 rounded-[14px] border border-line bg-card px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-3 flex items-center justify-between">
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
    </div>
  );
}
