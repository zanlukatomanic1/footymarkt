import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LeagueActions from "./LeagueActions";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, invite_code)")
    .eq("user_id", user.id);

  const leagues =
    (memberships ?? [])
      .map((m: any) => m.leagues)
      .filter(Boolean) as { id: string; name: string; invite_code: string }[];

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight">Leagues</h1>
        <p className="text-xs text-ink-muted">
          Compete with friends. Private leaderboards.
        </p>
      </div>

      <LeagueActions />

      <div className="space-y-2">
        {leagues.length === 0 && (
          <div className="rounded-2xl border border-border bg-bg-card p-6 text-center text-sm text-ink-muted">
            You're not in any leagues yet.
          </div>
        )}
        {leagues.map((l) => (
          <Link
            key={l.id}
            href={`/leagues/${l.id}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-bg-card p-4 shadow-card hover:border-border-strong"
          >
            <div>
              <div className="font-medium">{l.name}</div>
              <div className="text-xs text-ink-muted">
                Code: <span className="font-mono text-ink">{l.invite_code}</span>
              </div>
            </div>
            <span className="text-ink-muted">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
