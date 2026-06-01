"use client";

import { useState } from "react";

type Row = {
  rank: number;
  username: string;
  coins: number;
  correct: number;
  total: number;
  rate: number;
  isMe?: boolean;
};

type Props = {
  rows: Row[];
  me: Row | null;
};

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const MEDAL_COLOR: Record<number, string> = { 1: "#FFD700", 2: "#a8a8a8", 3: "#cd8a3a" };
const MEDAL_BG: Record<number, string> = {
  1: "rgba(255,215,0,0.05)",
  2: "rgba(168,168,168,0.04)",
  3: "rgba(205,130,58,0.05)",
};

const PERIODS = [
  { id: "wc2026", label: "WC 2026" },
  { id: "alltime", label: "All Time" },
  { id: "week", label: "This Week" },
];

function UpIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>;
}
function DownIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
}
function CoinIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1 2-2.5 2.5-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.9 2.5-2" /><path d="M12 7v1M12 16v1" /></svg>;
}

function LBRow({ row }: { row: Row }) {
  const isTop3 = row.rank <= 3;
  const mc = MEDAL_COLOR[row.rank];

  return (
    <tr
      style={{
        background: row.isMe ? "rgba(0,255,135,0.04)" : isTop3 ? MEDAL_BG[row.rank] : "transparent",
        borderBottom: "1px solid #181818",
      }}
    >
      {/* Rank */}
      <td className="px-5 py-3 w-14">
        {isTop3 ? (
          <span className="text-[17px]">{MEDAL[row.rank]}</span>
        ) : (
          <span
            className="font-mono text-[12px] tabular-nums"
            style={{ color: row.isMe ? "#00ff87" : "#3a3a3a" }}
          >
            #{row.rank}
          </span>
        )}
      </td>
      {/* Player */}
      <td
        className="px-4 py-3"
        style={{
          borderLeft: isTop3
            ? `2px solid ${mc}`
            : row.isMe
            ? "2px solid rgba(0,255,135,0.5)"
            : "2px solid transparent",
        }}
      >
        <div className="flex items-center gap-[10px]">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: row.isMe
                ? "linear-gradient(135deg,#00ff87,#4d7cff)"
                : isTop3
                ? `linear-gradient(135deg,${mc}60,${mc}20)`
                : "#1a1a1a",
              color: row.isMe ? "#0a0a0a" : isTop3 ? mc : "#3a3a3a",
            }}
          >
            {row.username[0].toUpperCase()}
          </div>
          <div>
            <div
              className="text-[13px]"
              style={{
                fontWeight: row.isMe ? 600 : 500,
                color: row.isMe ? "#00ff87" : isTop3 ? mc : "#cccccc",
              }}
            >
              {row.isMe ? "you (me)" : row.username}
            </div>
            {row.isMe && (
              <div className="font-mono text-[9.5px] text-ink-ghost mt-[1px]">your position</div>
            )}
          </div>
        </div>
      </td>
      {/* Coins */}
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-[5px]">
          <span className="flex opacity-70" style={{ color: "#00ff87" }}><CoinIcon /></span>
          <span
            className="font-mono text-[13px] font-semibold tabular-nums"
            style={{ color: isTop3 ? mc : row.isMe ? "#00ff87" : "#cccccc" }}
          >
            {row.coins.toLocaleString()}
          </span>
        </div>
      </td>
      {/* Correct */}
      <td className="px-5 py-3 text-center">
        <span className="font-mono text-[12.5px] tabular-nums text-[#888]">
          {row.correct}<span className="text-[#333]">/{row.total}</span>
        </span>
      </td>
      {/* Rate */}
      <td className="py-3 pr-5 text-right">
        <div className="inline-flex items-center justify-end gap-1">
          <span
            className="font-mono text-[12.5px] font-semibold tabular-nums"
            style={{
              color: row.rate >= 70 ? "#00ff87" : row.rate >= 60 ? "#a8d8a8" : "#888",
            }}
          >
            {row.rate.toFixed(1)}%
          </span>
          {row.rate >= 70 && (
            <span className="flex opacity-70" style={{ color: "#00ff87" }}><UpIcon /></span>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function LeaderboardClient({ rows, me }: Props) {
  const [period, setPeriod] = useState("wc2026");
  const [sortCol, setSortCol] = useState<"coins" | "correct" | "rate">("coins");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...rows].sort((a, b) => {
    const diff = a[sortCol] - b[sortCol];
    return sortAsc ? diff : -diff;
  });

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortAsc((v) => !v);
    else { setSortCol(col); setSortAsc(false); }
  };

  const TH = ({
    col,
    children,
    align = "right",
  }: {
    col: typeof sortCol;
    children: React.ReactNode;
    align?: string;
  }) => (
    <th
      onClick={() => toggleSort(col)}
      className="cursor-pointer select-none font-mono text-[10.5px] uppercase tracking-[0.1em] whitespace-nowrap px-5 py-3"
      style={{
        textAlign: align as any,
        color: sortCol === col ? "#00ff87" : "#333",
      }}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortCol === col && (
          <span style={{ color: "#00ff87", display: "flex" }}>
            {sortAsc ? <UpIcon /> : <DownIcon />}
          </span>
        )}
      </span>
    </th>
  );

  return (
    <div className="p-[22px] md:p-6">
      {/* Period tabs */}
      <div className="mb-[22px] flex flex-wrap gap-2 items-center">
        {PERIODS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setPeriod(id)}
            className="rounded-[6px] px-[13px] py-[5px] text-[12px] transition-colors"
            style={{
              background: period === id ? "#00ff87" : "transparent",
              color: period === id ? "#080808" : "#4a4a4a",
              border: `1px solid ${period === id ? "#00ff87" : "#222"}`,
              fontWeight: period === id ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-[6px] rounded-[8px] border border-line bg-card px-3 py-[5px]">
          <span className="font-mono text-[11px] text-ink-faint">
            {rows.length} players · WC 2026
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[12px] border border-line bg-card">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className="w-14 px-5 py-3 text-left font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#333]">
                Rank
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#333]">
                Player
              </th>
              <TH col="coins">Coins</TH>
              <TH col="correct" align="center">Correct</TH>
              <TH col="rate">Win Rate</TH>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <LBRow key={row.rank} row={row} />
            ))}
          </tbody>
        </table>

        {/* Ellipsis separator */}
        {me && !sorted.find((r) => r.isMe) && (
          <>
            <div className="flex items-center gap-[10px] border-t border-b border-[#181818] px-5 py-[10px]">
              <div className="h-px flex-1 bg-line-subtle" />
              <span className="font-mono text-[10.5px] text-ink-silent">
                · · · ranks {sorted.length + 1}–{me.rank - 1} · · ·
              </span>
              <div className="h-px flex-1 bg-line-subtle" />
            </div>
            <table className="w-full border-collapse">
              <tbody>
                <LBRow row={me} />
              </tbody>
            </table>
          </>
        )}

        {sorted.length === 0 && (
          <div className="py-12 text-center font-mono text-[11px] text-ink-faint">
            No predictions resolved yet.
          </div>
        )}
      </div>
    </div>
  );
}
