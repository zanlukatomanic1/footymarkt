"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function randomCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function LeagueActions() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    setErr(null);
    if (!name.trim()) return setErr("Name required.");
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const invite = randomCode();
    const { data: league, error } = await supabase
      .from("leagues")
      .insert({ name: name.trim(), invite_code: invite, created_by: user.id })
      .select()
      .single();
    if (error || !league) {
      setErr(error?.message ?? "Failed");
      setBusy(false);
      return;
    }
    await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: user.id });
    router.push(`/leagues/${league.id}`);
    router.refresh();
  };

  const join = async () => {
    setErr(null);
    const clean = code.trim().toUpperCase();
    if (!clean) return setErr("Code required.");
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    const { data: league } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", clean)
      .maybeSingle();
    if (!league) {
      setErr("No league with that code.");
      setBusy(false);
      return;
    }
    const { error } = await supabase
      .from("league_members")
      .insert({ league_id: league.id, user_id: user.id });
    if (error && !error.message.includes("duplicate")) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    router.push(`/leagues/${league.id}`);
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-border bg-bg-card p-4 shadow-card">
      <div className="mb-3 inline-flex rounded-full border border-border p-1 text-xs">
        <button
          onClick={() => setMode("create")}
          className={
            "rounded-full px-3 py-1 " +
            (mode === "create" ? "bg-brand text-bg" : "text-ink-muted")
          }
        >
          Create
        </button>
        <button
          onClick={() => setMode("join")}
          className={
            "rounded-full px-3 py-1 " +
            (mode === "join" ? "bg-brand text-bg" : "text-ink-muted")
          }
        >
          Join
        </button>
      </div>

      {mode === "create" ? (
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="League name"
            className="flex-1 rounded-xl border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={create}
            disabled={busy}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
          >
            Create
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Invite code"
            className="flex-1 rounded-xl border border-border bg-bg-elevated px-3 py-2 font-mono text-sm uppercase outline-none focus:border-brand"
          />
          <button
            onClick={join}
            disabled={busy}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
          >
            Join
          </button>
        </div>
      )}
      {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
    </div>
  );
}
