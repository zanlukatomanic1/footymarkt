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
  if (user) {
    const { data: pred } = await supabase
      .from("predictions")
      .select("prediction")
      .eq("match_id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();
    pick = (pred?.prediction as Outcome) ?? null;
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
        signedIn={!!user}
      />
    </>
  );
}
