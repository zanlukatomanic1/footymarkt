import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { teamData } from "@/lib/teamData";
import TopBar from "@/components/TopBar";
import PredictForm from "@/components/PredictForm";
import SentimentHistory, { type HistoryPoint } from "@/components/SentimentHistory";
import MatchChat from "@/components/MatchChat";
import type { Match, Outcome, Sentiment } from "@/lib/types";

const MIN_TOTAL_FOR_HISTORY = 5;
const MAX_HISTORY_POINTS = 200;

function buildHistory(rows: { prediction: Outcome; created_at: string }[]): HistoryPoint[] {
  let h = 0, d = 0, a = 0;
  const raw: HistoryPoint[] = [];
  for (const r of rows) {
    if (r.prediction === "home") h++;
    else if (r.prediction === "draw") d++;
    else a++;
    const total = h + d + a;
    if (total < MIN_TOTAL_FOR_HISTORY) continue;
    raw.push({
      t: new Date(r.created_at).getTime(),
      home: (h / total) * 100,
      draw: (d / total) * 100,
      away: (a / total) * 100,
    });
  }
  if (raw.length <= MAX_HISTORY_POINTS) return raw;
  // Downsample: bucket by index, keep last value per bucket.
  const step = raw.length / MAX_HISTORY_POINTS;
  const out: HistoryPoint[] = [];
  for (let i = 0; i < MAX_HISTORY_POINTS; i++) {
    const idx = Math.min(raw.length - 1, Math.floor((i + 1) * step) - 1);
    out.push(raw[idx]);
  }
  return out;
}

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

  const home = teamData(match.home_team);
  const away = teamData(match.away_team);
  const ogParams = new URLSearchParams({
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homeCode: home.code,
    awayCode: away.code,
    home: String(homeP ?? 33),
    draw: String(total > 0 ? Math.round(((sentiment?.draw_count ?? 0) / total) * 100) : 34),
    away: String(awayP ?? 33),
    comp: match.competition,
  });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://footymarkt.com";
  const ogImageUrl = `${baseUrl}/api/og/prediction?${ogParams.toString()}`;

  return {
    title: `${match.home_team} vs ${match.away_team}`,
    description: desc,
    openGraph: {
      title: `${match.home_team} vs ${match.away_team}`,
      description: desc,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${match.home_team} vs ${match.away_team}`,
      description: desc,
      images: [ogImageUrl],
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

  const { data: historyRows } = await supabase
    .from("predictions")
    .select("prediction, created_at")
    .eq("match_id", params.id)
    .order("created_at", { ascending: true });

  const history = buildHistory((historyRows ?? []) as { prediction: Outcome; created_at: string }[]);

  const { data: recentData } = await supabase
    .from("predictions")
    .select("prediction, created_at, users:user_id(username)")
    .eq("match_id", params.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const recentPicks = (recentData ?? [])
    .map((r: any) => ({
      username: r.users?.username as string | null,
      prediction: r.prediction as Outcome,
      created_at: r.created_at as string,
    }))
    .filter((r) => !!r.username) as { username: string; prediction: Outcome; created_at: string }[];

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
        recentPicks={recentPicks}
      />
      <div className="px-[22px] pb-6 md:px-6">
        <SentimentHistory points={history} homeTeam={m.home_team} awayTeam={m.away_team} />
      </div>
      <div className="px-[22px] pb-8 md:px-6">
        <MatchChat matchId={params.id} />
      </div>
    </>
  );
}
