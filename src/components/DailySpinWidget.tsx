"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function useCountdown(target: string, active: boolean) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!active) return;
    const end = new Date(target).getTime();
    function tick() {
      const diff = end - Date.now();
      if (diff <= 0) { setTimeLeft("00:00:00"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target, active]);
  return timeLeft;
}

function getNextMidnightUTC() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

type Props = {
  spinAvailable: boolean;
  signedIn: boolean;
  compact?: boolean;
};

export default function DailySpinWidget({ spinAvailable, signedIn, compact = false }: Props) {
  const router = useRouter();

  const [hasClaimed, setHasClaimed] = useState(!spinAvailable);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const nextSpinAt = getNextMidnightUTC();
  const countdown = useCountdown(nextSpinAt, hasClaimed);

  async function handleClaim() {
    if (hasClaimed || loading || !signedIn) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/spin", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error === "already_spun_today" ? "Already claimed today!" : "Something went wrong.");
        setLoading(false);
        return;
      }
      setHasClaimed(true);
      router.refresh();
    } catch {
      setErr("Network error. Try again.");
    }
    setLoading(false);
  }

  /* ── Compact strip (mobile) ─────────────────────────── */
  if (compact) {
    if (!signedIn) return null;
    return (
      <button
        onClick={hasClaimed ? undefined : handleClaim}
        disabled={hasClaimed || loading}
        className="flex w-full items-center justify-between px-4 py-[9px] transition-colors"
        style={{
          borderBottom: "1px solid var(--sidebar-divider)",
          background: hasClaimed ? "transparent" : "var(--nav-active-bg)",
          cursor: hasClaimed || loading ? "default" : "pointer",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-[7px] w-[7px] flex-shrink-0">
            {!hasClaimed && (
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "var(--nav-active-color)" }} />
            )}
            <span
              className="relative inline-flex h-[7px] w-[7px] rounded-full"
              style={{ background: hasClaimed ? "var(--dot-inactive)" : "var(--nav-active-color)" }}
            />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: hasClaimed ? "var(--countdown-color)" : "var(--nav-active-color)" }}>
            {loading ? "Claiming…" : "Daily Coins"}
          </span>
        </div>
        {hasClaimed ? (
          <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--countdown-color)" }}>
            {countdown || "—"}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-ink-faint">
            {loading ? "…" : "Claim 100 →"}
          </span>
        )}
      </button>
    );
  }

  /* ── Sidebar card ───────────────────────────────────── */
  return (
    <div
      className="mx-[10px] mb-[6px] rounded-[10px] px-[12px] py-[10px]"
      style={{ border: "1px solid var(--widget-border)", background: "var(--widget-bg)" }}
    >
      <div className="mb-[8px] flex items-center gap-[6px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/spinTheWheelAsset.png"
          alt=""
          width={11}
          height={11}
          style={{
            filter: signedIn && !hasClaimed
              ? "brightness(0) saturate(100%) invert(62%) sepia(85%) saturate(400%) hue-rotate(100deg)"
              : "brightness(0) saturate(100%) invert(20%)",
          }}
        />
        <span
          className="font-mono text-[9.5px] uppercase tracking-widest"
          style={{ color: signedIn && !hasClaimed ? "var(--nav-active-color)" : "var(--widget-dim-text)" }}
        >
          Daily Coins
        </span>
        {!signedIn && (
          <svg className="ml-auto opacity-40" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        )}
      </div>

      {!signedIn ? (
        <p className="font-mono text-[10px]" style={{ color: "var(--widget-dim-text)" }}>Sign in to unlock</p>
      ) : hasClaimed ? (
        <div>
          <div className="mb-[2px] font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--widget-dim-text)" }}>Next reward in</div>
          <div className="font-mono text-[16px] font-semibold tabular-nums leading-none" style={{ color: "var(--nav-active-color)" }}>
            {countdown || "—"}
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={handleClaim}
            disabled={loading}
            className="flex w-full items-center justify-center gap-[7px] rounded-[7px] py-[7px] text-[11px] font-bold text-[#080808] transition-opacity hover:opacity-90 active:opacity-75"
            style={{ background: "var(--nav-active-color)", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Claiming…" : "Claim 100 Coins"}
          </button>
          {err && <p className="mt-1 font-mono text-[10px] text-red-400">{err}</p>}
        </>
      )}
    </div>
  );
}
