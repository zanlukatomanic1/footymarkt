import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { fetchWCMatches, toOutcome } from "@/lib/footballdata";

function isAdminEmail(email: string | undefined) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin && !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Load unsettled matches that have an external_id
  const admin = createAdminClient();
  const { data: unsettled, error: fetchErr } = await admin
    .from("matches")
    .select("id, external_id")
    .is("result", null)
    .not("external_id", "is", null);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!unsettled?.length) return NextResponse.json({ ok: true, settled: 0 });

  let apiMatches;
  try {
    apiMatches = await fetchWCMatches();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Index API results by fixture ID
  const byId = new Map(apiMatches.map((m) => [m.id, m]));

  let settled = 0;
  const errors: string[] = [];

  for (const row of unsettled) {
    const fixture = byId.get(row.external_id as number);
    if (!fixture || fixture.status !== "FINISHED") continue;

    const outcome = toOutcome(fixture.score.winner);
    if (!outcome) continue;

    const { error: updErr } = await admin
      .from("matches")
      .update({
        result: outcome,
        home_score: fixture.score.fullTime.home,
        away_score: fixture.score.fullTime.away,
      })
      .eq("id", row.id);
    if (updErr) { errors.push(updErr.message); continue; }

    const { error: rpcErr } = await admin.rpc("award_match_coins", { p_match_id: row.id });
    if (rpcErr) { errors.push(rpcErr.message); continue; }

    settled++;
  }

  return NextResponse.json({ ok: true, settled, errors: errors.length ? errors : undefined });
}
