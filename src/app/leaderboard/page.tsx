import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getLeaderboardTopCached } from "@/lib/cache";
import TopBar from "@/components/TopBar";
import LeaderboardClient from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top WC 2026 predictors on FootyMarkt. See who's reading the crowd best.",
  openGraph: {
    title: "FootyMarkt Leaderboard",
    description: "Top WC 2026 predictors on FootyMarkt. See who's reading the crowd best.",
  },
};

export default async function Leaderboard() {
  const [user, { rows: cachedRows, correctMap, totalMap }] = await Promise.all([
    getCurrentUser(),
    getLeaderboardTopCached(),
  ]);

  const rows = cachedRows.map((r) => ({
    rank: r.rank,
    username: r.username,
    coins: r.coins,
    correct: r.correct,
    total: r.total,
    rate: r.rate,
  }));

  let me = null;
  if (user) {
    const inTop = cachedRows.find((r) => r.userId === user.id);
    if (inTop) {
      me = {
        rank: inTop.rank,
        username: inTop.username,
        coins: inTop.coins,
        correct: inTop.correct,
        total: inTop.total,
        rate: inTop.rate,
        isMe: true,
      };
    } else {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("users")
        .select("username, coins")
        .eq("id", user.id)
        .single();
      if (profile?.username) {
        const correct = correctMap[user.id] ?? 0;
        const total = totalMap[user.id] ?? 0;
        const { count: rankCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gt("coins", profile.coins);
        me = {
          rank: (rankCount ?? 0) + 1,
          username: profile.username,
          coins: profile.coins,
          correct,
          total,
          rate: total > 0 ? (correct / total) * 100 : 0,
          isMe: true,
        };
      }
    }
  }

  return (
    <>
      <TopBar title="Leaderboard" subtitle="WC 2026 · Updated in real-time" />
      <LeaderboardClient rows={rows} me={me} />
    </>
  );
}
