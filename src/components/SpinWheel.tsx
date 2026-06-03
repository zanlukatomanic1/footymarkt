"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ── Geometry ──────────────────────────────────────────── */
const S = 520;
const cx = S / 2;
const cy = S / 2;
const OUTER_R = 248;
const INNER_R = 196;
const HUB_R = 50;
const BULB_POS = OUTER_R - 21;
const BULB_SZ = 9.5;
const N_BULBS = 18;

/* ── Segments ──────────────────────────────────────────── */
const SEGS = [
  { label: "500", points: 500, fill: "#1A8F3E", text: "#fff" },
  { label: "100", points: 100, fill: "#F4F4F4", text: "#166830" },
  { label: "200", points: 200, fill: "#1A8F3E", text: "#fff" },
  { label: "50",  points: 50,  fill: "#F4F4F4", text: "#166830" },
  { label: "300", points: 300, fill: "#1A8F3E", text: "#fff" },
  { label: "100", points: 100, fill: "#F4F4F4", text: "#166830" },
  { label: "50",  points: 50,  fill: "#1A8F3E", text: "#fff" },
  { label: "100", points: 100, fill: "#F4F4F4", text: "#166830" },
] as const;

const N = SEGS.length;
const SLICE = (2 * Math.PI) / N;
const OSWALD = "'Oswald', 'Arial Black', Arial, sans-serif";

/* ── Easing ────────────────────────────────────────────── */
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

/* ── Winner detection ──────────────────────────────────── */
function getWinnerIndex(angle: number): number {
  const norm = ((-(angle % (Math.PI * 2))) + Math.PI * 200) % (Math.PI * 2);
  return Math.floor(norm / SLICE) % N;
}

/* ── Draw helpers (module-level, pure) ─────────────────── */
function drawWoodRing(ctx: CanvasRenderingContext2D) {
  const rg = ctx.createRadialGradient(cx - 50, cy - 50, 10, cx, cy, OUTER_R * 1.05);
  rg.addColorStop(0.00, "#3a3a3a");
  rg.addColorStop(0.30, "#1c1c1c");
  rg.addColorStop(0.65, "#0e0e0e");
  rg.addColorStop(1.00, "#050505");
  ctx.beginPath();
  ctx.arc(cx, cy, OUTER_R, 0, Math.PI * 2);
  ctx.fillStyle = rg;
  ctx.fill();

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, OUTER_R, 0, Math.PI * 2); ctx.clip();
  const hl = ctx.createRadialGradient(cx - 80, cy - 80, 0, cx - 20, cy - 20, OUTER_R * 0.65);
  hl.addColorStop(0, "rgba(255,255,255,0.10)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.beginPath(); ctx.arc(cx, cy, OUTER_R, 0, Math.PI * 2);
  ctx.fillStyle = hl; ctx.fill();
  ctx.restore();

  ctx.beginPath(); ctx.arc(cx, cy, OUTER_R, 0, Math.PI * 2);
  ctx.strokeStyle = "#000"; ctx.lineWidth = 7; ctx.stroke();

  ctx.beginPath(); ctx.arc(cx, cy, OUTER_R - 6, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(26,143,62,0.55)"; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.beginPath(); ctx.arc(cx, cy, INNER_R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 2.5; ctx.stroke();
}

function drawSegments(ctx: CanvasRenderingContext2D, angle: number) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, INNER_R - 1, 0, Math.PI * 2); ctx.clip();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  for (let i = 0; i < N; i++) {
    const sa = -Math.PI / 2 + i * SLICE;
    const ea = sa + SLICE;
    const mid = sa + SLICE / 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, INNER_R, sa, ea);
    ctx.closePath();
    ctx.fillStyle = SEGS[i].fill;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, INNER_R, sa, ea);
    ctx.closePath();
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (SEGS[i].fill !== "#1A8F3E") {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, INNER_R, sa, ea);
      ctx.closePath();
      ctx.clip();
      const sg = ctx.createRadialGradient(-INNER_R * 0.3, -INNER_R * 0.3, 0, 0, 0, INNER_R);
      sg.addColorStop(0, "rgba(255,255,255,0.22)");
      sg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sg; ctx.fill();
      ctx.restore();
    }

    const tr = INNER_R * 0.62;
    ctx.save();
    ctx.translate(tr * Math.cos(mid), tr * Math.sin(mid));
    ctx.rotate(mid + Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fs = Math.max(22, Math.floor(INNER_R * 0.148));
    ctx.font = `700 ${fs}px ${OSWALD}`;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1.5;
    ctx.shadowOffsetY = 1.5;
    ctx.fillStyle = SEGS[i].text;
    ctx.fillText(SEGS[i].label, 0, 0);
    ctx.shadowColor = "transparent";
    ctx.restore();
  }

  ctx.restore();
  ctx.restore();
}

