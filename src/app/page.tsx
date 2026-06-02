import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import HomeClient from "@/components/HomeClient";
import type { Match, Outcome, Sentiment } from "@/lib/types";

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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("competition", "WC2026")
    .order("kickoff_at", { ascending: true });

  const { data: sentiments } = await supabase.from("match_sentiment").select("*");

  let userPicks: Record<string, Outcome> = {};
  let stats: { predictions: number; correct: number; coins: number; rank: number } | null = null;

  if (user) {
    const { data: preds } = await supabase
      .from("predictions")
      .select("match_id, prediction")
      .eq("user_id", user.id);
    userPicks = Object.fromEntries(
      (preds ?? []).map((p) => [p.match_id, p.prediction as Outcome])
    );

    const { data: profile } = await supabase
      .from("users")
      .select("coins")
      .eq("id", user.id)
      .single();

    const { count: correctCount } = await supabase
      .from("predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("was_correct", true);

    const userCoins = profile?.coins ?? 0;
    const { count: rankCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("coins", userCoins);

    stats = {
      predictions: Object.keys(userPicks).length,
      correct: correctCount ?? 0,
      coins: userCoins,
      rank: (rankCount ?? 0) + 1,
    };
  }

  const sentMap: Record<string, Sentiment> = {};
  for (const s of sentiments ?? []) {
    sentMap[(s as Sentiment).match_id] = s as Sentiment;
  }

  const openCount = (matches ?? []).filter((m: any) => !m.result).length;

  return (
    <>
      <TopBar title="Today's Matches" subtitle={`WC 2026 · ${openCount} open predictions`} />
      <HomeClient
        matches={(matches as Match[] | null) ?? []}
        sentMap={sentMap}
        userPicks={userPicks}
        signedIn={!!user}
        stats={stats}
      />
    </>
  );
}
