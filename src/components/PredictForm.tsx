"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SentimentBar from "@/components/SentimentBar";
import BetModal from "@/components/BetModal";
import RecentPredictions, { type RecentPick } from "@/components/RecentPredictions";
import { teamData } from "@/lib/teamData";
import { fmtKickoffLong } from "@/lib/dates";
import { estimateCashout, estimateReward, sentimentPct } from "@/lib/coins";
import type { Match, Outcome, Sentiment } from "@/lib/types";

type Props = {
  match: Match;
  initialSentiment: Sentiment;
  initialPick: Outcome | null;
  initialBet: number | null;
  signedIn: boolean;
  userCoins: number;
  recentPicks?: RecentPick[];
};

const OPTS: {
  key: Outcome;
  label: string;
  color: string;
  rgb: string;
}[] = [
  { key: "home", label: "Home Win", color: "var(--pick-home-color)", rgb: "var(--pick-home-rgb)" },
  { key: "draw", label: "Draw",     color: "var(--pick-draw-color)", rgb: "var(--pick-draw-rgb)" },
  { key: "away", label: "Away Win", color: "var(--pick-away-color)", rgb: "var(--pick-away-rgb)" },
];

function CoinIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1 2-2.5 2.5-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.9 2.5-2" />
      <path d="M12 7v1M12 16v1" />
    </svg>
  );
}