function drawHub(ctx: CanvasRenderingContext2D) {
  const hg = ctx.createRadialGradient(cx - 16, cy - 16, 4, cx, cy, HUB_R);
  hg.addColorStop(0.00, "#3a3a3a");
  hg.addColorStop(0.40, "#1a1a1a");
  hg.addColorStop(1.00, "#080808");
  ctx.beginPath(); ctx.arc(cx, cy, HUB_R, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.fill();

  const hhl = ctx.createRadialGradient(cx - 14, cy - 14, 0, cx, cy, HUB_R);
  hhl.addColorStop(0, "rgba(255,255,255,0.12)");
  hhl.addColorStop(0.5, "rgba(255,255,255,0.03)");
  hhl.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath(); ctx.arc(cx, cy, HUB_R, 0, Math.PI * 2);
  ctx.fillStyle = hhl; ctx.fill();

  ctx.beginPath(); ctx.arc(cx, cy, HUB_R, 0, Math.PI * 2);
  ctx.strokeStyle = "#1A8F3E"; ctx.lineWidth = 3; ctx.stroke();

  ctx.beginPath(); ctx.arc(cx, cy, HUB_R - 11, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(26,143,62,0.25)"; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawBulbs(ctx: CanvasRenderingContext2D, spinning: boolean, bulbTick: number) {
  for (let i = 0; i < N_BULBS; i++) {
    const a = (i / N_BULBS) * Math.PI * 2 - Math.PI / 2;
    const bx = cx + BULB_POS * Math.cos(a);
    const by = cy + BULB_POS * Math.sin(a);

    const bright = spinning ? ((i % 2 === bulbTick % 2) ? 1.0 : 0.35) : 1.0;

    const gw = ctx.createRadialGradient(bx, by, 0, bx, by, BULB_SZ * 2.8);
    gw.addColorStop(0, `rgba(150,255,180,${0.55 * bright})`);
    gw.addColorStop(0.5, `rgba(26,143,62,${0.22 * bright})`);
    gw.addColorStop(1, "rgba(26,143,62,0)");
    ctx.beginPath(); ctx.arc(bx, by, BULB_SZ * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = gw; ctx.fill();

    const bg = ctx.createRadialGradient(bx - 3.5, by - 3.5, 1.5, bx, by, BULB_SZ);
    bg.addColorStop(0.00, `rgba(220,255,230,${0.92 * bright + 0.04})`);
    bg.addColorStop(0.35, `rgba(${Math.round(60 * bright + 80)},${Math.round(200 * bright + 30)},${Math.round(100 * bright)},1)`);
    bg.addColorStop(0.80, `rgba(${Math.round(10 * bright + 10)},${Math.round(120 * bright + 10)},${Math.round(40 * bright)},1)`);
    bg.addColorStop(1.00, `rgba(0,${Math.round(70 * bright)},${Math.round(20 * bright)},1)`);
    ctx.beginPath(); ctx.arc(bx, by, BULB_SZ, 0, Math.PI * 2);
    ctx.fillStyle = bg; ctx.fill();

    ctx.beginPath(); ctx.arc(bx, by, BULB_SZ, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,60,20,${0.75 * bright + 0.15})`;
    ctx.lineWidth = 1; ctx.stroke();
  }
}

function drawPointer(ctx: CanvasRenderingContext2D) {
  const tipY = cy - INNER_R + 6;
  const baseY = cy - OUTER_R + 18;
  const hw = 15;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  ctx.beginPath();
  ctx.moveTo(cx, tipY);
  ctx.lineTo(cx - hw, baseY);
  ctx.lineTo(cx + hw, baseY);
  ctx.closePath();

  const pg = ctx.createLinearGradient(cx - hw, 0, cx + hw, 0);
  pg.addColorStop(0, "#17a83a");
  pg.addColorStop(0.5, "#2ecc60");
  pg.addColorStop(1, "#17a83a");
  ctx.fillStyle = pg; ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
}

/* ── Countdown hook ────────────────────────────────────── */
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

/* ── Component ─────────────────────────────────────────── */
type Props = { initialHasSpun: boolean; nextSpinAt: string };

export default function SpinWheel({ initialHasSpun, nextSpinAt }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const angleRef = useRef(0);
  const spinningRef = useRef(false);
  const bulbTickRef = useRef(0);
  const lastBulbTimeRef = useRef(0);
  const rafRef = useRef<number>(0);

  const [phase, setPhase] = useState<"idle" | "spinning" | "done">(
    initialHasSpun ? "done" : "idle"
  );
  const [result, setResult] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const countdown = useCountdown(nextSpinAt, phase === "done");

  function drawFrame(now?: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (spinningRef.current && now != null && now - lastBulbTimeRef.current > 140) {
      bulbTickRef.current++;
      lastBulbTimeRef.current = now;
    }

    ctx.clearRect(0, 0, S, S);
    drawWoodRing(ctx);
    drawSegments(ctx, angleRef.current);
    drawHub(ctx);
    drawBulbs(ctx, spinningRef.current, bulbTickRef.current);
    drawPointer(ctx);
  }

  useEffect(() => {
    document.fonts.ready.then(() => drawFrame());
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSpin() {
    if (phase !== "idle") return;
    setPhase("spinning");
    setErr(null);
    spinningRef.current = true;
    bulbTickRef.current = 0;
    lastBulbTimeRef.current = performance.now();

    let coinsWon: number;
    try {
      const res = await fetch("/api/spin", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setErr(
          json.error === "already_spun_today"
            ? "You already spun today!"
            : "Something went wrong. Try again."
        );
        setPhase("idle");
        spinningRef.current = false;
        drawFrame();
        return;
      }
      coinsWon = json.coinsWon;
    } catch {
      setErr("Network error. Please try again.");
      setPhase("idle");
      spinningRef.current = false;
      drawFrame();
      return;
    }

    const matches = SEGS.reduce<number[]>((acc, s, i) => {
      if (s.points === coinsWon) acc.push(i);
      return acc;
    }, []);
    const winIdx = matches[Math.floor(Math.random() * matches.length)] ?? 0;

    console.log("Backend:", coinsWon);
    console.log("Target index:", winIdx);
    console.log("Target segment:", SEGS[winIdx]);[  ]

    const segMidOffset = (winIdx + 0.5) * SLICE;
    const targetMod  = ((2 * Math.PI - segMidOffset) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const currentMod = ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const needed     = (targetMod - currentMod + 2 * Math.PI) % (2 * Math.PI);
    const rotations  = 6 + Math.random() * 4;
    const deltaAngle = rotations * 2 * Math.PI + needed;
    const duration = 4800 + Math.random() * 1800;

    console.log({
      coinsWon,
      winIdx,
      targetSegment: SEGS[winIdx],
      actualSegment: SEGS[getWinnerIndex(angleRef.current)]
    });

    const startAngle = angleRef.current;
    const startTime = performance.now();

    function animateFrame(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      angleRef.current = startAngle + deltaAngle * easeOutQuart(t);
      drawFrame(now);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animateFrame);
      } else {
        angleRef.current = startAngle + deltaAngle;
        spinningRef.current = false;
        bulbTickRef.current = 0;
        drawFrame();

        setTimeout(() => {
          setResult(coinsWon);
          setShowModal(true);
          setPhase("done");
          router.refresh();
        }, 350);
      }
    }

    rafRef.current = requestAnimationFrame(animateFrame);
  }

  const canSpin = phase === "idle";

  return (
    <div className="flex flex-col items-center gap-8 px-4 py-10">
      <p className="font-mono text-[12px] text-ink-faint tracking-wide">
        Spin once a day · Free coins
      </p>

      {/* Canvas */}
      <div style={{ width: "100%", maxWidth: S }}>
        <canvas
          ref={canvasRef}
          width={S}
          height={S}
          style={{ width: "100%", height: "auto", display: "block", cursor: canSpin ? "pointer" : "default" }}
          onClick={(e) => {
            if (!canSpin) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const scaleX = S / rect.width;
            const scaleY = S / rect.height;
            const dx = (e.clientX - rect.left) * scaleX - cx;
            const dy = (e.clientY - rect.top) * scaleY - cy;
            if (Math.sqrt(dx * dx + dy * dy) <= HUB_R) handleSpin();
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {phase !== "done" && (
          <button
            onClick={handleSpin}
            disabled={!canSpin}
            className="spin-wheel-btn"
          >
            {phase === "spinning" ? "SPINNING…" : "SPIN"}
          </button>
        )}

        {phase === "done" && !showModal && (
          <div className="flex flex-col items-center gap-2 text-center">
            {result !== null && (
              <div
                style={{
                  fontFamily: OSWALD,
                  fontSize: 18,
                  color: "#1A8F3E",
                  letterSpacing: 1,
                }}
              >
                +{result} coins added!
              </div>
            )}
            {result === null && (
              <div className="text-[14px] font-semibold text-ink-dim">
                Already spun today
              </div>
            )}
            <div className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">
              Next spin in
            </div>
            <div
              className="font-mono text-[32px] font-semibold tabular-nums leading-none"
              style={{ color: "#00ff87" }}
            >
              {countdown || "—"}
            </div>
          </div>
        )}
      </div>

      {err && (
        <p className="font-mono text-[12px] text-red-400">{err}</p>
      )}

      {/* Result modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          opacity: showModal ? 1 : 0,
          pointerEvents: showModal ? "all" : "none",
          transition: "opacity 0.35s",
        }}
        onClick={() => setShowModal(false)}
      >
        <div
          style={{
            background: "linear-gradient(160deg, #7B3A10, #A0521C 50%, #7B3A10)",
            border: "4px solid #FFD700",
            borderRadius: 22,
            padding: "48px 64px 36px",
            textAlign: "center",
            boxShadow: "0 0 60px rgba(255,180,0,0.35), 0 20px 60px rgba(0,0,0,0.6)",
            transform: showModal ? "scale(1)" : "scale(0.85)",
            transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              color: "#FFD700",
              fontFamily: OSWALD,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: 5,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            🎉 You Won!
          </div>
          <div
            style={{
              color: "#fff",
              fontFamily: OSWALD,
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1,
              textShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            {result ?? 0}
          </div>
          <div
            style={{
              color: "#FFD700",
              fontFamily: OSWALD,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 4,
              marginTop: 4,
              marginBottom: 28,
            }}
          >
            COINS
          </div>
          <button
            style={{
              background: "linear-gradient(180deg, #FFD93D, #FF9500)",
              border: "none",
              borderRadius: 50,
              padding: "12px 36px",
              fontFamily: OSWALD,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#5A2800",
              cursor: "pointer",
              boxShadow: "0 4px 0 #A05000, 0 6px 16px rgba(0,0,0,0.3)",
            }}
            onClick={() => setShowModal(false)}
          >
            CLAIM REWARD
          </button>
        </div>
      </div>
    </div>
  );
}
