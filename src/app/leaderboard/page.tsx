import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: users } = await supabase
    .from("users")
    .select("id, username, coins")
    .not("username", "is", null)
    .order("coins", { ascending: false })
    .limit(100);

  const { data: allPreds } = await supabase
    .from("predictions")
    .select("user_id, was_correct");

  const correctMap = new Map<string, number>();
  const totalMap = new Map<string, number>();
  for (const p of allPreds ?? []) {
    totalMap.set(p.user_id, (totalMap.get(p.user_id) ?? 0) + 1);
    if (p.was_correct) {
      correctMap.set(p.user_id, (correctMap.get(p.user_id) ?? 0) + 1);
    }
  }

  const rows = (users ?? []).map((u, i) => {
    const correct = correctMap.get(u.id) ?? 0;
    const total = totalMap.get(u.id) ?? 0;
    return {
      rank: i + 1,
      username: u.username as string,
      coins: u.coins,
      correct,
      total,
      rate: total > 0 ? (correct / total) * 100 : 0,
    };
  });

  let me = null;
  if (user) {
    const myIdx = rows.findIndex((r) => {
      const u = (users ?? []).find((u) => u.id === user.id);
      return u && r.username === u.username;
    });
    if (myIdx >= 0) {
      me = { ...rows[myIdx], isMe: true };
    } else {
      // User exists but outside top 100
      const { data: profile } = await supabase
        .from("users")
        .select("username, coins")
        .eq("id", user.id)
        .single();
      if (profile?.username) {
        const correct = correctMap.get(user.id) ?? 0;
        const total = totalMap.get(user.id) ?? 0;
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
