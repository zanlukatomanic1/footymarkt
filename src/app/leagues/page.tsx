import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import LeagueActions from "./LeagueActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Leagues",
  description: "Compete with friends in private WC 2026 prediction leagues on FootyMarkt.",
};

const RANK_COLOR: Record<number, string> = {
  1: "#FFD700",
  2: "#a8a8a8",
  3: "#cd8a3a",
};

export default async function LeaguesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, invite_code)")
    .eq("user_id", user.id);

  // For each league, get member count and the user's rank within it
  const leagues = await Promise.all(
    ((memberships ?? []) as any[])
      .map((m) => m.leagues)
      .filter(Boolean)
      .map(async (l: { id: string; name: string; invite_code: string }) => {
        const { count: memberCount } = await supabase
          .from("league_members")
          .select("*", { count: "exact", head: true })
          .eq("league_id", l.id);

        const { data: memberUsers } = await supabase
          .from("league_members")
          .select("user_id, users(id, username, coins)")
          .eq("league_id", l.id);

        const sorted = ((memberUsers ?? []) as any[])
          .map((m) => m.users)
          .filter(Boolean)
          .sort((a: any, b: any) => b.coins - a.coins);

        const myRank = sorted.findIndex((u: any) => u.id === user.id) + 1;
        const leader = sorted[0];

        return {
          id: l.id,
          name: l.name,
          invite_code: l.invite_code,
          members: memberCount ?? 0,
          myRank: myRank || 1,
          leader: leader?.username ?? "—",
          leaderIsMe: leader?.id === user.id,
          leaderCoins: leader?.coins ?? 0,
        };
      })
  );

  return (
    <>
      <TopBar
        title="My Leagues"
        subtitle={`${leagues.length} league${leagues.length !== 1 ? "s" : ""}`}
      />
      <div className="p-[22px] md:p-6">
        <LeagueActions />

        {/* Divider */}
        <div className="mb-3.5 flex items-center gap-3">
          <span className="whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
            My Leagues · {leagues.length} active
          </span>
          <div className="h-px flex-1 bg-line-subtle" />
        </div>

        {leagues.length === 0 && (
          <div className="rounded-[12px] border border-dashed border-line-subtle bg-[#0d0d0d] py-12 text-center">
            <span className="font-mono text-[11px] text-ink-silent">
              You're not in any leagues yet.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map((l) => {
            const rankColor = RANK_COLOR[l.myRank] ?? (l.myRank === 1 ? "#00ff87" : "#555");
            return (
              <div
                key={l.id}
                className="flex flex-col gap-3.5 rounded-[12px] border border-line bg-card p-5 transition-all duration-150 hover:border-line-strong hover:bg-[#171717]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-1 text-[14.5px] font-bold tracking-[-0.2px] text-[#e0e0e0]">
                      {l.name}
                    </div>
                    <div className="font-mono text-[11px] text-ink-faint">
                      {l.members} members
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className="font-mono text-[22px] font-bold leading-none tabular-nums"
                      style={{ color: rankColor }}
                    >
                      #{l.myRank}
                    </div>
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-silent">
                      your rank
                    </div>
                  </div>
                </div>

                <div className="h-px bg-line-subtle" />

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-ink-faint">
                    Leader:{" "}
                    <span style={{ color: l.leaderIsMe ? "#00ff87" : "#555" }}>
                      {l.leaderIsMe ? "you" : l.leader}
                    </span>
                  </div>
                  <div className="flex items-center gap-[5px]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00ff87" strokeWidth="2.2" strokeLinecap="round" className="opacity-60">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1 2-2.5 2.5-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.9 2.5-2" />
                      <path d="M12 7v1M12 16v1" />
                    </svg>
                    <span className="font-mono text-[12px] tabular-nums text-ink-muted">
                      {l.leaderCoins.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/leagues/${l.id}`}
                  className="flex w-full items-center justify-center gap-[6px] rounded-[8px] border border-line py-2 text-[12px] font-medium text-ink-faint transition-all duration-150 hover:border-line-strong hover:text-ink"
                >
                  View League
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
