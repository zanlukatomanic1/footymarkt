"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ── Canvas geometry ───────────────────────────────────── */
const S = 520;
const cx = S / 2;
const cy = S / 2;
const OUTER_R = 248;
const INNER_R = 196;
const HUB_R   = 50;
const BULB_POS = OUTER_R - 21;
const BULB_SZ  = 9.5;
const N_BULBS  = 18;

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

const N     = SEGS.length;
const SLICE = (2 * Math.PI) / N;
const OSWALD = "'Oswald', 'Arial Black', Arial, sans-serif";

/* ── Easing ────────────────────────────────────────────── */
function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

/* ── Winner index from angle ───────────────────────────── */
// function getWinnerIndex(angle: number): number {
//   const norm = ((-(angle % (Math.PI * 2))) + Math.PI * 200) % (Math.PI * 2);
//   return Math.floor(norm / SLICE) % N;
// }

function getWinnerIndex(angle: number): number {
  const normalized =
    (((-angle + Math.PI / 2) % (Math.PI * 2)) + Math.PI * 2) %
    (Math.PI * 2);

  return Math.floor(normalized / SLICE) % N;
}

// keep getWinnerIndex used (referenced in future if needed)
void getWinnerIndex;

/* ── Draw functions ────────────────────────────────────── */
function drawWoodRing(ctx: CanvasRenderingContext2D) {
  const rg = ctx.createRadialGradient(cx - 50, cy - 50, 10, cx, cy, OUTER_R * 1.05);
  rg.addColorStop(0.00, "#3a3a3a");
  rg.addColorStop(0.30, "#1c1c1c");
  rg.addColorStop(0.65, "#0e0e0e");
  rg.addColorStop(1.00, "#050505");
  ctx.beginPath(); ctx.arc(cx, cy, OUTER_R, 0, Math.PI * 2);
  ctx.fillStyle = rg; ctx.fill();

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
    const sa  = -Math.PI / 2 + i * SLICE;
    const ea  = sa + SLICE;
    const mid = sa + SLICE / 2;

    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, INNER_R, sa, ea); ctx.closePath();
    ctx.fillStyle = SEGS[i].fill; ctx.fill();

    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, INNER_R, sa, ea); ctx.closePath();
    ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 2; ctx.stroke();

    if (SEGS[i].fill !== "#1A8F3E") {
      ctx.save();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, INNER_R, sa, ea); ctx.closePath(); ctx.clip();
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
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `700 ${Math.max(22, Math.floor(INNER_R * 0.148))}px ${OSWALD}`;
    ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1.5; ctx.shadowOffsetY = 1.5;
    ctx.fillStyle = SEGS[i].text;
    ctx.fillText(SEGS[i].label, 0, 0);
    ctx.shadowColor = "transparent";
    ctx.restore();
  }

  ctx.restore(); ctx.restore();
}

