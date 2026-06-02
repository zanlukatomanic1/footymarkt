import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { fetchWCMatches } from "@/lib/footballdata";

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
    }));

  const admin = createAdminClient();
  const { error, count } = await admin
    .from("matches")
    .upsert(rows, { onConflict: "external_id", ignoreDuplicates: false })
    .select("id", { count: "exact", head: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, upserted: count ?? rows.length });
}
