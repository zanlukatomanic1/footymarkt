import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import { sendPushToUsers } from "@/lib/push";

function isAdminEmail(email: string | undefined) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { matchId, result } = body as {
    matchId?: string;
    result?: "home" | "draw" | "away";
  };
  if (!matchId || !["home", "draw", "away"].includes(result ?? "")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error: updErr } = await admin
    .from("matches")
    .update({ result })
    .eq("id", matchId);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  const { error: rpcErr } = await admin.rpc("award_match_coins", {
    p_match_id: matchId,
  });
  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  revalidateTag(CACHE_TAGS.matches);
  revalidateTag(CACHE_TAGS.sentiments);
  revalidateTag(CACHE_TAGS.leaderboard);

  // Fire-and-forget push fan-out. Don't fail the request if pushes break.
  try {
    const [{ data: match }, { data: bettors }] = await Promise.all([
      admin.from("matches").select("home_team, away_team").eq("id", matchId).single(),
      admin
        .from("predictions")
        .select("user_id, was_correct, coins_earned")
        .eq("match_id", matchId),
    ]);

    if (match && bettors?.length) {
      const winners = bettors.filter((b) => b.was_correct).map((b) => b.user_id);
      const losers = bettors.filter((b) => b.was_correct === false).map((b) => b.user_id);
      const matchLabel = `${match.home_team} vs ${match.away_team}`;
      const url = `/match/${matchId}`;

      if (winners.length) {
        const sample = bettors.find((b) => b.was_correct && b.coins_earned > 0);
        await sendPushToUsers(winners, {
          title: "You called it",
          body: sample
            ? `${matchLabel} settled — +${sample.coins_earned} coins for the right side.`
            : `${matchLabel} settled — you picked the right side.`,
          url,
          tag: `match-${matchId}`,
        });
      }
      if (losers.length) {
        await sendPushToUsers(losers, {
          title: "Match settled",
          body: `${matchLabel} is done. Next one's on you.`,
          url,
          tag: `match-${matchId}`,
        });
      }
    }
  } catch {
    // swallow — push isn't critical
  }

  return NextResponse.json({ ok: true });
}
