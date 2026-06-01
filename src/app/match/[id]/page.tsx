import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import PredictForm from "@/components/PredictForm";
import type { Match, Outcome, Sentiment } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: match } = await supabase
    .from("matches").select("*").eq("id", params.id).single();
  if (!match) notFound();

  const { data: sentiment } = await supabase
    .from("match_sentiment").select("*").eq("match_id", params.id).single();

  let pick: Outcome | null = null;
  let betAmount: number | null = null;
  let userCoins = 0;
  if (user) {
    const [predRes, profileRes] = await Promise.all([
      supabase
        .from("predictions")
        .select("prediction, bet_amount")
        .eq("match_id", params.id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("users").select("coins").eq("id", user.id).single(),
    ]);
    pick = (predRes.data?.prediction as Outcome) ?? null;
    betAmount = predRes.data?.bet_amount ?? null;
    userCoins = profileRes.data?.coins ?? 0;
  }

  return (
    <>
      <TopBar
        title="Match Prediction"
        subtitle={`${(match as Match).competition} · ${(match as Match).home_team} vs ${(match as Match).away_team}`}
      />
      <PredictForm
        match={match as Match}
        initialSentiment={(sentiment as Sentiment) ?? {
          match_id: params.id,
          home_count: 0,
          draw_count: 0,
          away_count: 0,
          total_count: 0,
        }}
        initialPick={pick}
        initialBet={betAmount}
        signedIn={!!user}
        userCoins={userCoins}
      />
    </>
  );
}
