import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminMatchRow from "./AdminMatchRow";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

function isAdminEmail(email: string | undefined) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const allowed = profile?.is_admin || isAdminEmail(user.email);
  if (!allowed) {
    return (
      <div className="mt-16 text-center text-ink-muted">
        Not authorised.
      </div>
    );
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <p className="text-xs text-ink-muted">
          Set match results — coins are distributed instantly.
        </p>
      </div>

      <div className="space-y-2">
        {(matches as Match[] | null)?.map((m) => (
          <AdminMatchRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}
