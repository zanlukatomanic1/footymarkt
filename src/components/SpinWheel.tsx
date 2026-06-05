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

type Props = { initialHasSpun: boolean; nextSpinAt: string };

export default function SpinWheel({ initialHasSpun, nextSpinAt }: Props) {
  const router = useRouter();
  const [hasClaimed, setHasClaimed] = useState(initialHasSpun);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const countdown = useCountdown(nextSpinAt, hasClaimed);

  async function handleClaim() {
    if (hasClaimed || loading) return;
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
      setErr("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
          Daily reward
        </div>
        <div
          className="font-mono tabular-nums leading-none"
          style={{ fontSize: 88, fontWeight: 700, color: "var(--brand)" }}
        >
          100
        </div>
        <div className="font-mono text-[20px] font-semibold tracking-widest" style={{ color: "var(--brand)" }}>
          COINS
        </div>
      </div>

      {!hasClaimed ? (
        <button
          onClick={handleClaim}
          disabled={loading}
          className="spin-wheel-btn"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "CLAIMING…" : "CLAIM FREE COINS"}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="font-mono text-[13px]" style={{ color: "var(--brand)" }}>
            +100 coins added!
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-faint mt-2">
            Next reward in
          </div>
          <div
            className="font-mono tabular-nums leading-none"
            style={{ fontSize: 36, fontWeight: 700, color: "var(--brand)" }}
          >
            {countdown || "—"}
          </div>
        </div>
      )}

      {err && <p className="font-mono text-[12px] text-red-400">{err}</p>}
    </div>
  );
}
