import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchWCMatches, toOutcome } from "@/lib/footballdata";
import { requireAdminOrCron } from "@/lib/authz";

async function handler(req: Request) {
  const authz = await requireAdminOrCron(req);
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: authz.status });

  // Load unsettled matches that have an external_id
  const admin = createAdminClient();
  const { data: unsettled, error: fetchErr } = await admin
    .from("matches")
    .select("id, external_id")
    .is("result", null)
    .not("external_id", "is", null);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!unsettled?.length) return NextResponse.json({ ok: true, settled: 0, via: authz.via });

  let apiMatches;
  try {
    apiMatches = await fetchWCMatches();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

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

  return NextResponse.json({ ok: true, settled, via: authz.via, errors: errors.length ? errors : undefined });
}

// Admin UI clicks + Netlify scheduled function both POST here
// (the Netlify function in netlify/functions/sync-results.mts sends a Bearer token).
export const POST = handler;
