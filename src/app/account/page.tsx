import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("username, coins, is_admin")
    .eq("id", user.id)
    .single();

  const { count: predCount } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight">Account</h1>
        <p className="text-xs text-ink-muted">{user.email}</p>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-5 shadow-card">
        <div className="text-xs text-ink-muted">Username</div>
        <div className="text-lg font-medium">{profile?.username ?? "—"}</div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border bg-bg-elevated p-3">
            <div className="text-xs text-ink-muted">Coins</div>
            <div className="text-lg font-semibold tabular-nums">
              <span className="text-brand">●</span> {profile?.coins ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-bg-elevated p-3">
            <div className="text-xs text-ink-muted">Predictions</div>
            <div className="text-lg font-semibold tabular-nums">
              {predCount ?? 0}
            </div>
          </div>
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
