"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Match, Outcome } from "@/lib/types";

const RESULT_COLOR: Record<string, string> = {
  home: "#00ff87",
  draw: "#888888",
  away: "#4d7cff",
};

const RESULT_LABEL: Record<string, string> = {
  home: "Home Win",
  draw: "Draw",
  away: "Away Win",
};

export default function AdminMatchRow({ match: initMatch }: { match: Match }) {
  const router = useRouter();
  const [match, setMatch] = useState<Match>(initMatch);
  const [draft, setDraft] = useState<string>(initMatch.result ?? "");
  const [saved, setSaved] = useState(!!initMatch.result);
  const [saving, setSaving] = useState(false);
  const [hov, setHov] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isDirty = draft !== (match.result ?? "");
  const hasSaved = saved && match.result;
  const rc = match.result ? RESULT_COLOR[match.result] : "#555";

  const fmtKickoff = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const handleSave = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/admin/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, result: draft }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Failed");
      return;
    }
    setMatch((m) => ({ ...m, result: draft as Outcome }));
    setSaved(true);
    router.refresh();
  };

  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="border-b border-[#181818] transition-colors"
      style={{
        background: hasSaved
          ? "rgba(0,255,135,0.02)"
          : hov
          ? "rgba(255,255,255,0.015)"
          : "transparent",
      }}
    >
      {/* Match */}
      <td className="px-5 py-[13px]">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-[#ccc]">{match.home_team}</span>
          <span
            className="rounded-[3px] bg-element px-[5px] py-[1px] font-mono text-[10px] tracking-[0.1em] text-ink-ghost"
          >
            vs
          </span>
          <span className="text-[13.5px] font-semibold text-[#ccc]">{match.away_team}</span>
        </div>
        {err && <div className="mt-1 text-[11px] text-red-400">{err}</div>}
      </td>

      {/* Competition */}
      <td className="px-4 py-[13px]">
        <span className="font-mono text-[11px] text-ink-faint">{match.competition}</span>
      </td>

      {/* Kickoff */}
      <td className="px-4 py-[13px]">
        <span className="font-mono text-[11.5px] tabular-nums text-[#444]">
          {fmtKickoff(match.kickoff_at)}
        </span>
      </td>

      {/* Current result */}
      <td className="px-4 py-[13px] text-center">
        {match.result ? (
          <span
            className="rounded-[5px] px-[9px] py-[3px] font-mono text-[11px] font-bold tracking-[0.05em]"
            style={{
              color: rc,
              background: `${rc}12`,
              border: `1px solid ${rc}28`,
            }}
          >
            {RESULT_LABEL[match.result]}
          </span>
        ) : (
          <span className="font-mono text-[11px] text-ink-silent">—</span>
        )}
      </td>

      {/* Dropdown */}
      <td className="px-3.5 py-[13px]">
        <div className="relative">
          <select
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setSaved(false); setErr(null); }}
            className="min-w-[130px] rounded-[7px] px-[10px] py-[7px] font-mono text-[12px]"
            style={{
              background: "#111",
              border: `1px solid ${isDirty ? "#2a2a2a" : "#1a1a1a"}`,
              color: draft ? (RESULT_COLOR[draft] ?? "#888") : "#3a3a3a",
              cursor: "pointer",
            }}
          >
            <option value="" style={{ background: "#141414", color: "#555" }}>— Pending —</option>
            <option value="home" style={{ background: "#141414", color: "#00ff87" }}>Home Win</option>
            <option value="draw" style={{ background: "#141414", color: "#888" }}>Draw</option>
            <option value="away" style={{ background: "#141414", color: "#4d7cff" }}>Away Win</option>
          </select>
        </div>
      </td>

      {/* Save */}
      <td className="py-[13px] pl-[10px] pr-5">
        {hasSaved && !isDirty ? (
          <div
            className="flex items-center gap-[5px] rounded-[7px] px-3 py-[6px]"
            style={{
              background: "rgba(0,255,135,0.08)",
              border: "1px solid rgba(0,255,135,0.2)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00ff87" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="font-mono text-[11.5px] font-semibold text-brand">Saved</span>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={!draft || saving}
            className="whitespace-nowrap rounded-[7px] border-none px-4 py-[6px] text-[12.5px] font-semibold transition-all duration-150"
            style={{
              background: draft && !saving ? "#00ff87" : "#141414",
              color: draft && !saving ? "#080808" : "#2a2a2a",
              cursor: draft && !saving ? "pointer" : "default",
            }}
          >
            {saving ? "Saving…" : "Save Result"}
          </button>
        )}
      </td>
    </tr>
  );
}
