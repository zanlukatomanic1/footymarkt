import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import SignOutButton from "./SignOutButton";
import CopyEmail from "@/components/CopyEmail";
import CopyReferralLink from "@/components/CopyReferralLink";

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
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-[18px] font-bold text-[#0a0a0a]"
              style={{ background: "linear-gradient(135deg, #00ff87, #4d7cff)" }}
            >
              {(profile?.username ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="text-[16px] font-semibold text-[#e0e0e0]">
                {profile?.username ?? "—"}
              </div>
              <div className="font-mono text-[11px] text-ink-faint">{user.email}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Coins", val: (profile?.coins ?? 0).toLocaleString(), color: "#00ff87" },
              { label: "Rank", val: `#${(rankCount ?? 0) + 1}`, color: "#e0e0e0" },
              { label: "Predictions", val: (predCount ?? 0).toString(), color: "#e0e0e0" },
              { label: "Win Rate", val: `${rate}%`, color: parseFloat(rate) >= 60 ? "#00ff87" : "#888" },
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
              <div className="text-[14px] font-semibold text-[#e0e0e0]">Refer a Friend</div>
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
                <div className="font-mono text-[20px] font-bold tabular-nums text-[#e0e0e0]">
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

        <SignOutButton />

        <div className="mt-6 flex items-center gap-2">
          <span className="font-mono text-[11px] text-ink-faint">Questions?</span>
          <CopyEmail />
        </div>
      </div>
    </>
  );
}
