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
const MEDAL_COLOR: Record<number, string> = {
  1: "var(--color-gold)",
  2: "var(--color-silver)",
  3: "var(--color-bronze)",
};
const MEDAL_BG: Record<number, string> = {
  1: "var(--lb-medal-1-bg)",
  2: "var(--lb-medal-2-bg)",
  3: "var(--lb-medal-3-bg)",
};
const MEDAL_AVATAR: Record<number, string> = {
  1: "var(--lb-medal-1-avatar)",
  2: "var(--lb-medal-2-avatar)",
  3: "var(--lb-medal-3-avatar)",
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
        background: row.isMe ? "var(--lb-me-bg)" : isTop3 ? MEDAL_BG[row.rank] : "transparent",
        borderBottom: "1px solid var(--lb-row-border)",
      }}
    >
      {/* Rank */}
      <td className="pl-3 pr-2 py-3 w-10 sm:w-14 sm:px-5">
        {isTop3 ? (
          <span className="text-[17px]">{MEDAL[row.rank]}</span>
        ) : (
          <span
            className="font-mono text-[12px] tabular-nums"
            style={{ color: row.isMe ? "var(--color-brand)" : "var(--lb-rank-other)" }}
          >
            #{row.rank}
          </span>
        )}
      </td>
      {/* Player */}
      <td
        className="px-2 py-3 sm:px-4"
        style={{
          borderLeft: isTop3
            ? `2px solid ${mc}`
            : row.isMe
            ? "2px solid var(--lb-me-border)"
            : "2px solid transparent",
        }}
      >
        <div className="flex items-center gap-[8px]">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{
              background: row.isMe
                ? "var(--lb-me-avatar)"
                : isTop3
                ? MEDAL_AVATAR[row.rank]
                : "var(--lb-avatar-other-bg)",
              color: row.isMe ? "var(--lb-me-avatar-tx)" : isTop3 ? mc : "var(--lb-avatar-other-tx)",
            }}
          >
            {row.username[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div
              className="truncate text-[13px]"
              style={{
                fontWeight: row.isMe ? 600 : 500,
                color: row.isMe ? "var(--color-brand)" : isTop3 ? mc : "var(--lb-username-other)",
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
      <td className="px-2 py-3 text-right sm:px-5">
        <div className="flex items-center justify-end gap-[4px]">
          <span className="hidden sm:flex opacity-70" style={{ color: "var(--color-brand)" }}><CoinIcon /></span>
          <span
            className="font-mono text-[12px] sm:text-[13px] font-semibold tabular-nums"
            style={{ color: isTop3 ? mc : row.isMe ? "var(--color-brand)" : "var(--lb-coins-other)" }}
          >
            {row.coins.toLocaleString()}
          </span>
        </div>
      </td>
      {/* Correct — hidden on mobile */}
      <td className="hidden sm:table-cell px-5 py-3 text-center">
        <span className="font-mono text-[12.5px] tabular-nums" style={{ color: "var(--lb-correct-num)" }}>
          {row.correct}<span style={{ color: "var(--lb-correct-sep)" }}>/{row.total}</span>
        </span>
      </td>
      {/* Rate */}
      <td className="py-3 pr-3 sm:pr-5 text-right">
        <div className="inline-flex items-center justify-end gap-1">
          <span
            className="font-mono text-[12px] sm:text-[12.5px] font-semibold tabular-nums"
            style={{
              color: row.rate >= 70 ? "var(--color-brand)" : row.rate >= 60 ? "var(--lb-rate-mid)" : "var(--lb-rate-low)",
            }}
          >
            {row.rate.toFixed(1)}%
          </span>
          {row.rate >= 70 && (
            <span className="hidden sm:flex opacity-70" style={{ color: "var(--color-brand)" }}><UpIcon /></span>
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
    className = "",
  }: {
    col: typeof sortCol;
    children: React.ReactNode;
    align?: string;
    className?: string;
  }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`cursor-pointer select-none font-mono text-[10.5px] uppercase tracking-[0.1em] whitespace-nowrap px-5 py-3 ${className}`}
      style={{
        textAlign: align as any,
        color: sortCol === col ? "var(--lb-th-sorted)" : "var(--lb-th-text)",
      }}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortCol === col && (
          <span style={{ color: "var(--lb-th-sorted)", display: "flex" }}>
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
              background: period === id ? "var(--chip-active-bg)" : "transparent",
              color: period === id ? "var(--chip-active-text)" : "var(--chip-inactive-text)",
              border: `1px solid ${period === id ? "var(--chip-active-bg)" : "var(--chip-inactive-border)"}`,
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
              <th className="w-14 px-5 py-3 text-left font-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--lb-th-text)" }}>
                Rank
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--lb-th-text)" }}>
                Player
              </th>
              <TH col="coins">Coins</TH>
              <TH col="correct" align="center" className="hidden sm:table-cell">Correct</TH>
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
            <div className="flex items-center gap-[10px] px-5 py-[10px]" style={{ borderTop: "1px solid var(--lb-row-border)", borderBottom: "1px solid var(--lb-row-border)" }}>
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
