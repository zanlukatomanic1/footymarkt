"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UsernamePage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const clean = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setErr("3–20 chars. Lowercase letters, numbers, underscore only.");
      return;
    }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase
      .from("users").update({ username: clean }).eq("id", user.id);
    if (error) {
      setErr(error.message.includes("unique") ? "Username taken — try another." : error.message);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="font-display text-[20px] font-bold text-white">Pick a username</div>
          <p className="mt-1.5 font-mono text-[11px] text-ink-faint">
            Shown on leaderboards. Can't be changed later.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-[14px] border border-line bg-card p-6 space-y-4">
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. midfield_maestro"
            className="w-full rounded-[8px] border border-line-strong bg-topbar px-[14px] py-[10px] font-sans text-[13.5px] text-[#e0e0e0]"
          />
          {err && <p className="text-[12px] text-red-400">{err}</p>}
          <button
            disabled={busy}
            className="w-full rounded-[8px] py-[11px] text-[13.5px] font-semibold transition-all disabled:opacity-50"
            style={{
              background: username.trim() && !busy ? "#00ff87" : "#1a1a1a",
              color: username.trim() && !busy ? "#080808" : "#2a2a2a",
            }}
          >
            {busy ? "Saving…" : "Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}
