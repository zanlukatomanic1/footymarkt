import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import type { Outcome } from "@/lib/types";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { matchId, prediction, betAmount } = body as {
    matchId?: string;
    prediction?: Outcome;
    betAmount?: number;
  };

  if (!matchId || !["home", "draw", "away"].includes(prediction ?? "")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (typeof betAmount !== "number" || betAmount < 1 || !Number.isInteger(betAmount)) {
    return NextResponse.json({ error: "Invalid bet amount" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check match is not yet kicked off and has no result
  const { data: match } = await admin
    .from("matches")
    .select("kickoff_at, result")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.result !== null || new Date(match.kickoff_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Match is locked" }, { status: 400 });
  }

  // Check if user already has a prediction for this match
  const { data: existing } = await admin
    .from("predictions")
    .select("id, bet_amount")
    .eq("user_id", user.id)
    .eq("match_id", matchId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Bet already placed for this match" }, { status: 400 });
  }

  // Check user has enough coins
  const { data: profile } = await admin
    .from("users")
    .select("coins")
    .eq("id", user.id)
    .single();

  if (!profile || profile.coins < betAmount) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
  }

  // Deduct coins
  const { error: deductErr } = await admin
    .from("users")
    .update({ coins: profile.coins - betAmount })
    .eq("id", user.id)
    .eq("coins", profile.coins); // optimistic lock — fails if coins changed between reads

  if (deductErr) {
    return NextResponse.json({ error: "Failed to deduct coins — please try again" }, { status: 500 });
  }

  // Save prediction
  const { error: predErr } = await admin
    .from("predictions")
    .upsert(
      { user_id: user.id, match_id: matchId, prediction, bet_amount: betAmount },
      { onConflict: "user_id,match_id" }
    );

  if (predErr) {
    // Refund coins if prediction save failed
    await admin.from("users").update({ coins: profile.coins }).eq("id", user.id);
    return NextResponse.json({ error: predErr.message }, { status: 500 });
  }

  revalidateTag(CACHE_TAGS.sentiments);
  revalidateTag(CACHE_TAGS.leaderboard);

  return NextResponse.json({ ok: true, newBalance: profile.coins - betAmount });
}
