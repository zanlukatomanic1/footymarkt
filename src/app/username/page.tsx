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
      setErr("3–20 chars, lowercase letters, numbers, underscore.");
      return;
    }
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await supabase
      .from("users")
      .update({ username: clean })
      .eq("id", user.id);
    if (error) {
      setErr(error.message.includes("unique") ? "Username taken." : error.message);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="mt-16">
      <h1 className="text-xl font-semibold">Pick a username</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Shown on leaderboards. You can't change it later.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. midfield_maestro"
          className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 outline-none focus:border-brand"
        />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-brand py-3 font-medium text-bg disabled:opacity-50"
        >
          {busy ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
