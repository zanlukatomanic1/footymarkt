import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import PredictForm from "@/components/PredictForm";
import type { Match, Outcome, Sentiment } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: match } = await supabase
    .from("matches").select("*").eq("id", params.id).single();
  if (!match) return { title: "Match Not Found" };

  const { data: sentiment } = await supabase
    .from("match_sentiment").select("*").eq("match_id", params.id).single();

  const total = sentiment?.total_count ?? 0;
  const homeP = total > 0 ? Math.round(((sentiment?.home_count ?? 0) / total) * 100) : null;
  const awayP = total > 0 ? Math.round(((sentiment?.away_count ?? 0) / total) * 100) : null;

  const desc =
    homeP !== null
      ? `${homeP}% back ${match.home_team} · ${awayP}% back ${match.away_team}. Predict the WC 2026 result.`
      : `Predict ${match.home_team} vs ${match.away_team} in WC 2026.`;

  return {
    title: `${match.home_team} vs ${match.away_team}`,
    description: desc,
    openGraph: {
      title: `${match.home_team} vs ${match.away_team}`,
      description: desc,
    },
  };
}

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

  const m = match as Match;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${m.home_team} vs ${m.away_team}`,
    startDate: m.kickoff_at,
    sport: "Football",
    competitor: [
      { "@type": "SportsTeam", name: m.home_team },
      { "@type": "SportsTeam", name: m.away_team },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TopBar
        title="Match Prediction"
        subtitle={`${m.competition} · ${m.home_team} vs ${m.away_team}`}
      />
      <PredictForm
        match={m}
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
