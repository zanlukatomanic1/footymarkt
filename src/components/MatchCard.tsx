"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SentimentBar from "@/components/SentimentBar";
import { teamData } from "@/lib/teamData";
import { fmtKickoff } from "@/lib/dates";
import { sentimentPct } from "@/lib/coins";
import type { Match, Outcome, Sentiment } from "@/lib/types";

type Props = {
  match: Match;
  sentiment: Sentiment;
  userPick?: Outcome | null;
  signedIn: boolean;
};

const PICK_COLOR: Record<Outcome, string> = {
  home: "#00ff87",
  draw: "#666666",
  away: "#4d7cff",
};

export default function MatchCard({ match, sentiment, userPick, signedIn }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [pick, setPick] = useState<Outcome | null>(userPick ?? null);
  const [sent, setSent] = useState<Sentiment>(sentiment);
  const [hov, setHov] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sync sentiment when real-time update arrives from parent
  useEffect(() => { setSent(sentiment); }, [sentiment]);

  const home = teamData(match.home_team);
  const away = teamData(match.away_team);
  const pct = sentimentPct(sent);
  const locked = new Date(match.kickoff_at).getTime() <= Date.now() || match.result !== null;


  const handlePredict = async (e: React.MouseEvent, choice: Outcome) => {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) { router.push("/login"); return; }
    if (busy || locked) return;

    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("predictions").upsert(
      { user_id: user.id, match_id: match.id, prediction: choice },
      { onConflict: "user_id,match_id" }
    );

    setSent((s) => {
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
  };

  return (
    <Link
      href={`/match/${match.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="block rounded-[12px] p-[18px] transition-all duration-150"
      style={{
        background: hov ? "#171717" : "#141414",
        border: `1px solid ${hov ? "#2c2c2c" : "#1e1e1e"}`,
        boxShadow: hov ? "0 0 0 1px rgba(0,255,135,0.04)" : "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-ink-faint tracking-[0.04em]">
          {match.competition}
        </span>
        <span className="font-mono text-[10.5px] text-ink-faint">
          {match.result !== null ? "FT" : fmtKickoff(match.kickoff_at)}
        </span>
      </div>

      {/* Teams */}
      <div className="mt-3.5 flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-[3px]">
          {home.flag ? (
            <img src={home.flag} alt={match.home_team} className="h-[22px] w-[22px] rounded-sm object-cover" />
          ) : (
            <span className="text-[22px] leading-none">🏳️</span>
          )}
          <span className="text-[13px] font-semibold text-[#e0e0e0] tracking-[-0.2px] leading-[1.2]">
            {match.home_team}
          </span>
          <span className="font-mono text-[9.5px] text-[#333] tracking-[0.1em]">
            {home.code}
          </span>
        </div>

        {/* Center: score if settled, LIVE if in progress, VS if upcoming */}
        <div className="flex-shrink-0 flex flex-col items-center gap-[3px] pt-1">
          {match.result !== null && match.home_score !== null && match.away_score !== null ? (
            <span className="font-mono text-[18px] font-bold tabular-nums text-white leading-none">
              {match.home_score} – {match.away_score}
            </span>
          ) : locked && match.result === null ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#ff6b35]">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff6b35]" />
              LIVE
            </span>
          ) : (
            <span className="font-mono text-[10px] text-[#2a2a2a] tracking-[0.12em]">VS</span>
          )}
        </div>

        <div className="flex flex-1 flex-col items-end gap-[3px]">
          {away.flag ? (
            <img src={away.flag} alt={match.away_team} className="h-[22px] w-[22px] rounded-sm object-cover" />
          ) : (
            <span className="text-[22px] leading-none">🏳️</span>
          )}
          <span className="text-right text-[13px] font-semibold text-[#e0e0e0] tracking-[-0.2px] leading-[1.2]">
            {match.away_team}
          </span>
          <span className="font-mono text-[9.5px] text-[#333] tracking-[0.1em]">
            {away.code}
          </span>
        </div>
      </div>

      {/* Sentiment bar */}
      <div className="mt-3.5">
        <SentimentBar home={pct.home} draw={pct.draw} away={pct.away} />
      </div>

      {/* Footer */}
      <div className="mt-3.5 flex items-center justify-between pt-[2px]">
        <span className="font-mono text-[10.5px] text-[#2e2e2e]">
          {sent.total_count.toLocaleString()} preds
        </span>

        {match.result !== null ? (
          <span
            className="rounded-[5px] px-[9px] py-[3px] font-mono text-[10.5px] font-bold tracking-[0.05em]"
            style={{
              color: PICK_COLOR[match.result],
              background: `${PICK_COLOR[match.result]}12`,
              border: `1px solid ${PICK_COLOR[match.result]}28`,
            }}
          >
            {match.result === "home" ? home.code : match.result === "away" ? away.code : "DRAW"}
          </span>
        ) : pick ? (
          <div
            className="flex items-center gap-[5px] rounded-[6px] px-[10px] py-[4px] font-mono text-[10.5px] font-bold tracking-[0.06em]"
            style={{
              color: PICK_COLOR[pick],
              background: `${PICK_COLOR[pick]}12`,
              border: `1px solid ${PICK_COLOR[pick]}30`,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {pick === "home" ? home.code : pick === "away" ? away.code : "D"}
          </div>
        ) : locked ? null : (
          <div className="flex gap-[5px]" onClick={(e) => e.preventDefault()}>
            {([["home", home.code, "#00ff87"], ["draw", "D", "#555555"], ["away", away.code, "#4d7cff"]] as const).map(
              ([k, lbl, col]) => (
                <button
                  key={k}
                  disabled={busy}
                  onClick={(e) => handlePredict(e, k as Outcome)}
                  className="rounded-[6px] px-[9px] py-[4px] font-mono text-[10px] font-semibold tracking-[0.06em] transition-colors disabled:opacity-50"
                  style={{
                    background: "transparent",
                    border: `1px solid ${col}28`,
                    color: col,
                  }}
                >
                  {lbl}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
