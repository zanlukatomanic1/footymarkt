import type { Outcome, Sentiment } from "./types";

export const BASE_REWARD = 100;
export const CASHOUT_RATE = 0.75; // 25% fee for early exit

export function sentimentPct(s: Sentiment) {
  const t = s.total_count || 0;
  if (t === 0) return { home: 0, draw: 0, away: 0 };
  return {
    home: (s.home_count / t) * 100,
    draw: (s.draw_count / t) * 100,
    away: (s.away_count / t) * 100,
  };
}

// Multiplier = 1 + (1 - share). share = pickCount / total.
// Estimate assumes the user's pick is included in counts.
export function estimateReward(
  pick: Outcome,
  s: Sentiment,
  includeSelf: boolean,
  betAmount: number = BASE_REWARD
): number {
  const counts = {
    home: s.home_count,
    draw: s.draw_count,
    away: s.away_count,
  };
  let total = s.total_count;
  if (includeSelf) {
    counts[pick] += 1;
    total += 1;
  }
  if (total === 0) return Math.round(betAmount * 2);
  const share = counts[pick] / total;
  const multiplier = 1 + (1 - share);
  return Math.round(betAmount * multiplier);
}

// Cashout value based on current market odds with a 25% early-exit fee.
// If the market has moved against your pick (big underdog), you get more back.
// If everyone is on your side, you take a bigger haircut.
export function estimateCashout(
  pick: Outcome,
  s: Sentiment,
  betAmount: number
): number {
  const counts = {
    home: s.home_count,
    draw: s.draw_count,
    away: s.away_count,
  };
  const total = s.total_count;
  if (total === 0) return Math.round(betAmount * CASHOUT_RATE);
  const share = counts[pick] / total;
  const multiplier = 1 + (1 - share);
  return Math.round(betAmount * multiplier * CASHOUT_RATE);
}
