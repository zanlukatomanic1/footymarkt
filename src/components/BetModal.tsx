"use client";

import { useState, useEffect, useCallback } from "react";
import { estimateReward } from "@/lib/coins";
import type { Outcome, Sentiment } from "@/lib/types";

type Props = {
  outcome: Outcome;
  teamLabel: string;
  color: string;
  sentiment: Sentiment;
  userCoins: number;
  onConfirm: (betAmount: number) => Promise<void>;
  onCancel: () => void;
};

const QUICK_AMOUNTS = [10, 25, 50, 100];

function CoinIcon({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1 2-2.5 2.5-2.5 1-2.5 2.5 1.1 2 2.5 2 2.5-.9 2.5-2" />
      <path d="M12 7v1M12 16v1" />
    </svg>
  );
}

export default function BetModal({ outcome, teamLabel, color, sentiment, userCoins, onConfirm, onCancel }: Props) {
  const max = Math.max(1, userCoins);
  const defaultBet = Math.min(100, max);
  const [amount, setAmount] = useState(defaultBet);
  const [input, setInput] = useState(String(defaultBet));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const clamp = useCallback((v: number) => Math.min(max, Math.max(1, v)), [max]);

  const payout = estimateReward(outcome, sentiment, true, amount);
  const profit = payout - amount;
  const multiplier = amount > 0 ? (payout / amount).toFixed(2) : "—";

  const handleInput = (val: string) => {
    setInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n)) setAmount(clamp(n));
  };

  const handleBlur = () => {
    const clamped = clamp(amount);
    setAmount(clamped);
    setInput(String(clamped));
  };

  const handleQuick = (v: number) => {
    const clamped = clamp(v);
    setAmount(clamped);
    setInput(String(clamped));
  };

  const handleMax = () => {
    setAmount(max);
    setInput(String(max));
  };

  const handleSubmit = async () => {
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      await onConfirm(amount);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const dimColor = `${color}20`;
  const borderColor = `${color}40`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-t-[20px] sm:rounded-[18px] p-6"
        style={{
          background: "#141414",
          border: "1px solid #242424",
          boxShadow: `0 0 40px rgba(0,0,0,0.6), 0 0 0 1px ${color}10`,
        }}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint mb-[4px]">
              Place your bet
            </div>
            <div className="flex items-center gap-2">
              <div
                className="rounded-[6px] px-[8px] py-[2px] font-mono text-[12px] font-bold"
                style={{ background: dimColor, border: `1px solid ${borderColor}`, color }}
              >
                {teamLabel}
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:text-ink transition-colors"
            style={{ background: "#1e1e1e" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Balance */}
        <div
          className="mb-4 flex items-center justify-between rounded-[10px] px-[14px] py-[10px]"
          style={{ background: "#0f0f0f", border: "1px solid #1e1e1e" }}
        >
          <span className="font-mono text-[11px] text-ink-faint">Your balance</span>
          <div className="flex items-center gap-[5px]">
            <CoinIcon color="#00ff87" size={12} />
            <span className="font-mono text-[13px] font-semibold text-brand tabular-nums">
              {userCoins.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-3">
          <div className="mb-[8px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-faint">
            Bet amount
          </div>
          <div
            className="flex items-center gap-2 rounded-[10px] px-[14px] py-[10px]"
            style={{ background: "#0f0f0f", border: `1px solid ${borderColor}` }}
          >
            <CoinIcon color={color} size={15} />
            <input
              type="number"
              min={1}
              max={max}
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              onBlur={handleBlur}
              className="flex-1 bg-transparent font-mono text-[20px] font-bold tabular-nums outline-none"
              style={{ color }}
            />
            <button
              onClick={handleMax}
              className="font-mono text-[10px] font-semibold tracking-[0.06em] transition-colors"
              style={{ color: `${color}99` }}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="mb-5 flex gap-2">
          {QUICK_AMOUNTS.filter((v) => v <= max).map((v) => (
            <button
              key={v}
              onClick={() => handleQuick(v)}
              className="flex-1 rounded-[8px] py-[6px] font-mono text-[11px] font-semibold transition-all"
              style={{
                background: amount === v ? dimColor : "#0f0f0f",
                border: `1px solid ${amount === v ? borderColor : "#1e1e1e"}`,
                color: amount === v ? color : "#555",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Payout breakdown */}
        <div
          className="mb-5 rounded-[12px] p-[14px]"
          style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
        >
          <div className="mb-[10px] font-mono text-[10px] uppercase tracking-[0.09em] text-ink-faint">
            If you win
          </div>
          <div className="flex items-baseline gap-[6px] mb-[6px]">
            <CoinIcon color={color} size={16} />
            <span className="font-mono text-[30px] font-bold tabular-nums leading-none" style={{ color }}>
              +{payout.toLocaleString()}
            </span>
            <span className="font-mono text-[11px] text-ink-faint self-end mb-[3px]">coins</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[10.5px]">
            <span className="text-ink-faint">Multiplier</span>
            <span style={{ color: `${color}cc` }}>{multiplier}×</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[10.5px] mt-[4px]">
            <span className="text-ink-faint">Net profit</span>
            <span style={{ color: `${color}cc` }}>+{profit.toLocaleString()}</span>
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-[8px] px-3 py-2 text-center font-mono text-[11px] text-red-400"
            style={{ background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.15)" }}>
            {err}
          </div>
        )}

        {/* Actions */}
        <button
          onClick={handleSubmit}
          disabled={busy || userCoins < 1}
          className="w-full rounded-[10px] py-[13px] font-mono text-[13px] font-bold tracking-[0.04em] transition-all duration-150 disabled:opacity-40"
          style={{
            background: color,
            color: "#080808",
            boxShadow: busy ? "none" : `0 0 20px ${color}30`,
          }}
        >
          {busy ? "Placing bet…" : `Save Bet · ${amount.toLocaleString()} coins`}
        </button>

        <button
          onClick={onCancel}
          disabled={busy}
          className="mt-2 w-full rounded-[10px] py-[10px] font-mono text-[12px] text-ink-faint transition-colors hover:text-ink disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
