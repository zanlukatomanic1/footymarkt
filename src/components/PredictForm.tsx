"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SentimentBar from "@/components/SentimentBar";
import { teamData } from "@/lib/teamData";
import { fmtKickoffLong } from "@/lib/dates";
import { estimateReward, sentimentPct } from "@/lib/coins";
import type { Match, Outcome, Sentiment } from "@/lib/types";

type Props = {
  match: Match;
  initialSentiment: Sentiment;
  initialPick: Outcome | null;
  signedIn: boolean;
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

export default function PredictForm({ match, initialSentiment, initialPick, signedIn }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [sentiment, setSentiment] = useState<Sentiment>(initialSentiment);
  const [pick, setPick] = useState<Outcome | null>(initialPick);
  const [hov, setHov] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const locked = new Date(match.kickoff_at).getTime() <= Date.now() || match.result !== null;
  const pct = useMemo(() => sentimentPct(sentiment), [sentiment]);
  const home = teamData(match.home_team);
  const away = teamData(match.away_team);


  const handleSelect = async (choice: Outcome) => {
    if (!signedIn) { router.push("/login"); return; }
    if (busy || locked) return;
    if (pick === choice) { setPick(null); return; }
    setErr(null);
    setBusy(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("predictions").upsert(
      { user_id: user.id, match_id: match.id, prediction: choice },
      { onConflict: "user_id,match_id" }
    );

    if (error) { setErr(error.message); setBusy(false); return; }

    setSentiment((s) => {
      const n = { ...s };
      if (pick !== null) {
        n[`${pick}_count` as const] = Math.max(0, n[`${pick}_count` as const] - 1);
      } else {
        n.total_count += 1;
      }
      n[`${choice}_count` as const] += 1;
      return n;
    });
    setPick(choice);
    setBusy(false);
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
      {pick && !locked && (
        <div
          className="mb-3.5 flex items-center gap-2 rounded-[10px] px-[14px] py-[10px]"
          style={{
            background: "rgba(0,255,135,0.05)",
            border: "1px solid rgba(0,255,135,0.15)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00ff87" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="flex-1 text-[13px] font-semibold text-brand">
            Prediction locked in —{" "}
            {pick === "home" ? match.home_team : pick === "away" ? match.away_team : "Draw"}
          </span>
          <button
            onClick={() => setPick(null)}
            className="flex items-center gap-[4px] font-mono text-[11px] text-ink-faint hover:text-ink transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Change
          </button>
        </div>
      )}

      {/* Prediction cards */}
      <div className="flex flex-col gap-3.5 md:flex-row">
        {OPTS.map((opt) => {
          const isSelected = pick === opt.key;
          const dimmed = pick !== null && !isSelected;
          const isHov = hov === opt.key;
          const reward = estimateReward(opt.key, sentiment, pick !== opt.key);
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
                  {pick !== null ? "—" : `Pick ${teamLabel(opt)}`}
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
    </div>
  );
}
