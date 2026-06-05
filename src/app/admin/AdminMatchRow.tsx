"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fmtKickoff } from "@/lib/dates";
import type { Match, Outcome } from "@/lib/types";

const RESULT_COLOR: Record<string, string> = {
  home: "var(--pick-home-color)",
  draw: "var(--pick-draw-color)",
  away: "var(--pick-away-color)",
};
const RESULT_RGB: Record<string, string> = {
  home: "var(--pick-home-rgb)",
  draw: "var(--pick-draw-rgb)",
  away: "var(--pick-away-rgb)",
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
  const rc = match.result ? RESULT_COLOR[match.result] : "var(--color-ink-faint)";
  const rcRgb = match.result ? RESULT_RGB[match.result] : "var(--pick-draw-rgb)";

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
      className="border-b border-line transition-colors"
      style={{
        background: hasSaved
          ? "var(--lb-me-bg)"
          : hov
          ? "var(--color-element)"
          : "transparent",
      }}
    >
      {/* Match */}
      <td className="px-5 py-[13px]">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-ink">{match.home_team}</span>
          <span
            className="rounded-[3px] bg-element px-[5px] py-[1px] font-mono text-[10px] tracking-[0.1em] text-ink-ghost"
          >
            vs
          </span>
          <span className="text-[13.5px] font-semibold text-ink">{match.away_team}</span>
        </div>
        {err && <div className="mt-1 text-[11px] text-red-400">{err}</div>}
      </td>

      {/* Competition */}
      <td className="px-4 py-[13px]">
        <span className="font-mono text-[11px] text-ink-faint">{match.competition}</span>
      </td>

      {/* Kickoff */}
      <td className="px-4 py-[13px]">
        <span className="font-mono text-[11.5px] tabular-nums text-ink-dim">
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
              background: `rgba(${rcRgb}, 0.09)`,
              border: `1px solid rgba(${rcRgb}, 0.22)`,
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
              background: "var(--color-card)",
              border: `1px solid ${isDirty ? "var(--color-line-strong)" : "var(--color-line)"}`,
              color: draft ? (RESULT_COLOR[draft] ?? "var(--color-ink-faint)") : "var(--color-ink-faint)",
              cursor: "pointer",
            }}
          >
            <option value="">— Pending —</option>
            <option value="home">Home Win</option>
            <option value="draw">Draw</option>
            <option value="away">Away Win</option>
          </select>
        </div>
      </td>

      {/* Save */}
      <td className="py-[13px] pl-[10px] pr-5">
        {hasSaved && !isDirty ? (
          <div
            className="flex items-center gap-[5px] rounded-[7px] px-3 py-[6px]"
            style={{
              background: "var(--lb-me-bg)",
              border: "1px solid var(--lb-me-border)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: "var(--color-brand)" }}><polyline points="20 6 9 17 4 12"/></svg>
            <span className="font-mono text-[11.5px] font-semibold text-brand">Saved</span>
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={!draft || saving}
            className="whitespace-nowrap rounded-[7px] border-none px-4 py-[6px] text-[12.5px] font-semibold transition-all duration-150"
            style={{
              background: draft && !saving ? "var(--color-brand)" : "var(--color-element)",
              color: draft && !saving ? "var(--chip-active-text)" : "var(--color-ink-ghost)",
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
