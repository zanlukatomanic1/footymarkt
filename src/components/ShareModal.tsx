"use client";

import { useState, useEffect, useCallback } from "react";
import { teamData } from "@/lib/teamData";
import { sentimentPct, estimateReward } from "@/lib/coins";
import type { Match, Outcome, Sentiment } from "@/lib/types";

type ImageState = { status: "idle" | "loading" | "ready" | "error"; file: File | null };

type Props = {
  match: Match;
  pick: Outcome;
  betAmount: number;
  sentiment: Sentiment;
  onClose: () => void;
};

function buildShareUrl(match: Match, pick: Outcome, betAmount: number, sentiment: Sentiment) {
  const home = teamData(match.home_team);
  const away = teamData(match.away_team);
  const pct = sentimentPct(sentiment);
  const payout = estimateReward(pick, sentiment, false, betAmount);
  const multiplier = betAmount > 0 ? (payout / betAmount).toFixed(2) : "1.00";

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const matchUrl = `${base}/match/${match.id}`;

  const ogParams = new URLSearchParams({
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homeCode: home.code,
    awayCode: away.code,
    pick,
    bet: String(betAmount),
    payout: String(payout),
    home: pct.home.toFixed(1),
    draw: pct.draw.toFixed(1),
    away: pct.away.toFixed(1),
    comp: match.competition,
    mult: multiplier,
  });

  const ogImageUrl = `${base}/api/og/prediction?${ogParams.toString()}`;

  return { matchUrl, ogImageUrl, payout, multiplier, pct };
}

function buildShareText(match: Match, pick: Outcome) {
  const pickLabel =
    pick === "home" ? match.home_team : pick === "away" ? match.away_team : "Draw";
  return `I'm backing ${pickLabel} in ${match.home_team} vs ${match.away_team} 🏆\n\nMake your prediction on FootyMarkt 👇`;
}

