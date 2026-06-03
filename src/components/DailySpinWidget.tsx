"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Wheel config v2 ─────────────────────────────────────────────────────────
const SEG_COUNT = 7;
const SEG_ANGLE = 360 / SEG_COUNT;
const R   = 118;   // segment outer radius
const OR  = 127;   // outer decorative ring radius
const CX  = 140;
const CY  = 140;
const W   = 280;   // svg / container size

const SEGMENTS = [
  { coins: 50,  bg: "#152e17", border: "#00ff8740", color: "#00ff87" },
  { coins: 100, bg: "#101e38", border: "#4d7cff40", color: "#4d7cff" },
  { coins: 200, bg: "#0d2626", border: "#00e5ff40", color: "#00e5ff" },
  { coins: 50,  bg: "#152e17", border: "#00ff8740", color: "#00ff87" },
  { coins: 300, bg: "#1e1030", border: "#b44dff40", color: "#b44dff" },
  { coins: 100, bg: "#101e38", border: "#4d7cff40", color: "#4d7cff" },
  { coins: 500, bg: "#251e00", border: "#ffd70050", color: "#ffd700" },
] as const;

function pol(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function segPath(i: number) {
  const s = pol(R, i * SEG_ANGLE);
  const e = pol(R, (i + 1) * SEG_ANGLE);
  return `M ${CX} ${CY} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

function getNextMidnightUTC() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
type Props = {
  spinAvailable: boolean;
  signedIn: boolean;
  compact?: boolean;
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function DailySpinWidget({ spinAvailable, signedIn, compact = false }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [hasSpun, setHasSpun] = useState(!spinAvailable);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const nextSpinAt = getNextMidnightUTC();
  const countdown = useCountdown(nextSpinAt, hasSpun);
  const resultSeg = SEGMENTS.find((s) => s.coins === result);

  async function spin() {
    if (spinning || hasSpun) return;
    setSpinning(true);
    setErr(null);
    try {
      const res = await fetch("/api/spin", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error === "already_spun_today" ? "Already spun today!" : "Something went wrong.");
        setSpinning(false);
        return;
      }
      const coinsWon: number = json.coinsWon;
      const matches = SEGMENTS.reduce<number[]>((acc, s, i) => {
        if (s.coins === coinsWon) acc.push(i);
        return acc;
      }, []);
      const segIdx = matches[Math.floor(Math.random() * matches.length)] ?? 0;
      const jitter = (Math.random() - 0.5) * 0.35;
      const segCenter = (segIdx + 0.5 + jitter) * SEG_ANGLE;
      setRotation((prev) => prev + (360 - segCenter) + 6 * 360);
      setTimeout(() => {
        setSpinning(false);
        setHasSpun(true);
        setResult(coinsWon);
        router.refresh();
      }, 4200);
    } catch {
      setErr("Network error.");
      setSpinning(false);
    }
  }

  function openModal() {
    if (signedIn && !hasSpun) setModalOpen(true);
  }

  // ─── Compact (mobile bar) ────────────────────────────────────────────────
  if (compact) {
    if (!signedIn) return null;
    return (
      <>
        <button
          onClick={hasSpun ? undefined : openModal}
          disabled={hasSpun}
          className="flex w-full items-center justify-between border-b border-line px-4 py-[9px] transition-colors"
          style={{
            background: hasSpun ? "transparent" : "rgba(0,255,135,0.04)",
            cursor: hasSpun ? "default" : "pointer",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-[7px] w-[7px] flex-shrink-0">
              {!hasSpun && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-75 animate-ping" />
              )}
              <span
                className="relative inline-flex h-[7px] w-[7px] rounded-full"
                style={{ background: hasSpun ? "#222" : "#00ff87" }}
              />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: hasSpun ? "#333" : "#00ff87" }}>
              Daily Spin
            </span>
          </div>
          {hasSpun ? (
            <span className="font-mono text-[11px] tabular-nums" style={{ color: "#333" }}>
              {countdown || "—"}
            </span>
          ) : (
            <span className="font-mono text-[10px] text-ink-faint">Tap to spin →</span>
          )}
        </button>

        <SpinModal
          open={modalOpen}
          spinning={spinning}
          rotation={rotation}
          result={result}
          resultSeg={resultSeg}
          hasSpun={hasSpun}
          countdown={countdown}
          err={err}
          onClose={() => !spinning && setModalOpen(false)}
          onSpin={spin}
        />
      </>
    );
  }

  // ─── Sidebar card ────────────────────────────────────────────────────────
  return (
    <>
      <div className="mx-[10px] mb-[6px] rounded-[10px] border border-[#181818] bg-[#0c0c0c] px-[12px] py-[10px]">
        <div className="mb-[8px] flex items-center gap-[6px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/spinTheWheelAsset.png"
            alt=""
            width={11}
            height={11}
            style={{ filter: signedIn && !hasSpun ? "brightness(0) saturate(100%) invert(62%) sepia(85%) saturate(400%) hue-rotate(100deg)" : "brightness(0) saturate(100%) invert(20%)" }}
          />
          <span className="font-mono text-[9.5px] uppercase tracking-widest" style={{ color: signedIn && !hasSpun ? "#00ff87" : "#2e2e2e" }}>
            Daily Spin
          </span>
          {!signedIn && (
            <svg className="ml-auto opacity-40" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          )}
        </div>

        {!signedIn ? (
          <p className="font-mono text-[10px] text-[#252525]">Sign in to unlock</p>
        ) : hasSpun ? (
          <div>
            <div className="mb-[2px] font-mono text-[9px] uppercase tracking-wider text-[#2e2e2e]">Next spin in</div>
            <div className="font-mono text-[16px] font-semibold tabular-nums leading-none" style={{ color: "#00ff87" }}>
              {countdown || "—"}
            </div>
          </div>
        ) : (
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-[7px] rounded-[7px] bg-brand py-[7px] text-[11px] font-bold text-[#080808] transition-opacity hover:opacity-90 active:opacity-75"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/spinTheWheelAsset.png" alt="" width={13} height={13} style={{ filter: "brightness(0)" }} />
            Spin Now
          </button>
        )}
      </div>

      <SpinModal
        open={modalOpen}
        spinning={spinning}
        rotation={rotation}
        result={result}
        resultSeg={resultSeg}
        hasSpun={hasSpun}
        countdown={countdown}
        err={err}
        onClose={() => !spinning && setModalOpen(false)}
        onSpin={spin}
      />
    </>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
type SegType = (typeof SEGMENTS)[number];

function SpinModal({
  open, spinning, rotation, result, resultSeg, hasSpun, countdown, err, onClose, onSpin,
}: {
  open: boolean;
  spinning: boolean;
  rotation: number;
  result: number | null;
  resultSeg: SegType | undefined;
  hasSpun: boolean;
  countdown: string;
  err: string | null;
  onClose: () => void;
  onSpin: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[380px] rounded-[22px] border border-line bg-card p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        {!spinning && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-element text-ink-faint hover:text-ink transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}

        <p className="mb-5 text-center font-mono text-[10px] uppercase tracking-widest text-ink-faint">
          Daily Spin · Free coins
        </p>

        {/* ── Wheel v2 ── */}
        <div className="relative mx-auto select-none" style={{ width: W }}>

          {/* Pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{ top: -14 }}>
            <svg width="22" height="26" viewBox="0 0 22 26">
              <defs>
                <linearGradient id="ptr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff87"/>
                  <stop offset="100%" stopColor="#00c060"/>
                </linearGradient>
              </defs>
              <polygon points="11,26 1,2 21,2" fill="url(#ptr)" />
              <polygon points="11,22 4,5 18,5" fill="#0a0a0a" opacity="0.3" />
            </svg>
          </div>

          {/* Spinning disc */}
          <div
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.23, 1, 0.32, 1)" : "none",
              borderRadius: "50%",
              overflow: "visible",
              position: "relative",
            }}
          >
            <svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} style={{ display: "block" }}>
              <defs>
                <filter id="seg-glow">
                  <feGaussianBlur stdDeviation="1.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Outer decorative ring */}
              <circle cx={CX} cy={CY} r={OR} fill="none" stroke="#1e1e1e" strokeWidth="5"/>
              <circle cx={CX} cy={CY} r={OR + 4} fill="none" stroke="#141414" strokeWidth="2"/>

              {/* Segments */}
              {SEGMENTS.map((seg, i) => {
                const midAngle = (i + 0.5) * SEG_ANGLE;
                const lp = pol(R * 0.63, midAngle);
                // Keep text within ±90° so it's always upright and readable
                let textRot = midAngle - 90;
                if (textRot >= 90) textRot -= 180;
                return (
                  <g key={i}>
                    <path d={segPath(i)} fill={seg.bg} stroke={seg.border} strokeWidth="2"/>
                    <g transform={`translate(${lp.x.toFixed(1)},${lp.y.toFixed(1)}) rotate(${textRot.toFixed(1)})`}>
                      <text
                        y="-5"
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="800"
                        fill={seg.color}
                        fontFamily="'DM Mono', monospace"
                      >
                        {seg.coins}
                      </text>
                      <text y="9" textAnchor="middle" fontSize="7" fill={seg.color} opacity="0.6" fontFamily="'DM Mono', monospace" letterSpacing="1">
                        COINS
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Hub */}
              <circle cx={CX} cy={CY} r="30" fill="#080808" stroke="#1e1e1e" strokeWidth="2.5"/>
              <circle cx={CX} cy={CY} r="22" fill="#0d0d0d" stroke="#252525" strokeWidth="1"/>
              <circle cx={CX} cy={CY} r="9"  fill="#00ff87" opacity="0.9"/>
              <circle cx={CX} cy={CY} r="4"  fill="#0a0a0a"/>
            </svg>
          </div>

          {/* Outer glow ring (non-rotating) */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ boxShadow: "0 0 0 3px #1a1a1a, 0 0 60px rgba(0,255,135,0.06)" }}
          />
        </div>

        {/* Result */}
        {result !== null && (
          <div className="mt-6 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">You won</div>
            <div
              className="font-display text-[52px] font-extrabold leading-none"
              style={{ color: resultSeg?.color ?? "#00ff87", textShadow: `0 0 30px ${resultSeg?.color ?? "#00ff87"}55` }}
            >
              +{result.toLocaleString()}
            </div>
            <div className="font-mono text-[11px] text-ink-faint">coins added to your balance</div>
          </div>
        )}

        {/* CTA / countdown */}
        <div className="mt-6 flex flex-col items-center gap-2">
          {!hasSpun ? (
            <button
              onClick={onSpin}
              disabled={spinning}
              className="flex w-full items-center justify-center gap-3 rounded-[12px] bg-brand py-[13px] text-[14px] font-bold text-[#080808] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/spinTheWheelAsset.png"
                alt=""
                width={18}
                height={18}
                className={spinning ? "animate-spin" : ""}
                style={{ filter: "brightness(0)" }}
              />
              {spinning ? "Spinning…" : "Spin the Wheel"}
            </button>
          ) : result !== null ? (
            <div className="flex flex-col items-center gap-[6px] text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">Next spin in</div>
              <div className="font-mono text-[28px] font-semibold tabular-nums" style={{ color: "#00ff87" }}>
                {countdown || "—"}
              </div>
            </div>
          ) : null}
        </div>

        {err && <p className="mt-3 text-center font-mono text-[11px] text-red-400">{err}</p>}
      </div>
    </div>
  );
}
