"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function UsernameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [refCode, setRefCode] = useState(searchParams.get("ref") ?? "");
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

    // Resolve referral code to a user ID
    let referredBy: string | null = null;
    const trimmedRef = refCode.trim();
    if (trimmedRef) {
      const { data: referrer } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", trimmedRef)
        .neq("id", user.id)
        .single();
      if (referrer) {
        referredBy = referrer.id;
      } else {
        setErr("Referral code not found — double-check and try again.");
        setBusy(false);
        return;
      }
    }

    const updatePayload: Record<string, unknown> = { username: clean };
    if (referredBy) updatePayload.referred_by = referredBy;

    const { error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", user.id);

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
          <p className="mt-1.5 font-mono text-[11px] text-[#888888]">
            Shown on leaderboards. Can&apos;t be changed later.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-[14px] border border-line bg-card p-6 space-y-4">
          <div>
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. midfield_maestro"
              className="w-full rounded-[8px] border border-[#3a3a3a] bg-topbar px-[14px] py-[10px] font-sans text-[13.5px] text-[#e0e0e0] placeholder:text-[#555555]"
            />
          </div>

          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.09em] text-[#888888]">
              Referral code <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="e.g. a1b2c3d4"
              className="w-full rounded-[8px] border border-[#3a3a3a] bg-topbar px-[14px] py-[10px] font-mono text-[13px] text-[#e0e0e0] placeholder:text-[#555555]"
            />
          </div>

          {err && <p className="text-[12px] text-red-400">{err}</p>}

          <button
            disabled={busy}
            className="w-full rounded-[8px] py-[11px] text-[13.5px] font-semibold transition-all disabled:opacity-50"
            style={{
              background: username.trim() && !busy ? "#00ff87" : "#222222",
              color: username.trim() && !busy ? "#080808" : "#888888",
            }}
          >
            {busy ? "Saving…" : "Continue →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UsernamePage() {
  return (
    <Suspense>
      <UsernameForm />
    </Suspense>
  );
}
