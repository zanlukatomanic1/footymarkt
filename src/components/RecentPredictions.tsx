"use client";

import { teamData } from "@/lib/teamData";
import type { Match, Outcome } from "@/lib/types";

export type RecentPick = {
  username: string;
  prediction: Outcome;
  created_at: string;
};

type Props = {
  match: Match;
  picks: RecentPick[];
};

const PICK_VAR: Record<Outcome, string> = {
  home: "var(--pick-home-color)",
  draw: "var(--pick-draw-color)",
  away: "var(--pick-away-color)",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function pickLabel(match: Match, p: Outcome): string {
  if (p === "home") return match.home_team;
  if (p === "away") return match.away_team;
  return "Draw";
}

function Chip({ match, p }: { match: Match; p: RecentPick }) {
  return (
    <div
      className="inline-flex flex-shrink-0 items-center gap-[7px] rounded-full border px-[11px] py-[5px]"
      style={{ background: "var(--color-card)", borderColor: "var(--color-line)" }}
    >
      <div
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[8px] font-bold"
        style={{ background: "var(--color-element)", color: "var(--color-ink-faint)" }}
      >
        {(p.username[0] ?? "?").toUpperCase()}
      </div>
      <span className="text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
        {p.username}
      </span>
      <span
        className="font-mono text-[11px] font-bold"
        style={{ color: PICK_VAR[p.prediction] }}
      >
        {pickLabel(match, p.prediction)}
      </span>
      <span className="font-mono text-[10.5px]" style={{ color: "var(--color-ink-ghost)" }}>
        {timeAgo(p.created_at)}
      </span>
    </div>
  );
}

export default function RecentPredictions({ match, picks }: Props) {
  if (!picks.length) return null;

  // Marquee only kicks in when there's enough content to warrant it.
  const marquee = picks.length >= 6;

  if (!marquee) {
    return (
      <div className="mt-5">
        <div className="mb-[10px] font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
          Recent predictions
        </div>
        <div className="flex flex-wrap gap-2">
          {picks.map((p, i) => (
            <Chip key={i} match={match} p={p} />
          ))}
        </div>
      </div>
    );
  }

  const duration = Math.max(20, picks.length * 3);

  return (
    <div className="mt-5">
      <div className="mb-[10px] font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
        Recent predictions
      </div>
      <div
        className="group relative overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 32px, black calc(100% - 32px), transparent)",
        }}
      >
        <div
          className="flex w-max gap-2 fm-marquee"
          style={{ animationDuration: `${duration}s` }}
        >
          {picks.map((p, i) => (
            <Chip key={`a-${i}`} match={match} p={p} />
          ))}
          {picks.map((p, i) => (
            <Chip key={`b-${i}`} match={match} p={p} />
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes fm-marquee-kf {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .fm-marquee {
          animation-name: fm-marquee-kf;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .group:hover .fm-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
