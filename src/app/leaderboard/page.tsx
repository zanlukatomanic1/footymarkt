import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Leaderboard() {
  const supabase = createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, username, coins")
    .not("username", "is", null)
    .order("coins", { ascending: false })
    .limit(100);

  // Pull all correct prediction counts in one go.
  const { data: correct } = await supabase
    .from("predictions")
    .select("user_id, was_correct")
    .eq("was_correct", true);

  const correctMap = new Map<string, number>();
  (correct ?? []).forEach((p) => {
    correctMap.set(p.user_id, (correctMap.get(p.user_id) ?? 0) + 1);
  });

  return (
    <div className="space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-xs text-ink-muted">Global · all-time</p>
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
            {(users ?? []).map((u, i) => (
              <tr
                key={u.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 text-ink-muted tabular-nums">
                  {i + 1}
                </td>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                  {correctMap.get(u.id) ?? 0}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className="text-brand">●</span> {u.coins}
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                  No predictions resolved yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