export default function PredictForm({ match, initialSentiment, initialPick, initialBet, signedIn, userCoins, recentPicks = [] }: Props) {
  const router = useRouter();
  const [sentiment, setSentiment] = useState<Sentiment>(initialSentiment);
  const [pick, setPick] = useState<Outcome | null>(initialPick);
  const [betAmount, setBetAmount] = useState<number | null>(initialBet);
  const [coins, setCoins] = useState(userCoins);
  const [hov, setHov] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [modalOutcome, setModalOutcome] = useState<Outcome | null>(null);
  const [cashingOut, setCashingOut] = useState(false);
  const [cashoutBusy, setCashoutBusy] = useState(false);

  const locked = new Date(match.kickoff_at).getTime() <= Date.now() || match.result !== null;
  const pct = useMemo(() => sentimentPct(sentiment), [sentiment]);
  const home = teamData(match.home_team);
  const away = teamData(match.away_team);


  const handleSelect = (choice: Outcome) => {
    if (!signedIn) { router.push("/login"); return; }
    if (busy || locked || pick !== null) return;
    setErr(null);
    setModalOutcome(choice);
  };

  const handleModalConfirm = async (amount: number) => {
    if (!modalOutcome) return;
    const res = await fetch("/api/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, prediction: modalOutcome, betAmount: amount }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to place bet");

    setSentiment((s) => {
      const n = { ...s, total_count: s.total_count + 1 };
      n[`${modalOutcome}_count` as const] += 1;
      return n;
    });
    setPick(modalOutcome);
    setBetAmount(amount);
    setCoins(json.newBalance ?? coins - amount);
    setModalOutcome(null);
    router.refresh();
  };

  const handleCashout = async () => {
    setCashoutBusy(true);
    setErr(null);
    const res = await fetch("/api/cashout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErr(json.error ?? "Cashout failed");
      setCashoutBusy(false);
      setCashingOut(false);
      return;
    }
    setSentiment((s) => {
      if (!pick) return s;
      const n = { ...s, total_count: Math.max(0, s.total_count - 1) };
      n[`${pick}_count` as const] = Math.max(0, n[`${pick}_count` as const] - 1);
      return n;
    });
    setPick(null);
    setBetAmount(null);
    setCoins(json.newBalance ?? coins + (json.cashout ?? 0));
    setCashingOut(false);
    setCashoutBusy(false);
    router.refresh();
  };

  const teamLabel = (o: (typeof OPTS)[number]) =>
    o.key === "home" ? match.home_team : o.key === "away" ? match.away_team : "Draw";

  return (
    <div className="p-[22px] md:p-6">
      {/* Back */}
      <a
        href="/"
        className="mb-[22px] flex w-fit cursor-pointer items-center gap-[6px]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-ink-faint)" }}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="font-mono text-[12px] text-ink-faint">Back to feed</span>
      </a>

      {/* Match hero */}
      <div className="mb-5 rounded-[14px] border border-line bg-card px-4 py-5 sm:px-8 sm:py-7">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex flex-col gap-[6px]">
            <span
              className="w-fit rounded-[4px] px-[7px] py-[2px] font-mono text-[10.5px] font-semibold tracking-[0.06em] text-brand"
              style={{ background: "var(--nav-active-bg)" }}
            >
              {match.competition}
            </span>
            <div className="font-mono text-[11px] text-ink-faint mt-[2px]">
              {fmtKickoffLong(match.kickoff_at)}
            </div>
            {match.venue && (
              <div className="mt-[2px] flex items-center gap-[5px] font-mono text-[11px] text-ink-faint">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{match.venue}</span>
              </div>
            )}
          </div>
          <div className="font-mono text-[11px] text-ink-faint">
            {sentiment.total_count.toLocaleString()} predictions
          </div>
        </div>

        {/* Teams row */}
        {/* Mobile: teams side by side, VS/score + sentiment below */}
        {/* Desktop: all in one row with center block */}
        <div>
          <div className="flex items-center justify-between gap-3">
            {/* Home team */}
            <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
              {home.flag ? (
                <img src={home.flag} alt={match.home_team} className="h-8 w-8 sm:h-9 sm:w-9 rounded object-cover" />
              ) : (
                <span className="text-[32px] leading-none">🏳️</span>
              )}
              <span className="font-display text-[20px] sm:text-[24px] font-extrabold text-ink-bright tracking-[-0.5px] leading-[1.1] hidden sm:block">
                {match.home_team}
              </span>
              <span className="font-display text-[20px] font-extrabold text-ink-bright tracking-[-0.5px] leading-[1.1] sm:hidden">
                {home.code}
              </span>
              <span className="font-mono text-[11px] sm:text-[12px] tracking-[0.1em] text-ink-faint hidden sm:block">
                {home.code}
              </span>
            </div>

            {/* Center: VS / score — desktop only */}
            <div className="hidden sm:block flex-shrink-0 w-64 lg:w-80 text-center">
              {match.result !== null && match.home_score !== null && match.away_score !== null ? (
                <>
                  <div className="mb-1 font-mono text-[32px] font-bold tabular-nums text-ink-bright leading-none">
                    {match.home_score} – {match.away_score}
                  </div>
                  <div className="mb-2 font-mono text-[10px] tracking-[0.12em] text-ink-ghost">FULL TIME</div>
                </>
              ) : locked && match.result === null ? (
                <div className="mb-2 flex items-center justify-center gap-1.5 font-mono text-[12px] font-semibold text-[color:var(--color-live)]">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-live)]" />
                  LIVE
                </div>
              ) : (
                <div className="mb-2 font-mono text-[11px] tracking-[0.18em] text-ink-silent">VS</div>
              )}
              <SentimentBar home={pct.home} draw={pct.draw} away={pct.away} height={10} labels={false} />
              <div className="mt-[10px] font-mono text-[14px] text-ink-silent">
                {pct.home.toFixed(0)}% · {pct.draw.toFixed(0)}% · {pct.away.toFixed(0)}%
              </div>
            </div>

            {/* Away team */}
            <div className="flex min-w-0 flex-1 flex-col items-end gap-[6px]">
              {away.flag ? (
                <img src={away.flag} alt={match.away_team} className="h-8 w-8 sm:h-9 sm:w-9 rounded object-cover" />
              ) : (
                <span className="text-[32px] leading-none">🏳️</span>
              )}
              <span className="font-display text-right text-[20px] sm:text-[24px] font-extrabold text-ink-bright tracking-[-0.5px] leading-[1.1] hidden sm:block">
                {match.away_team}
              </span>
              <span className="font-display text-right text-[20px] font-extrabold text-ink-bright tracking-[-0.5px] leading-[1.1] sm:hidden">
                {away.code}
              </span>
              <span className="font-mono text-[11px] sm:text-[12px] tracking-[0.1em] text-ink-faint hidden sm:block">
                {away.code}
              </span>
            </div>
          </div>

          {/* Mobile only: VS / score + sentiment below the teams */}
          <div className="mt-4 sm:hidden text-center">
            {match.result !== null && match.home_score !== null && match.away_score !== null ? (
              <>
                <div className="mb-1 font-mono text-[28px] font-bold tabular-nums text-ink-bright leading-none">
                  {match.home_score} – {match.away_score}
                </div>
                <div className="mb-2 font-mono text-[10px] tracking-[0.12em] text-ink-ghost">FULL TIME</div>
              </>
            ) : locked && match.result === null ? (
              <div className="mb-2 flex items-center justify-center gap-1.5 font-mono text-[12px] font-semibold text-[color:var(--color-live)]">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-live)]" />
                LIVE
              </div>
            ) : (
              <div className="mb-2 font-mono text-[11px] tracking-[0.18em] text-ink-silent">VS</div>
            )}
            <SentimentBar home={pct.home} draw={pct.draw} away={pct.away} height={4} labels={false} />
            <div className="mt-[6px] font-mono text-[10px] text-ink-silent">
              {pct.home.toFixed(0)}% · {pct.draw.toFixed(0)}% · {pct.away.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Lock banner */}
      {pick && !locked && (() => {
        const cashoutValue = betAmount !== null ? estimateCashout(pick, sentiment, betAmount) : null;
        return cashingOut ? (
          <div
            className="mb-3.5 rounded-[10px] px-[14px] py-[12px]"
            style={{ background: "rgba(var(--color-danger-rgb), 0.05)", border: "1px solid rgba(var(--color-danger-rgb), 0.2)" }}
          >
            <div className="mb-[8px] text-[13px] font-semibold" style={{ color: "var(--color-danger)" }}>
              Cash out your bet?
            </div>
            <div className="mb-[10px] font-mono text-[11px] text-ink-faint">
              You wagered{" "}
              <span className="text-ink">{betAmount?.toLocaleString()} coins</span>. You'll receive{" "}
              <span className="text-brand">{cashoutValue?.toLocaleString()} coins</span> back based on current market odds.
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCashout}
                disabled={cashoutBusy}
                className="flex-1 rounded-[8px] py-[8px] font-mono text-[12px] font-bold tracking-[0.04em] transition-all disabled:opacity-40"
                style={{ background: "rgba(var(--color-danger-rgb), 0.15)", border: "1px solid rgba(var(--color-danger-rgb), 0.35)", color: "var(--color-danger)" }}
              >
                {cashoutBusy ? "Processing…" : `Confirm — get ${cashoutValue?.toLocaleString()} coins`}
              </button>
              <button
                onClick={() => setCashingOut(false)}
                disabled={cashoutBusy}
                className="rounded-[8px] px-[14px] py-[8px] font-mono text-[12px] text-ink-faint transition-colors hover:text-ink disabled:opacity-40"
                style={{ background: "var(--color-element)", border: "1px solid var(--color-line)" }}
              >
                Keep bet
              </button>
            </div>
          </div>
        ) : (
          <div
            className="mb-3.5 flex items-center gap-2 rounded-[10px] px-[14px] py-[10px]"
            style={{ background: "var(--nav-active-bg)", border: "1px solid var(--lb-me-border)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-brand)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-brand">
                Bet placed —{" "}
                {pick === "home" ? match.home_team : pick === "away" ? match.away_team : "Draw"}
              </div>
              {betAmount !== null && (
                <div className="mt-[2px] flex items-center gap-[5px] font-mono text-[10.5px] text-ink-faint">
                  <CoinIcon color="var(--color-brand)" />
                  <span>{betAmount.toLocaleString()} coins wagered</span>
                </div>
              )}
            </div>
            {cashoutValue !== null && (
              <button
                onClick={() => setCashingOut(true)}
                className="flex flex-col items-end rounded-[8px] px-[10px] py-[6px] font-mono transition-all"
                style={{ background: "rgba(var(--color-danger-rgb), 0.06)", border: "1px solid rgba(var(--color-danger-rgb), 0.18)" }}
              >
                <span className="text-[10px] tracking-[0.06em]" style={{ color: "rgba(var(--color-danger-rgb), 0.67)" }}>CASH OUT</span>
                <div className="flex items-center gap-[4px]">
                  <CoinIcon color="var(--color-danger)" />
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: "var(--color-danger)" }}>
                    {cashoutValue.toLocaleString()}
                  </span>
                </div>
              </button>
            )}
          </div>
        );
      })()}

      {/* Prediction cards */}
      <div className="flex flex-col gap-3.5 md:flex-row">
        {OPTS.map((opt) => {
          const isSelected = pick === opt.key;
          const dimmed = pick !== null && !isSelected;
          const isHov = hov === opt.key;
          const reward = isSelected && betAmount !== null
            ? estimateReward(opt.key, sentiment, false, betAmount)
            : estimateReward(opt.key, sentiment, pick !== opt.key);
          const pctVal = pct[opt.key];

          return (
            <div
              key={opt.key}
              onMouseEnter={() => setHov(opt.key)}
              onMouseLeave={() => setHov(null)}
              onClick={() => !locked && handleSelect(opt.key)}
              className="relative flex flex-1 cursor-pointer flex-col gap-3 rounded-[14px] p-[24px] transition-all duration-200"
              style={{
                background: isSelected ? `rgba(${opt.rgb}, 0.06)` : isHov && !dimmed ? "var(--color-element)" : "var(--color-card)",
                border: `1.5px solid ${isSelected ? `rgba(${opt.rgb}, 0.35)` : isHov && !dimmed ? "var(--color-line-strong)" : "var(--color-line)"}`,
                opacity: dimmed ? 0.35 : 1,
                boxShadow: isSelected ? `0 0 24px rgba(${opt.rgb}, 0.08), 0 2px 12px rgba(15,22,36,0.08)` : "none",
                minHeight: 260,
              }}
            >
              {/* Locked badge */}
              {isSelected && (
                <div
                  className="absolute right-3.5 top-3.5 flex items-center gap-[5px] rounded-[20px] px-[9px] py-[3px] font-mono text-[10px] font-bold"
                  style={{
                    background: `rgba(${opt.rgb}, 0.12)`,
                    border: `1px solid rgba(${opt.rgb}, 0.28)`,
                    color: opt.color,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Locked in
                </div>
              )}

              {/* Label + team */}
              <div>
                <div className="mb-[6px] font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
                  {opt.label}
                </div>
                <div
                  className="text-[15px] font-semibold"
                  style={{ color: isSelected ? opt.color : "var(--color-ink-muted)" }}
                >
                  {teamLabel(opt)}
                </div>
              </div>

              {/* Big % */}
              <div className="font-mono tabular-nums">
                <div
                  className="text-[46px] font-medium leading-none tracking-[-2px]"
                  style={{ color: isSelected ? opt.color : "var(--color-ink)" }}
                >
                  {pctVal.toFixed(0)}
                  <span className="text-[22px] text-ink-dim">%</span>
                </div>
                <div className="mt-[4px] font-mono text-[10.5px] text-ink-ghost">
                  market sentiment
                </div>
              </div>

              <div className="h-px bg-line-subtle" />

              {/* Reward */}
              <div>
                <div className="mb-[6px] font-mono text-[10px] uppercase tracking-[0.09em] text-ink-faint">
                  If correct
                </div>
                <div className="flex items-center gap-[6px]">
                  <CoinIcon color={opt.color} />
                  <span
                    className="font-mono text-[22px] font-bold tabular-nums"
                    style={{ color: opt.color }}
                  >
                    +{reward}
                  </span>
                  <span className="self-end mb-[2px] text-[11px] text-ink-faint">coins</span>
                </div>
              </div>

              {/* Pick button */}
              {!isSelected && !locked && (
                <div
                  className="mt-auto rounded-[8px] border py-[9px] text-center text-[12.5px] font-semibold transition-all duration-150"
                  style={{
                    background: pick !== null ? "transparent" : isHov ? `rgba(${opt.rgb}, 0.10)` : "transparent",
                    border: `1px solid ${pick !== null ? "var(--color-line)" : isHov ? `rgba(${opt.rgb}, 0.35)` : "var(--color-line)"}`,
                    color: pick !== null ? "var(--color-ink-ghost)" : isHov ? opt.color : "var(--color-ink-faint)",
                  }}
                >
                  {pick !== null ? "—" : `Bet on ${teamLabel(opt)}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <RecentPredictions match={match} picks={recentPicks} />

      {locked && (
        <p className="mt-4 text-center font-mono text-[11px] text-ink-faint">
          {match.result
            ? match.home_score !== null && match.away_score !== null
              ? `${match.home_team} ${match.home_score} – ${match.away_score} ${match.away_team}`
              : `Result: ${match.result === "home" ? match.home_team : match.result === "away" ? match.away_team : "Draw"}`
            : "Predictions locked — match has kicked off."}
        </p>
      )}
      {err && <p className="mt-3 text-center text-sm text-red-400">{err}</p>}

      {modalOutcome && (() => {
        const opt = OPTS.find((o) => o.key === modalOutcome)!;
        return (
          <BetModal
            outcome={modalOutcome}
            teamLabel={modalOutcome === "home" ? match.home_team : modalOutcome === "away" ? match.away_team : "Draw"}
            color={opt.color}
            rgb={opt.rgb}
            sentiment={sentiment}
            userCoins={coins}
            onConfirm={handleModalConfirm}
            onCancel={() => setModalOutcome(null)}
          />
        );
      })()}
    </div>
  );
}
