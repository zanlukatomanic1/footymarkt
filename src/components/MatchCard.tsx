import Link from "next/link";
import type { Match, Outcome, Sentiment } from "@/lib/types";
import { sentimentPct } from "@/lib/coins";

type Props = {
  match: Match;
  sentiment: Sentiment;
  userPick?: Outcome | null;
};

function fmtKickoff(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Bar({ label, pct, picked }: { label: string; pct: number; picked: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span
          className={picked ? "font-semibold text-brand" : "text-ink-muted"}
        >
          {label}
        </span>
        <span className="tabular-nums text-ink">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={picked ? "h-full bg-brand" : "h-full bg-ink-dim"}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

export default function MatchCard({ match, sentiment, userPick }: Props) {
  const pct = sentimentPct(sentiment);
  const now = Date.now();
  const live =
    new Date(match.kickoff_at).getTime() <= now && match.result === null;

  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-2xl border border-border bg-bg-card p-4 shadow-card transition hover:border-border-strong"
    >
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span className="uppercase tracking-wider">{match.competition}</span>
        <span className="flex items-center gap-1.5">
          {live && (
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          )}
          {live ? "Live" : fmtKickoff(match.kickoff_at)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex-1 text-base font-medium">{match.home_team}</div>
        <div className="px-2 text-xs text-ink-dim">vs</div>
        <div className="flex-1 text-right text-base font-medium">{match.away_team}</div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Bar label="Home" pct={pct.home} picked={userPick === "home"} />
        <Bar label="Draw" pct={pct.draw} picked={userPick === "draw"} />
        <Bar label="Away" pct={pct.away} picked={userPick === "away"} />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-ink-dim">
          {sentiment.total_count} prediction{sentiment.total_count === 1 ? "" : "s"}
        </span>
        {userPick ? (
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-ink-muted">
            Your pick: <span className="text-brand">{userPick}</span>
          </span>
        ) : (
          <span className="rounded-full bg-brand px-3 py-1 font-medium text-bg">
            Predict
          </span>
        )}
      </div>
    </Link>
  );
}
