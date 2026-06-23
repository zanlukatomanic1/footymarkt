import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import { fetchWCMatches } from "@/lib/footballdata";
import { requireAdminOrCron } from "@/lib/authz";

async function handler(req: Request) {
  const authz = await requireAdminOrCron(req);
  if (!authz.ok) return NextResponse.json({ error: authz.error }, { status: authz.status });

  let matches;
  try {
    matches = await fetchWCMatches();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const rows = matches
    .filter((m) => m.status !== "CANCELLED" && m.status !== "POSTPONED")
    .map((m) => ({
      external_id: m.id,
      home_team: m.homeTeam.shortName || m.homeTeam.name,
      away_team: m.awayTeam.shortName || m.awayTeam.name,
      kickoff_at: m.utcDate,
      competition: "WC2026",
      venue: m.venue ?? null,
    }));

  const admin = createAdminClient();
  const { error } = await admin
    .from("matches")
    .upsert(rows, { onConflict: "home_team,away_team,kickoff_at", ignoreDuplicates: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag(CACHE_TAGS.matches);

  return NextResponse.json({ ok: true, upserted: rows.length, via: authz.via });
}

// Admin UI clicks + Netlify scheduled function both POST here
// (the Netlify function in netlify/functions/sync-fixtures.mts sends a Bearer token).
export const POST = handler;