export default function ShareModal({ match, pick, betAmount, sentiment, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [img, setImg] = useState<ImageState>({ status: "idle", file: null });

  const { matchUrl, ogImageUrl, payout, multiplier, pct } = buildShareUrl(match, pick, betAmount, sentiment);
  const shareText = buildShareText(match, pick);

  const triggerDownload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Pre-fetch the OG image in the background so mobile sharing is instant
  useEffect(() => {
    setImg({ status: "loading", file: null });
    const filename = `${match.home_team}-vs-${match.away_team}.png`.replace(/\s+/g, "-");
    fetch(ogImageUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], filename, { type: "image/png" });
        setImg({ status: "ready", file });
      })
      .catch(() => setImg({ status: "error", file: null }));
  }, [ogImageUrl, match.home_team, match.away_team]);

  const pickLabel =
    pick === "home" ? match.home_team : pick === "away" ? match.away_team : "Draw";

  const pickColor =
    pick === "home"
      ? "var(--pick-home-color)"
      : pick === "away"
        ? "var(--pick-away-color)"
        : "var(--pick-draw-color)";
  const pickRgb =
    pick === "home"
      ? "var(--pick-home-rgb)"
      : pick === "away"
        ? "var(--pick-away-rgb)"
        : "var(--pick-draw-rgb)";

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(matchUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [matchUrl]);

  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(matchUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${matchUrl}`)}`;

  // Share image file via native share sheet (works on iOS/Android → picks X, WhatsApp, etc.)
  const shareImageNatively = useCallback(async (fallbackUrl: string) => {
    if (img.file && navigator.canShare?.({ files: [img.file] })) {
      try {
        await navigator.share({ files: [img.file], text: shareText });
        return;
      } catch {
        /* user cancelled or browser rejected */
      }
    }
    window.open(fallbackUrl, "_blank");
  }, [img.file, shareText]);

  const handleShareX = useCallback(() => shareImageNatively(twitterUrl), [shareImageNatively, twitterUrl]);
  const handleShareWhatsApp = useCallback(() => shareImageNatively(whatsappUrl), [shareImageNatively, whatsappUrl]);

const handleNativeShare = useCallback(async () => {
    if (img.file && navigator.canShare?.({ files: [img.file] })) {
      try {
        await navigator.share({ files: [img.file], text: shareText, url: matchUrl });
        return;
      } catch { /* cancelled */ }
    }
    try {
      await navigator.share({ title: `${match.home_team} vs ${match.away_team}`, text: shareText, url: matchUrl });
    } catch { /* cancelled */ }
  }, [img.file, match, shareText, matchUrl]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-t-[20px] sm:rounded-[18px] p-6"
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-line)",
          boxShadow: `0 0 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(${pickRgb}, 0.06)`,
        }}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint mb-[4px]">
              Bet placed!
            </div>
            <div className="text-[15px] font-semibold text-ink-bright">
              Share your prediction
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint hover:text-ink transition-colors"
            style={{ background: "var(--color-element)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Card preview */}
        <div
          className="mb-5 rounded-[12px] p-[16px]"
          style={{
            background: "var(--color-element)",
            border: "1px solid var(--color-line)",
          }}
        >
          {/* Match */}
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] text-ink-faint">{match.competition}</span>
          </div>
          <div className="mb-3 flex items-center justify-between text-[15px] font-semibold text-ink-bright">
            <span>{match.home_team}</span>
            <span className="text-[11px] text-ink-ghost">VS</span>
            <span>{match.away_team}</span>
          </div>

          {/* Sentiment bar */}
          <div className="mb-3">
            <div
              style={{ height: 6, borderRadius: 999, overflow: "hidden", gap: 1 }}
              className="flex bg-line-subtle"
            >
              <div style={{ flex: pct.home || 0.01, background: "rgba(var(--pick-home-rgb), 0.65)", borderRadius: "999px 0 0 999px" }} />
              <div style={{ flex: pct.draw || 0.01, background: "var(--color-line-strong)" }} />
              <div style={{ flex: pct.away || 0.01, background: "rgba(var(--pick-away-rgb), 0.65)", borderRadius: "0 999px 999px 0" }} />
            </div>
            <div className="mt-[6px] flex justify-between font-mono text-[10px] text-ink-faint">
              <span>{pct.home.toFixed(0)}%</span>
              <span>{pct.draw.toFixed(0)}%</span>
              <span>{pct.away.toFixed(0)}%</span>
            </div>
          </div>

          {/* Pick details */}
          <div
            className="flex items-center justify-between rounded-[8px] px-[12px] py-[8px]"
            style={{
              background: `rgba(${pickRgb}, 0.06)`,
              border: `1px solid rgba(${pickRgb}, 0.2)`,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="rounded-[5px] px-[7px] py-[2px] font-mono text-[10px] font-bold"
                style={{ background: `rgba(${pickRgb}, 0.12)`, color: pickColor }}
              >
                MY PICK
              </div>
              <span className="text-[13px] font-semibold" style={{ color: pickColor }}>
                {pickLabel}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[12px]">
              <span className="text-ink-faint">
                {betAmount} <span className="text-[10px]">coins</span>
              </span>
              <span style={{ color: pickColor }} className="font-bold">
                +{payout} <span className="text-[10px] font-normal">({multiplier}×)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex flex-col gap-2">
          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] py-[11px] font-mono text-[12.5px] font-semibold transition-all"
            style={{
              background: copied ? "rgba(var(--pick-home-rgb), 0.1)" : "var(--color-element)",
              border: `1px solid ${copied ? "rgba(var(--pick-home-rgb), 0.3)" : "var(--color-line)"}`,
              color: copied ? "var(--color-brand)" : "var(--color-ink)",
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy link
              </>
            )}
          </button>

          {/* Social row */}
          <div className="flex gap-2">
            {/* Twitter/X — shares image on mobile, opens intent on desktop */}
            <button
              onClick={handleShareX}
              className="flex flex-1 items-center justify-center gap-2 rounded-[10px] py-[11px] font-mono text-[12.5px] font-semibold text-ink transition-colors hover:text-ink-bright"
              style={{ background: "var(--color-element)", border: "1px solid var(--color-line)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Post
            </button>

            {/* WhatsApp — shares image on mobile, opens intent on desktop */}
            <button
              onClick={handleShareWhatsApp}
              className="flex flex-1 items-center justify-center gap-2 rounded-[10px] py-[11px] font-mono text-[12.5px] font-semibold text-ink transition-colors hover:text-ink-bright"
              style={{ background: "var(--color-element)", border: "1px solid var(--color-line)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>

            {/* Save image — direct anchor download, no async gap */}
            <a
              href={ogImageUrl}
              download={`${match.home_team}-vs-${match.away_team}.png`.replace(/\s+/g, "-")}
              className="flex flex-1 items-center justify-center gap-2 rounded-[10px] py-[11px] font-mono text-[12.5px] font-semibold text-ink transition-colors hover:text-ink-bright"
              style={{ background: "var(--color-element)", border: "1px solid var(--color-line)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Save
            </a>
          </div>
        </div>

        {/* Skip */}
        <button
          onClick={onClose}
          className="mt-3 w-full py-[8px] font-mono text-[11px] text-ink-faint transition-colors hover:text-ink"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
