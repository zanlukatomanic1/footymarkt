import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import SignOutButton from "./SignOutButton";
import CopyEmail from "@/components/CopyEmail";
import CopyReferralLink from "@/components/CopyReferralLink";
import Link from "next/link";
import { TEAM } from "@/lib/teamData";
import { fmtKickoff } from "@/lib/dates";
import type { Outcome } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("username, coins, is_admin, referral_code")
    .eq("id", user.id)
    .single();

  const [
    { count: predCount },
    { count: correctCount },
    { count: rankCount },
    { count: totalReferrals },
    { count: paidReferrals },
  ] = await Promise.all([
    supabase.from("predictions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("predictions").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("was_correct", true),
    supabase.from("users").select("*", { count: "exact", head: true }).gt("coins", profile?.coins ?? 0),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("referred_by", user.id),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("referred_by", user.id).eq("referral_bonus_paid", true),
  ]);

  const { data: betsRaw } = await supabase
    .from("predictions")
    .select("id, match_id, prediction, bet_amount, coins_earned, was_correct, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const matchIds = (betsRaw ?? []).map((b) => b.match_id);
  const { data: matchRows } = matchIds.length
    ? await supabase
        .from("matches")
        .select("id, home_team, away_team, kickoff_at, result")
        .in("id", matchIds)
    : { data: [] as Array<{ id: string; home_team: string; away_team: string; kickoff_at: string; result: Outcome | null }> };

  const matchMap = new Map((matchRows ?? []).map((m) => [m.id, m]));

  type Row = {
    id: string;
    match_id: string;
    prediction: Outcome;
    bet_amount: number;
    coins_earned: number;
    was_correct: boolean | null;
    created_at: string;
    match: NonNullable<ReturnType<typeof matchMap.get>>;
  };
  const rows: Row[] = ((betsRaw ?? [])
    .map((b) => {
      const m = matchMap.get(b.match_id);
      return m ? { ...b, match: m } as Row : null;
    })
    .filter(Boolean)) as Row[];
  const openBets = rows.filter((r) => r.match.result === null);
  const settledBets = rows.filter((r) => r.match.result !== null);

  const pickLabel = (r: Row): string => {
    const m = r.match;
    if (r.prediction === "home") return m.home_team;
    if (r.prediction === "away") return m.away_team;
    return "Draw";
  };

  const pickColor = (p: Outcome): string =>
    p === "home" ? "var(--pick-home-color)" : p === "away" ? "var(--pick-away-color)" : "var(--pick-draw-color)";

  const rate =
    predCount && predCount > 0
      ? (((correctCount ?? 0) / predCount) * 100).toFixed(1)
      : "0.0";

  return (
    <>
      <TopBar title="Profile" subtitle={user.email ?? ""} />
      <div className="p-[22px] md:p-6 max-w-lg">
        {/* Profile card */}
        <div className="mb-4 rounded-[14px] border border-line bg-card p-6">
          <div className="mb-5 flex items-center gap-4">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-[18px] font-bold"
              style={{ background: "var(--lb-me-avatar)", color: "var(--lb-me-avatar-tx)" }}
            >
              {(profile?.username ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="text-[16px] font-semibold text-ink">
                {profile?.username ?? "—"}
              </div>
              <div className="font-mono text-[11px] text-ink-faint">{user.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Coins",       val: (profile?.coins ?? 0).toLocaleString(), color: "var(--color-brand)" },
              { label: "Rank",        val: `#${(rankCount ?? 0) + 1}`,             color: "var(--color-ink)"   },
              { label: "Predictions", val: (predCount ?? 0).toString(),            color: "var(--color-ink)"   },
              { label: "Win Rate",    val: `${rate}%`, color: parseFloat(rate) >= 60 ? "var(--color-brand)" : "var(--lb-rate-low)" },
            ].map((s) => (
              <div key={s.label} className="rounded-[10px] border border-line bg-element px-3.5 py-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.09em] text-ink-faint">
                  {s.label}
                </div>
                <div
                  className="font-mono text-[20px] font-bold tabular-nums"
                  style={{ color: s.color }}
                >
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Referral card */}
        {profile?.referral_code && (
          <div className="mb-4 rounded-[14px] border border-line bg-card p-6">
            <div className="mb-4">
              <div className="text-[14px] font-semibold text-ink">Refer a Friend</div>
              <p className="mt-1 font-mono text-[11px] text-ink-faint">
                Earn 100 coins for every friend who signs up and makes 3 predictions. Max 50 referrals.
              </p>
            </div>

            <CopyReferralLink referralCode={profile.referral_code} />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[10px] border border-line bg-element px-3.5 py-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.09em] text-ink-faint">
                  Friends joined
                </div>
                <div className="font-mono text-[20px] font-bold tabular-nums text-ink">
                  {totalReferrals ?? 0}
                </div>
              </div>
              <div className="rounded-[10px] border border-line bg-element px-3.5 py-3">
                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.09em] text-ink-faint">
                  Bonuses earned
                </div>
                <div className="font-mono text-[20px] font-bold tabular-nums text-brand">
                  {((paidReferrals ?? 0) * 100).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Open bets */}
        <div className="mb-4 rounded-[14px] border border-line bg-card p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="text-[14px] font-semibold text-ink">Open Bets</div>
            <div className="font-mono text-[11px] text-ink-faint">{openBets.length}</div>
          </div>
          {openBets.length === 0 ? (
            <div className="font-mono text-[11px] text-ink-faint">No open bets.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {openBets.map((r) => {
                const m = r.match;
                return (
                  <Link
                    key={r.id}
                    href={`/match/${m.id}`}
                    className="flex items-center justify-between rounded-[10px] border border-line bg-element px-3.5 py-3 hover:border-line-strong"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-ink">
                        {TEAM[m.home_team]?.code ?? m.home_team} vs {TEAM[m.away_team]?.code ?? m.away_team}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-ink-faint">
                        {fmtKickoff(m.kickoff_at)}
                      </div>
                    </div>
                    <div className="ml-3 flex flex-col items-end">
                      <div className="font-mono text-[11px] font-semibold uppercase" style={{ color: pickColor(r.prediction) }}>
                        {pickLabel(r)}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-ink-faint">
                        {r.bet_amount} coins
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bet history */}
        <div className="mb-4 rounded-[14px] border border-line bg-card p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="text-[14px] font-semibold text-ink">Bet History</div>
            <div className="font-mono text-[11px] text-ink-faint">{settledBets.length}</div>
          </div>
          {settledBets.length === 0 ? (
            <div className="font-mono text-[11px] text-ink-faint">No settled bets yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {settledBets.map((r) => {
                const m = r.match;
                const won = r.was_correct === true;
                const net = won ? r.coins_earned : -r.bet_amount;
                return (
                  <Link
                    key={r.id}
                    href={`/match/${m.id}`}
                    className="flex items-center justify-between rounded-[10px] border border-line bg-element px-3.5 py-3 hover:border-line-strong"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-ink">
                        {TEAM[m.home_team]?.code ?? m.home_team} vs {TEAM[m.away_team]?.code ?? m.away_team}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-ink-faint">
                        Pick: <span style={{ color: pickColor(r.prediction) }}>{pickLabel(r)}</span>
                      </div>
                    </div>
                    <div className="ml-3 flex flex-col items-end">
                      <div
                        className="font-mono text-[12px] font-bold tabular-nums"
                        style={{ color: won ? "var(--color-brand)" : "var(--lb-rate-low)" }}
                      >
                        {won ? "+" : ""}{net}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                        {won ? "Won" : "Lost"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <SignOutButton />

        <div className="mt-6 flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-faint">Questions?</span>
          <CopyEmail />
        </div>
      </div>
    </>
  );
}
