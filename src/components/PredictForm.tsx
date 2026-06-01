"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Match, Outcome, Sentiment } from "@/lib/types";
import { estimateReward, sentimentPct } from "@/lib/coins";

type Props = {
  match: Match;
  initialSentiment: Sentiment;
  initialPick: Outcome | null;
  signedIn: boolean;
};

const OPTIONS: { key: Outcome; label: string; sub: (m: Match) => string }[] = [
  { key: "home", label: "Home Win", sub: (m) => m.home_team },
  { key: "draw", label: "Draw", sub: () => "X" },
  { key: "away", label: "Away Win", sub: (m) => m.away_team },
];

export default function PredictForm({
  match,
  initialSentiment,
  initialPick,
  signedIn,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [sentiment, setSentiment] = useState<Sentiment>(initialSentiment);
  const [pick, setPick] = useState<Outcome | null>(initialPick);
  const [hover, setHover] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const locked = new Date(match.kickoff_at).getTime() <= Date.now();

  const pct = useMemo(() => sentimentPct(sentiment), [sentiment]);
  const focus = hover ?? pick;

  const submit = async (choice: Outcome) => {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    if (busy || locked) return;
    setErr(null);
    setBusy(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("predictions")
      .upsert(
        {
          user_id: user.id,
          match_id: match.id,
          prediction: choice,
        },
        { onConflict: "user_id,match_id" }
      );

    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }

    // Optimistically include the new vote in counts.
    setSentiment((s) => {
      const prev = pick;
      const next = { ...s };
      if (prev === null) {
        next.total_count += 1;
      } else {
        next[`${prev}_count` as const] = Math.max(
          0,
          next[`${prev}_count` as const] - 1
        );
      }
      next[`${choice}_count` as const] = next[`${choice}_count` as const] + 1;
      return next;
    });
    setPick(choice);
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-bg-card p-5 shadow-card">
        <div className="text-xs uppercase tracking-wider text-ink-muted">
          {match.competition} · {new Date(match.kickoff_at).toLocaleString()}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-lg font-semibold">{match.home_team}</div>
          <div className="text-xs text-ink-dim">vs</div>
          <div className="text-lg font-semibold">{match.away_team}</div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
          <Slice label="Home" v={pct.home} active={focus === "home"} />
          <Slice label="Draw" v={pct.draw} active={focus === "draw"} />
          <Slice label="Away" v={pct.away} active={focus === "away"} />
        </div>
        <p className="mt-3 text-center text-xs text-ink-dim">
          {sentiment.total_count} predictions so far
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {OPTIONS.map((o) => {
          const isPicked = pick === o.key;
          const reward = estimateReward(o.key, sentiment, pick !== o.key);
          return (
            <button
              key={o.key}
              onMouseEnter={() => setHover(o.key)}
              onMouseLeave={() => setHover(null)}
              onClick={() => submit(o.key)}
              disabled={busy || locked}
              className={[
                "group flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition",
                isPicked
                  ? "border-brand bg-brand-glow"
                  : "border-border bg-bg-card hover:border-border-strong",
                locked ? "opacity-60" : "",
              ].join(" ")}
            >
              <div>
                <div
                  className={
                    "text-base font-medium " + (isPicked ? "text-brand" : "")
                  }
                >
                  {o.label}
                </div>
                <div className="text-xs text-ink-muted">{o.sub(match)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-ink-muted">If correct</div>
                <div className="text-base font-semibold tabular-nums">
                  +{reward}
                  <span className="ml-1 text-xs text-brand">●</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {locked && (
        <p className="text-center text-xs text-ink-muted">
          Predictions locked — match has kicked off.
        </p>
      )}
      {err && <p className="text-center text-sm text-red-400">{err}</p>}
      {pick && !locked && (
        <p className="text-center text-xs text-ink-muted">
          Tap another option to change your pick before kickoff.
        </p>
      )}
    </div>
  );
}

function Slice({ label, v, active }: { label: string; v: number; active: boolean }) {
  return (
    <div
      className={
        "rounded-xl border px-3 py-3 transition " +
        (active
          ? "border-brand bg-brand-glow"
          : "border-border bg-bg-elevated")
      }
    >
      <div className="text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">
        {v.toFixed(0)}%
      </div>
    </div>
  );
}
