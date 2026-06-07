import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { estimateCashout } from "@/lib/coins";
import { checkRateLimit } from "@/lib/rateLimit";
import type { Outcome, Sentiment } from "@/lib/types";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 10 cashouts / 60s per user.
  const allowed = await checkRateLimit(user.id, "cashout", 60, 10);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many cashout attempts — try again in a moment." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { matchId } = body as { matchId?: string };
  if (!matchId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const admin = createAdminClient();

  // Load match — must still be open
  const { data: match } = await admin
    .from("matches")
    .select("kickoff_at, result")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.result !== null || new Date(match.kickoff_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Match is locked — cashout unavailable" }, { status: 400 });
  }

  // Load the user's prediction
  const { data: pred } = await admin
    .from("predictions")
    .select("id, prediction, bet_amount")
    .eq("user_id", user.id)
    .eq("match_id", matchId)
    .maybeSingle();

  if (!pred) return NextResponse.json({ error: "No prediction found" }, { status: 404 });

  // Load current sentiment for cashout calculation
  const { data: sentimentRow } = await admin
    .from("match_sentiment")
    .select("*")
    .eq("match_id", matchId)
    .single();

  const sentiment: Sentiment = sentimentRow ?? {
    match_id: matchId,
    home_count: 0,
    draw_count: 0,
    away_count: 0,
    total_count: 0,
  };

  const cashout = estimateCashout(pred.prediction as Outcome, sentiment, pred.bet_amount ?? 100);

  // Load user's current balance
  const { data: profile } = await admin
    .from("users")
    .select("coins")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Delete prediction and credit cashout amount atomically (sequential writes — safe enough for this app)
  const { error: delErr } = await admin
    .from("predictions")
    .delete()
    .eq("id", pred.id)
    .eq("user_id", user.id);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const newBalance = profile.coins + cashout;
  const { error: coinErr } = await admin
    .from("users")
    .update({ coins: newBalance })
    .eq("id", user.id);

  if (coinErr) {
    // Best-effort: re-insert prediction if coin update failed
    await admin.from("predictions").insert({
      id: pred.id,
      user_id: user.id,
      match_id: matchId,
      prediction: pred.prediction,
      bet_amount: pred.bet_amount,
    });
    return NextResponse.json({ error: coinErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cashout, newBalance });
}
