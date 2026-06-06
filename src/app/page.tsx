import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  getCurrentProfile,
  getMatchesCached,
  getSentimentsCached,
} from "@/lib/cache";
import TopBar from "@/components/TopBar";
import HomeClient from "@/components/HomeClient";
import type { Outcome } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FootyMarkt — WC 2026 Prediction Market",
  description: "Predict World Cup 2026 matches. The crowd sets the odds — no bookmaker.",
  openGraph: {
    title: "FootyMarkt — WC 2026 Prediction Market",
    description: "Predict World Cup 2026 matches. The crowd sets the odds — no bookmaker.",
  },
};

export default async function Home() {
  const [user, matches, sentMap] = await Promise.all([
    getCurrentUser(),
    getMatchesCached("WC2026"),
    getSentimentsCached(),
  ]);

  let userPicks: Record<string, Outcome> = {};
  let stats: { predictions: number; correct: number; coins: number; rank: number } | null = null;

  if (user) {
    const supabase = createClient();
    const [predsRes, profile, correctRes] = await Promise.all([
      supabase.from("predictions").select("match_id, prediction").eq("user_id", user.id),
      getCurrentProfile(),
      supabase
        .from("predictions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("was_correct", true),
    ]);
    userPicks = Object.fromEntries(
      (predsRes.data ?? []).map((p) => [p.match_id, p.prediction as Outcome])
    );

    const userCoins = profile?.coins ?? 0;
    const { count: rankCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("coins", userCoins);

    stats = {
      predictions: Object.keys(userPicks).length,
      correct: correctRes.count ?? 0,
      coins: userCoins,
      rank: (rankCount ?? 0) + 1,
    };
  }

  const openCount = matches.filter((m) => !m.result).length;

  return (
    <>
      <TopBar title="Today's Matches" subtitle={`WC 2026 · ${openCount} open predictions`} />
      <HomeClient
        matches={matches}
        sentMap={sentMap}
        userPicks={userPicks}
        signedIn={!!user}
        stats={stats}
      />
    </>
  );
}
