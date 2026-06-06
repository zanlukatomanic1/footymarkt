import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Match, Sentiment } from "@/lib/types";

export const CACHE_TAGS = {
  matches: "matches",
  sentiments: "sentiments",
  leaderboard: "leaderboard",
} as const;

// Per-request dedupe: layout + page can both call this and only one auth roundtrip happens.
export const getCurrentUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("id, username, coins, is_admin")
    .eq("id", user.id)
    .single();
  return data;
});

// Public data — shared across all users, safe to cache across requests.
export const getMatchesCached = unstable_cache(
  async (competition: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("matches")
      .select("*")
      .eq("competition", competition)
      .order("kickoff_at", { ascending: true });
    return (data ?? []) as Match[];
  },
  ["matches"],
  { revalidate: 60, tags: [CACHE_TAGS.matches] }
);

export const getSentimentsCached = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin.from("match_sentiment").select("*");
    const map: Record<string, Sentiment> = {};
    for (const s of (data ?? []) as Sentiment[]) {
      map[s.match_id] = s;
    }
    return map;
  },
  ["sentiments"],
  { revalidate: 30, tags: [CACHE_TAGS.sentiments] }
);

export const getLeaderboardTopCached = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const [{ data: users }, { data: allPreds }] = await Promise.all([
      admin
        .from("users")
        .select("id, username, coins")
        .not("username", "is", null)
        .order("coins", { ascending: false })
        .limit(100),
      admin.from("predictions").select("user_id, was_correct"),
    ]);

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
        userId: u.id as string,
        rank: i + 1,
        username: u.username as string,
        coins: u.coins as number,
        correct,
        total,
        rate: total > 0 ? (correct / total) * 100 : 0,
      };
    });

    return { rows, correctMap: Object.fromEntries(correctMap), totalMap: Object.fromEntries(totalMap) };
  },
  ["leaderboard-top"],
  { revalidate: 60, tags: [CACHE_TAGS.leaderboard] }
);
