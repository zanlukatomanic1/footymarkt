import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LeaguePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: league } = await supabase
    .from("leagues")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!league) notFound();

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, users(id, username, coins)")
    .eq("league_id", params.id);

  const rows = (members ?? [])
    .map((m: any) => m.users)
    .filter(Boolean) as { id: string; username: string | null; coins: number }[];

  // Correct-prediction counts for these members only.
  const ids = rows.map((r) => r.id);
  const { data: correct } = ids.length
    ? await supabase
        .from("predictions")
        .select("user_id, was_correct")
        .eq("was_correct", true)
        .in("user_id", ids)
    : { data: [] as { user_id: string }[] };

  const correctMap = new Map<string, number>();
  (correct ?? []).forEach((p: any) => {
    correctMap.set(p.user_id, (correctMap.get(p.user_id) ?? 0) + 1);
  });

  rows.sort((a, b) => b.coins - a.coins);

  return (
    <div className="space-y-5">
      <Link href="/leagues" className="text-xs text-ink-muted hover:text-ink">
        ← All leagues
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">{league.name}</h1>
        <p className="text-xs text-ink-muted">
          Invite code:{" "}
          <span className="font-mono text-ink">{league.invite_code}</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-card shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 text-right">Correct</th>
              <th className="px-4 py-3 text-right">Coins</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-ink-muted tabular-nums">
                  {i + 1}
                </td>
                <td className="px-4 py-3 font-medium">
                  {u.username ?? "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                  {correctMap.get(u.id) ?? 0}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className="text-brand">●</span> {u.coins}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
