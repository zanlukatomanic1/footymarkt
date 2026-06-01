"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SentimentBar from "@/components/SentimentBar";
import BetModal from "@/components/BetModal";
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
};

const OPTS: {
  key: Outcome;
  label: string;
  color: string;
  dimColor: string;
  borderColor: string;
  bg: string;
}[] = [
  {
    key: "home",
    label: "Home Win",
    color: "#00ff87",
    dimColor: "rgba(0,255,135,0.15)",
    borderColor: "rgba(0,255,135,0.4)",
    bg: "rgba(0,255,135,0.06)",
  },
  {
    key: "draw",
    label: "Draw",
    color: "#888888",
    dimColor: "rgba(136,136,136,0.12)",
    borderColor: "rgba(136,136,136,0.3)",
    bg: "rgba(136,136,136,0.04)",
  },
  {
    key: "away",
    label: "Away Win",
    color: "#4d7cff",
    dimColor: "rgba(77,124,255,0.15)",
    borderColor: "rgba(77,124,255,0.4)",
    bg: "rgba(77,124,255,0.06)",
  },
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

export default function PredictForm({ match, initialSentiment, initialPick, initialBet, signedIn, userCoins }: Props) {
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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="font-mono text-[12px] text-ink-faint">Back to feed</span>
      </a>

      {/* Match hero */}
      <div className="mb-5 rounded-[14px] border border-line bg-card px-8 py-7">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex flex-col gap-[6px]">
            <span
              className="w-fit rounded-[4px] px-[7px] py-[2px] font-mono text-[10.5px] font-semibold tracking-[0.06em] text-brand"
              style={{ background: "rgba(0,255,135,0.08)" }}
            >
              {match.competition}
            </span>
            <div className="font-mono text-[11px] text-ink-faint mt-[2px]">
              {fmtKickoffLong(match.kickoff_at)}
            </div>
          </div>
          <div className="font-mono text-[11px] text-ink-faint">
            {sentiment.total_count.toLocaleString()} predictions
          </div>
        </div>

        {/* Teams row */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-1 flex-col gap-[6px]">
            {home.flag ? (
              <img src={home.flag} alt={match.home_team} className="h-9 w-9 rounded object-cover" />
            ) : (
              <span className="text-[36px] leading-none">🏳️</span>
            )}
            <span className="font-display text-[24px] font-extrabold text-white tracking-[-0.5px] leading-[1.1]">
              {match.home_team}
            </span>
            <span className="font-mono text-[12px] tracking-[0.1em] text-ink-faint">
              {home.code}
            </span>
          </div>

          <div className="flex-shrink-0 w-32 text-center">
            <div className="mb-2 font-mono text-[11px] tracking-[0.18em] text-[#2a2a2a]">VS</div>
            <SentimentBar home={pct.home} draw={pct.draw} away={pct.away} height={4} labels={false} />
            <div className="mt-[6px] font-mono text-[10px] text-[#2a2a2a]">
              {pct.home.toFixed(0)}% · {pct.draw.toFixed(0)}% · {pct.away.toFixed(0)}%
            </div>
          </div>

          <div className="flex flex-1 flex-col items-end gap-[6px]">
            {away.flag ? (
              <img src={away.flag} alt={match.away_team} className="h-9 w-9 rounded object-cover" />
            ) : (
              <span className="text-[36px] leading-none">🏳️</span>
            )}
            <span className="font-display text-right text-[24px] font-extrabold text-white tracking-[-0.5px] leading-[1.1]">
              {match.away_team}
            </span>
            <span className="font-mono text-[12px] tracking-[0.1em] text-ink-faint">
              {away.code}
            </span>
          </div>
        </div>
      </div>

      {/* Lock banner */}
      {pick && !locked && (() => {
        const cashoutValue = betAmount !== null ? estimateCashout(pick, sentiment, betAmount) : null;
        return cashingOut ? (
          <div
            className="mb-3.5 rounded-[10px] px-[14px] py-[12px]"
            style={{ background: "rgba(255,80,80,0.05)", border: "1px solid rgba(255,80,80,0.2)" }}
          >
            <div className="mb-[8px] text-[13px] font-semibold text-[#ff5050]">
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
                style={{ background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.35)", color: "#ff5050" }}
              >
                {cashoutBusy ? "Processing…" : `Confirm — get ${cashoutValue?.toLocaleString()} coins`}
              </button>
              <button
                onClick={() => setCashingOut(false)}
                disabled={cashoutBusy}
                className="rounded-[8px] px-[14px] py-[8px] font-mono text-[12px] text-ink-faint transition-colors hover:text-ink disabled:opacity-40"
                style={{ background: "#0f0f0f", border: "1px solid #1e1e1e" }}
              >
                Keep bet
              </button>
            </div>
          </div>
        ) : (
          <div
            className="mb-3.5 flex items-center gap-2 rounded-[10px] px-[14px] py-[10px]"
            style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.15)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00ff87" strokeWidth="2" strokeLinecap="round">
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
                  <CoinIcon color="#00ff87" />
                  <span>{betAmount.toLocaleString()} coins wagered</span>
                </div>
              )}
            </div>
            {cashoutValue !== null && (
              <button
                onClick={() => setCashingOut(true)}
                className="flex flex-col items-end rounded-[8px] px-[10px] py-[6px] font-mono transition-all"
                style={{ background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.18)" }}
              >
                <span className="text-[10px] tracking-[0.06em] text-[#ff5050aa]">CASH OUT</span>
                <div className="flex items-center gap-[4px]">
                  <CoinIcon color="#ff5050" />
                  <span className="text-[13px] font-bold text-[#ff5050] tabular-nums">
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
                background: isSelected ? opt.bg : isHov && !dimmed ? "#171717" : "#141414",
                border: `1.5px solid ${isSelected ? opt.borderColor : isHov && !dimmed ? "#2a2a2a" : "#1e1e1e"}`,
                opacity: dimmed ? 0.35 : 1,
                boxShadow: isSelected ? `0 0 24px ${opt.color}12, 0 0 0 1px ${opt.color}18` : "none",
                minHeight: 260,
              }}
            >
              {/* Locked badge */}
              {isSelected && (
                <div
                  className="absolute right-3.5 top-3.5 flex items-center gap-[5px] rounded-[20px] px-[9px] py-[3px] font-mono text-[10px] font-bold"
                  style={{
                    background: `${opt.color}20`,
                    border: `1px solid ${opt.color}40`,
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
                  style={{ color: isSelected ? opt.color : "#cccccc" }}
                >
                  {teamLabel(opt)}
                </div>
              </div>

              {/* Big % */}
              <div className="font-mono tabular-nums">
                <div
                  className="text-[46px] font-medium leading-none tracking-[-2px]"
                  style={{ color: isSelected ? opt.color : "#d0d0d0" }}
                >
                  {pctVal.toFixed(0)}
                  <span className="text-[22px] text-[#444]">%</span>
                </div>
                <div className="mt-[4px] font-mono text-[10.5px] text-[#333]">
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
                    background: pick !== null ? "transparent" : isHov ? `${opt.color}18` : "transparent",
                    border: `1px solid ${pick !== null ? "#1a1a1a" : isHov ? `${opt.color}35` : "#1e1e1e"}`,
                    color: pick !== null ? "#2a2a2a" : isHov ? opt.color : "#3a3a3a",
                  }}
                >
                  {pick !== null ? "—" : `Bet on ${teamLabel(opt)}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {locked && (
        <p className="mt-4 text-center font-mono text-[11px] text-ink-faint">
          {match.result
            ? `Result: ${match.result === "home" ? match.home_team : match.result === "away" ? match.away_team : "Draw"}`
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
