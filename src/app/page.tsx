import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MatchCard from "@/components/MatchCard";
import type { Match, Outcome, Sentiment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Show upcoming + live matches (kickoff in past but no result) for WC2026.
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition", "WC2026")
    .is("result", null)
    .order("kickoff_at", { ascending: true });

  const { data: sentiments } = await supabase
    .from("match_sentiment")
    .select("*");

  let userPicks: Record<string, Outcome> = {};
  if (user) {
    const { data: preds } = await supabase
      .from("predictions")
      .select("match_id,prediction")
      .eq("user_id", user.id);
    userPicks = Object.fromEntries(
      (preds ?? []).map((p) => [p.match_id, p.prediction as Outcome])
    );
  }

  const sentMap = new Map<string, Sentiment>(
    (sentiments ?? []).map((s: Sentiment) => [s.match_id, s])
  );

  const list = (matches ?? []) as Match[];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Markets</h1>
          <p className="text-xs text-ink-muted">
            Crowd-set odds. World Cup 2026.
          </p>
        </div>
        {!user && (
          <Link
            href="/login"
            className="rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-bg"
          >
            Sign in to predict
          </Link>
        )}
      </div>

      {list.length === 0 && (
        <div className="rounded-2xl border border-border bg-bg-card p-8 text-center text-sm text-ink-muted">
          No upcoming matches yet.
        </div>
      )}

      {list.map((m) => {
        const s = sentMap.get(m.id) ?? {
          match_id: m.id,
          home_count: 0,
          draw_count: 0,
          away_count: 0,
          total_count: 0,
        };
        return (
          <MatchCard
            key={m.id}
            match={m}
            sentiment={s}
            userPick={userPicks[m.id] ?? null}
          />
        );
      })}
    </div>
  );
}
