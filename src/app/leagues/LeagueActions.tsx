"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function randomCode(name: string) {
  const prefix = "FM-" + name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

function CopyIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const invite = randomCode(name.trim());
    const { data: league, error } = await supabase
      .from("leagues")
      .insert({ name: name.trim(), invite_code: invite, created_by: user.id })
      .select().single();

    if (error || !league) { setErr(error?.message ?? "Failed"); setBusy(false); return; }
    await supabase.from("league_members").insert({ league_id: league.id, user_id: user.id });
    setCode(invite);
    setCreated(true);
    setBusy(false);
    router.refresh();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-[400px] rounded-[16px] border border-line-strong bg-card p-7 pb-6">
        <div className="mb-[22px] flex items-center justify-between">
          <div>
            <div className="text-[16px] font-bold text-[#e0e0e0]">Create a League</div>
            <div className="mt-[3px] font-mono text-[11px] text-ink-faint">Invite friends with a code</div>
          </div>
          <button onClick={onClose} className="flex p-1 text-ink-faint hover:text-ink transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {!created ? (
          <>
            <label className="mb-[7px] block font-mono text-[11px] uppercase tracking-[0.09em] text-ink-faint">
              League name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Office WC 2026"
              className="mb-4 w-full rounded-[8px] border border-line-strong bg-topbar px-[14px] py-[10px] text-[13.5px] text-[#e0e0e0] font-sans"
            />
            {err && <p className="mb-3 text-xs text-red-400">{err}</p>}
            <button
              onClick={handleCreate}
              disabled={busy || !name.trim()}
              className="w-full rounded-[8px] border-none py-[11px] text-[13.5px] font-semibold transition-all duration-150"
              style={{
                background: name.trim() && !busy ? "#00ff87" : "#1a1a1a",
                color: name.trim() && !busy ? "#080808" : "#2a2a2a",
                cursor: name.trim() && !busy ? "pointer" : "default",
              }}
            >
              {busy ? "Creating…" : "Create League"}
            </button>
          </>
        ) : (
          <div>
            <div
              className="mb-4 rounded-[10px] p-[18px]"
              style={{
                background: "rgba(0,255,135,0.06)",
                border: "1px solid rgba(0,255,135,0.2)",
              }}
            >
              <div className="mb-2 flex items-center gap-[6px] font-mono text-[11px] uppercase tracking-[0.09em] text-brand">
                <CheckIcon /> League created!
              </div>
              <div className="mb-3 text-[15px] font-semibold text-[#e0e0e0]">{name}</div>
              <div className="mb-2 font-mono text-[11px] text-ink-faint">Invite code</div>
              <div className="flex items-center gap-[10px] rounded-[8px] border border-line-strong bg-[#0f0f0f] px-[14px] py-[10px]">
                <code className="flex-1 font-mono text-[16px] tracking-[0.08em] text-brand font-medium">
                  {code}
                </code>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 font-mono text-[11px] transition-colors"
                  style={{ color: copied ? "#00ff87" : "#555" }}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-[8px] border border-[#222] bg-element py-[10px] text-[13px] font-medium text-ink-muted"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LeagueActions() {
  const router = useRouter();
  const supabase = createClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleJoin = async () => {
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;
    setBusy(true);
    setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: league } = await supabase
      .from("leagues").select("id").eq("invite_code", clean).maybeSingle();
    if (!league) { setErr("No league with that code."); setBusy(false); return; }

    const { error } = await supabase
      .from("league_members").insert({ league_id: league.id, user_id: user.id });
    if (error && !error.message.includes("duplicate")) {
      setErr(error.message); setBusy(false); return;
    }
    router.push(`/leagues/${league.id}`);
    router.refresh();
  };

  return (
    <>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      <div className="mb-6 flex flex-wrap items-center gap-[10px]">
        <button
          onClick={() => { setShowCreate(true); setShowJoin(false); }}
          className="flex items-center gap-[7px] rounded-[8px] bg-brand px-4 py-[9px] text-[13px] font-semibold text-[#080808]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create League
        </button>
        <button
          onClick={() => setShowJoin((v) => !v)}
          className="flex items-center gap-[7px] rounded-[8px] border border-[#222] bg-transparent px-4 py-[9px] text-[13px] font-medium text-ink-muted hover:text-ink transition-colors"
        >
          Join League
        </button>

        {showJoin && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Enter invite code…"
              className="w-[200px] rounded-[8px] border border-line-strong bg-card px-[14px] py-[9px] font-mono text-[13px] text-[#e0e0e0]"
            />
            <button
              onClick={handleJoin}
              disabled={busy || !joinCode.trim()}
              className="rounded-[8px] border-none px-4 py-[9px] text-[13px] font-semibold transition-all"
              style={{
                background: joinCode.trim() && !busy ? "#00ff87" : "#1a1a1a",
                color: joinCode.trim() && !busy ? "#080808" : "#2a2a2a",
              }}
            >
              {busy ? "Joining…" : "Join →"}
            </button>
          </div>
        )}
      </div>
      {err && <p className="mb-4 text-xs text-red-400">{err}</p>}
    </>
  );
}