function drawHub(ctx: CanvasRenderingContext2D) {
  const hg = ctx.createRadialGradient(cx - 16, cy - 16, 4, cx, cy, HUB_R);
  hg.addColorStop(0.00, "#3a3a3a"); hg.addColorStop(0.40, "#1a1a1a"); hg.addColorStop(1.00, "#080808");
  ctx.beginPath(); ctx.arc(cx, cy, HUB_R, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill();

  const hhl = ctx.createRadialGradient(cx - 14, cy - 14, 0, cx, cy, HUB_R);
  hhl.addColorStop(0, "rgba(255,255,255,0.12)"); hhl.addColorStop(0.5, "rgba(255,255,255,0.03)"); hhl.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath(); ctx.arc(cx, cy, HUB_R, 0, Math.PI * 2); ctx.fillStyle = hhl; ctx.fill();

  ctx.beginPath(); ctx.arc(cx, cy, HUB_R, 0, Math.PI * 2);
  ctx.strokeStyle = "#1A8F3E"; ctx.lineWidth = 3; ctx.stroke();

  ctx.beginPath(); ctx.arc(cx, cy, HUB_R - 11, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(26,143,62,0.25)"; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawBulbs(ctx: CanvasRenderingContext2D, spinning: boolean, bulbTick: number) {
  for (let i = 0; i < N_BULBS; i++) {
    const a   = (i / N_BULBS) * Math.PI * 2 - Math.PI / 2;
    const bx  = cx + BULB_POS * Math.cos(a);
    const by  = cy + BULB_POS * Math.sin(a);
    const bright = spinning ? ((i % 2 === bulbTick % 2) ? 1.0 : 0.35) : 1.0;

    const gw = ctx.createRadialGradient(bx, by, 0, bx, by, BULB_SZ * 2.8);
    gw.addColorStop(0, `rgba(150,255,180,${0.55 * bright})`);
    gw.addColorStop(0.5, `rgba(26,143,62,${0.22 * bright})`);
    gw.addColorStop(1, "rgba(26,143,62,0)");
    ctx.beginPath(); ctx.arc(bx, by, BULB_SZ * 2.8, 0, Math.PI * 2); ctx.fillStyle = gw; ctx.fill();

    const bg = ctx.createRadialGradient(bx - 3.5, by - 3.5, 1.5, bx, by, BULB_SZ);
    bg.addColorStop(0.00, `rgba(220,255,230,${0.92 * bright + 0.04})`);
    bg.addColorStop(0.35, `rgba(${Math.round(60 * bright + 80)},${Math.round(200 * bright + 30)},${Math.round(100 * bright)},1)`);
    bg.addColorStop(0.80, `rgba(${Math.round(10 * bright + 10)},${Math.round(120 * bright + 10)},${Math.round(40 * bright)},1)`);
    bg.addColorStop(1.00, `rgba(0,${Math.round(70 * bright)},${Math.round(20 * bright)},1)`);
    ctx.beginPath(); ctx.arc(bx, by, BULB_SZ, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();

    ctx.beginPath(); ctx.arc(bx, by, BULB_SZ, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,60,20,${0.75 * bright + 0.15})`; ctx.lineWidth = 1; ctx.stroke();
  }
}

function drawPointer(ctx: CanvasRenderingContext2D) {
  const tipY  = cy - INNER_R + 6;
  const baseY = cy - OUTER_R + 18;
  const hw    = 15;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.moveTo(cx, tipY); ctx.lineTo(cx - hw, baseY); ctx.lineTo(cx + hw, baseY); ctx.closePath();
  const pg = ctx.createLinearGradient(cx - hw, 0, cx + hw, 0);
  pg.addColorStop(0, "#17a83a"); pg.addColorStop(0.5, "#2ecc60"); pg.addColorStop(1, "#17a83a");
  ctx.fillStyle = pg; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
}

/* ── Countdown ─────────────────────────────────────────── */
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

/* ── Types ─────────────────────────────────────────────── */
type Props = {
  spinAvailable: boolean;
  signedIn: boolean;
  compact?: boolean;
};

/* ── Component ─────────────────────────────────────────── */
export default function DailySpinWidget({ spinAvailable, signedIn, compact = false }: Props) {
  const router = useRouter();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [hasSpun,    setHasSpun]    = useState(!spinAvailable);
  const [spinning,   setSpinning]   = useState(false);
  const [result,     setResult]     = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [err,        setErr]        = useState<string | null>(null);

  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const angleRef        = useRef(0);
  const spinningRef     = useRef(false);
  const bulbTickRef     = useRef(0);
  const lastBulbTimeRef = useRef(0);
  const rafRef          = useRef<number>(0);

  const nextSpinAt = getNextMidnightUTC();
  const countdown  = useCountdown(nextSpinAt, hasSpun);

  /* ── Draw frame ─────────────────────────────────────── */
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

  /* Initial draw when modal opens */
  useEffect(() => {
    if (modalOpen) {
      document.fonts.ready.then(() => drawFrame());
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  /* ── Spin logic ─────────────────────────────────────── */
  async function handleSpin() {
    if (spinning || hasSpun) return;
    setSpinning(true);
    setErr(null);
    spinningRef.current  = true;
    bulbTickRef.current  = 0;
    lastBulbTimeRef.current = performance.now();

    let coinsWon: number;
    try {
      const res  = await fetch("/api/spin", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error === "already_spun_today" ? "Already spun today!" : "Something went wrong.");
        setSpinning(false);
        spinningRef.current = false;
        drawFrame();
        return;
      }
      coinsWon = json.coinsWon;
    } catch {
      setErr("Network error. Try again.");
      setSpinning(false);
      spinningRef.current = false;
      drawFrame();
      return;
    }

    /* Find matching segment index */
    const matches = SEGS.reduce<number[]>((acc, s, i) => {
      if (s.points === coinsWon) acc.push(i);
      return acc;
    }, []);
    const winIdx = matches[Math.floor(Math.random() * matches.length)] ?? 0;


    /* Compute target angle.
       We want the wheel rotated so that segment winIdx's midpoint sits
       exactly at the 12-o'clock pointer.
       Segment midpoint local angle = -π/2 + (winIdx + 0.5) * SLICE.
       After rotation by finalAngle: screen_angle = local_mid + finalAngle.
       We want screen_angle = -π/2  (top)  →  finalAngle ≡ -(winIdx + 0.5)*SLICE  (mod 2π) */
    // const segMidOffset = (winIdx + 0.5) * SLICE;
    // const targetMod    = ((2 * Math.PI - segMidOffset) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    const segMidOffset = winIdx * SLICE;
    const targetMod =
      ((2 * Math.PI - segMidOffset) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const currentMod   = ((angleRef.current  % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // console.log("coinsWon", coinsWon);
    // console.log("winIdx", winIdx);
    // console.log("target segment", SEGS[winIdx]);
    // console.log("targetMod", targetMod);

    const needed       = (targetMod - currentMod + 2 * Math.PI) % (2 * Math.PI);
    const rotations    = 6 + Math.random() * 4;
    const deltaAngle   = rotations * 2 * Math.PI + needed;
    const duration        = 4800 + Math.random() * 1800;
    const startAngle      = angleRef.current;
    const startTime       = performance.now();

    function animateFrame(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      angleRef.current = startAngle + deltaAngle * easeOutQuart(t);
      drawFrame(now);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animateFrame);
      } else {
        angleRef.current = startAngle + deltaAngle;

        // console.log(
        //   "final winner",
        //   getWinnerIndex(angleRef.current),
        //   SEGS[getWinnerIndex(angleRef.current)]
        // );


        spinningRef.current = false;
        bulbTickRef.current = 0;
        drawFrame();

        setTimeout(() => {
          setResult(coinsWon);
          setShowResult(true);
          setHasSpun(true);
          setSpinning(false);
          router.refresh();
        }, 350);
      }
    }

    rafRef.current = requestAnimationFrame(animateFrame);
  }

  function openModal() {
    if (!signedIn) return;
    setModalOpen(true);
  }

  function closeModal() {
    if (spinning) return;
    setModalOpen(false);
    setShowResult(false);
  }

  /* ── Compact strip (mobile) ─────────────────────────── */
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
          hasSpun={hasSpun}
          result={result}
          showResult={showResult}
          countdown={countdown}
          err={err}
          canvasRef={canvasRef}
          onClose={closeModal}
          onSpin={handleSpin}
          onClaimResult={() => setShowResult(false)}
        />
      </>
    );
  }

  /* ── Sidebar card ───────────────────────────────────── */
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
            style={{
              filter: signedIn && !hasSpun
                ? "brightness(0) saturate(100%) invert(62%) sepia(85%) saturate(400%) hue-rotate(100deg)"
                : "brightness(0) saturate(100%) invert(20%)",
            }}
          />
          <span
            className="font-mono text-[9.5px] uppercase tracking-widest"
            style={{ color: signedIn && !hasSpun ? "#00ff87" : "#2e2e2e" }}
          >
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
        hasSpun={hasSpun}
        result={result}
        showResult={showResult}
        countdown={countdown}
        err={err}
        canvasRef={canvasRef}
        onClose={closeModal}
        onSpin={handleSpin}
        onClaimResult={() => setShowResult(false)}
      />
    </>
  );
}

/* ── Modal ─────────────────────────────────────────────── */
type ModalProps = {
  open: boolean;
  spinning: boolean;
  hasSpun: boolean;
  result: number | null;
  showResult: boolean;
  countdown: string;
  err: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onClose: () => void;
  onSpin: () => void;
  onClaimResult: () => void;
};

function SpinModal({
  open, spinning, hasSpun, result, showResult, countdown, err,
  canvasRef, onClose, onSpin, onClaimResult,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[480px] rounded-[22px] border border-line bg-card p-5 pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
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

        <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-widest text-ink-faint">
          Daily Spin · Free coins
        </p>

        {/* Canvas + result overlay */}
        <div style={{ position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={S}
            height={S}
            style={{ width: "100%", height: "auto", display: "block", cursor: (!hasSpun && !spinning) ? "pointer" : "default" }}
            onClick={() => { if (!hasSpun && !spinning) onSpin(); }}
          />

          {/* Result card overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: showResult ? 1 : 0,
              pointerEvents: showResult ? "all" : "none",
              transition: "opacity 0.35s",
            }}
          >
            <div
              style={{
                background: "linear-gradient(160deg, #7B3A10, #A0521C 50%, #7B3A10)",
                border: "4px solid #FFD700",
                borderRadius: 18,
                padding: "36px 52px 28px",
                textAlign: "center",
                boxShadow: "0 0 60px rgba(255,180,0,0.35), 0 20px 60px rgba(0,0,0,0.6)",
                transform: showResult ? "scale(1)" : "scale(0.85)",
                transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <div style={{ color: "#FFD700", fontFamily: "'Oswald', Arial, sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: 5, textTransform: "uppercase", marginBottom: 6 }}>
                🎉 You Won!
              </div>
              <div style={{ color: "#fff", fontFamily: "'Oswald', Arial, sans-serif", fontSize: 76, fontWeight: 700, lineHeight: 1, textShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
                {result ?? 0}
              </div>
              <div style={{ color: "#FFD700", fontFamily: "'Oswald', Arial, sans-serif", fontSize: 24, fontWeight: 600, letterSpacing: 4, marginTop: 4, marginBottom: 22 }}>
                COINS
              </div>
              <button
                style={{
                  background: "linear-gradient(180deg, #FFD93D, #FF9500)",
                  border: "none",
                  borderRadius: 50,
                  padding: "11px 32px",
                  fontFamily: "'Oswald', Arial, sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "#5A2800",
                  cursor: "pointer",
                  boxShadow: "0 4px 0 #A05000, 0 6px 16px rgba(0,0,0,0.3)",
                }}
                onClick={onClaimResult}
              >
                CLAIM REWARD
              </button>
            </div>
          </div>
        </div>

        {/* Controls below canvas */}
        <div className="mt-5 flex flex-col items-center gap-3">
          {!hasSpun && (
            <button
              onClick={onSpin}
              disabled={spinning}
              className="spin-wheel-btn"
            >
              {spinning ? "SPINNING…" : "SPIN"}
            </button>
          )}

          {hasSpun && !showResult && (
            <div className="flex flex-col items-center gap-1 text-center">
              {result !== null && (
                <div style={{ fontFamily: "'Oswald', Arial, sans-serif", fontSize: 17, color: "#1A8F3E", letterSpacing: 1 }}>
                  +{result} coins added!
                </div>
              )}
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">Next spin in</div>
              <div className="font-mono text-[28px] font-semibold tabular-nums leading-none" style={{ color: "#00ff87" }}>
                {countdown || "—"}
              </div>
            </div>
          )}

          {err && <p className="font-mono text-[11px] text-red-400">{err}</p>}
        </div>
      </div>
    </div>
  );
}
