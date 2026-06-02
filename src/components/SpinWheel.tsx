"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SEG_COUNT = 7;
const SEG_ANGLE = 360 / SEG_COUNT;
const R = 130;
const CX = 150;
const CY = 150;

const SEGMENTS = [
  { coins: 50,  bg: "#122512", color: "#00ff87" },
  { coins: 100, bg: "#101828", color: "#4d7cff" },
  { coins: 200, bg: "#0e2222", color: "#00e5ff" },
  { coins: 50,  bg: "#122512", color: "#00ff87" },
  { coins: 300, bg: "#1e1028", color: "#b44dff" },
  { coins: 100, bg: "#101828", color: "#4d7cff" },
  { coins: 500, bg: "#262100", color: "#ffd700" },
] as const;

function polarToCartesian(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function segPath(i: number) {
  const s = polarToCartesian(R, i * SEG_ANGLE);
  const e = polarToCartesian(R, (i + 1) * SEG_ANGLE);
  return `M ${CX} ${CY} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

type Props = { initialHasSpun: boolean };

export default function SpinWheel({ initialHasSpun }: Props) {
  const router = useRouter();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(initialHasSpun);
  const [result, setResult] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function spin() {
    if (spinning || hasSpun) return;
    setSpinning(true);
    setErr(null);

    try {
      const res = await fetch("/api/spin", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setErr(
          json.error === "already_spun_today"
            ? "You already spun today!"
            : "Something went wrong. Try again."
        );
        setSpinning(false);
        return;
      }

      const coinsWon: number = json.coinsWon;
      const matches = SEGMENTS.reduce<number[]>((acc, s, i) => { if (s.coins === coinsWon) acc.push(i); return acc; }, []);
      const segIdx = matches[Math.floor(Math.random() * matches.length)] ?? 0;
      // Small jitter so the needle doesn't always land dead-center (looks more natural)
      const jitter = (Math.random() - 0.5) * 0.35;
      const segCenter = (segIdx + 0.5 + jitter) * SEG_ANGLE;
      // Rotating clockwise by (360 - segCenter) brings segCenter under the top pointer
      setRotation(rotation + (360 - segCenter) + 6 * 360);

      setTimeout(() => {
        setSpinning(false);
        setHasSpun(true);
        setResult(coinsWon);
        router.refresh();
      }, 4200);
    } catch {
      setErr("Network error. Please try again.");
      setSpinning(false);
    }
  }

  const resultSeg = SEGMENTS.find((s) => s.coins === result);

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-10">
      <p className="font-mono text-[12px] text-ink-faint tracking-wide">
        Spin once a day · Free coins
      </p>

      {/* Wheel */}
      <div className="relative select-none" style={{ width: 300 }}>
        {/* Pointer */}
        <div className="absolute left-1/2 -top-3 z-10 -translate-x-1/2">
          <svg width="20" height="20" viewBox="0 0 20 20">
            <polygon points="10,20 1,2 19,2" fill="#00ff87" />
          </svg>
        </div>

        {/* Spinning disc */}
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 4s cubic-bezier(0.23, 1, 0.32, 1)"
              : "none",
            borderRadius: "50%",
            overflow: "hidden",
            boxShadow: "0 0 0 3px #1e1e1e, 0 0 50px rgba(0,255,135,0.07)",
          }}
        >
          <svg width="300" height="300" viewBox="0 0 300 300">
            {SEGMENTS.map((seg, i) => {
              const midAngle = (i + 0.5) * SEG_ANGLE;
              const lp = polarToCartesian(R * 0.65, midAngle);
              // midAngle - 90 keeps text reading outward from center;
              // when this segment stops at the top, effective rotation = -90° (reads upward) ✓
              const textRot = midAngle - 90;
              return (
                <g key={i}>
                  <path
                    d={segPath(i)}
                    fill={seg.bg}
                    stroke="#0a0a0a"
                    strokeWidth="2.5"
                  />
                  <g
                    transform={`translate(${lp.x.toFixed(1)},${lp.y.toFixed(1)}) rotate(${textRot.toFixed(1)})`}
                  >
                    <text
                      y="-5"
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="700"
                      fill={seg.color}
                      fontFamily="'DM Mono', 'Courier New', monospace"
                    >
                      {seg.coins}
                    </text>
                    <text
                      y="9"
                      textAnchor="middle"
                      fontSize="8"
                      fill={seg.color}
                      opacity="0.6"
                      fontFamily="'DM Mono', 'Courier New', monospace"
                    >
                      coins
                    </text>
                  </g>
                </g>
              );
            })}
            {/* Hub */}
            <circle cx={CX} cy={CY} r="20" fill="#0a0a0a" stroke="#1e1e1e" strokeWidth="2" />
            <circle cx={CX} cy={CY} r="8" fill="#00ff87" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* Result */}
      {result !== null && (
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
            You won
          </div>
          <div
            className="font-display text-[52px] font-extrabold leading-none"
            style={{ color: resultSeg?.color ?? "#00ff87" }}
          >
            +{result.toLocaleString()}
          </div>
          <div className="font-mono text-[12px] text-ink-faint">
            coins added to your balance
          </div>
        </div>
      )}

      {/* Button / status */}
      <div className="flex flex-col items-center gap-2">
        {!hasSpun ? (
          <button
            onClick={spin}
            disabled={spinning}
            className="rounded-[10px] bg-brand px-12 py-[11px] text-[14px] font-bold text-[#080808] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {spinning ? "Spinning…" : "Spin the Wheel"}
          </button>
        ) : result !== null ? (
          <p className="font-mono text-[11.5px] text-ink-faint">
            Come back tomorrow for another spin
          </p>
        ) : (
          <div className="text-center">
            <div className="text-[14px] font-semibold text-ink-dim">
              Already spun today
            </div>
            <p className="mt-1 font-mono text-[11.5px] text-ink-faint">
              Come back tomorrow for another spin
            </p>
          </div>
        )}
      </div>

      {err && (
        <p className="font-mono text-[12px] text-red-400">{err}</p>
      )}
    </div>
  );
}
