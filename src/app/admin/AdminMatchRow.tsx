"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Match, Outcome } from "@/lib/types";

export default function AdminMatchRow({ match }: { match: Match }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = async (result: Outcome) => {
    setErr(null);
    setBusy(true);
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, result }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Failed");
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-4 shadow-card">
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{new Date(match.kickoff_at).toLocaleString()}</span>
        <span>{match.competition}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <div className="font-medium">{match.home_team}</div>
        <div className="text-xs text-ink-dim">vs</div>
        <div className="font-medium">{match.away_team}</div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["home", "draw", "away"] as Outcome[]).map((o) => {
          const picked = match.result === o;
          return (
            <button
              key={o}
              disabled={busy}
              onClick={() => set(o)}
              className={
                "rounded-xl border px-3 py-2 text-sm capitalize " +
                (picked
                  ? "border-brand bg-brand text-bg"
                  : "border-border bg-bg-elevated hover:border-border-strong")
              }
            >
              {o}
            </button>
          );
        })}
      </div>
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}
