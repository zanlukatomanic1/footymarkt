import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/TopBar";
import AdminMatchRow from "./AdminMatchRow";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

function isAdminEmail(email: string | undefined) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .includes(email.toLowerCase());
}

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users").select("is_admin").eq("id", user.id).single();

  const allowed = profile?.is_admin || isAdminEmail(user.email);
  if (!allowed) {
    return (
      <>
        <TopBar title="Admin" subtitle="Not authorised" />
        <div className="flex h-64 items-center justify-center">
          <span className="font-mono text-[11px] text-ink-faint">
            You don't have admin access.
          </span>
        </div>
      </>
    );
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  const list = (matches as Match[] | null) ?? [];
  const settled = list.filter((m) => m.result !== null).length;
  const pending = list.filter((m) => m.result === null).length;

  const { count: predCount } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true });

  return (
    <>
      <TopBar title="Match Results" subtitle="Admin · WC 2026" />
      <div className="p-[22px] md:p-6">
        {/* Stats strip */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Total Matches", val: list.length.toString(), color: "#cccccc" },
            { label: "Settled", val: settled.toString(), color: "#00ff87" },
            { label: "Pending", val: pending.toString(), color: "#888888" },
            { label: "Predictions", val: (predCount ?? 0).toLocaleString(), color: "#4d7cff" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-[10px] border border-line bg-card px-4 py-[14px]"
            >
              <div className="mb-[6px] font-mono text-[10px] uppercase tracking-[0.1em] text-ink-ghost">
                {s.label}
              </div>
              <div
                className="font-mono text-[26px] font-bold leading-none tabular-nums"
                style={{ color: s.color }}
              >
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[12px] border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line-subtle px-5 py-3.5">
            <span className="text-[12px] font-semibold text-[#bbb]">Matches</span>
            <div className="flex items-center gap-2">
              <div className="h-[7px] w-[7px] rounded-full bg-brand" />
              <span className="font-mono text-[10.5px] text-ink-faint">
                {settled} settled · {pending} pending
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line-subtle">
                  {["Match", "Competition", "Kickoff", "Current Result", "Set Result", "Action"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-ghost"
                        style={{
                          padding: `11px ${i === 5 ? "20px" : "16px"} 11px ${i === 0 ? "20px" : "16px"}`,
                          textAlign: i >= 3 ? "center" : "left",
                          fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <AdminMatchRow key={m.id} match={m} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <div className="h-[6px] w-[6px] rounded-full bg-[#2a2a2a]" />
          <span className="font-mono text-[11px] text-ink-silent">
            Settling a result triggers coin payouts for all correct predictions in that match.
          </span>
        </div>
      </div>
    </>
  );
}
