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

// Pari-mutuel multiplier: total_picks / picks_on_this_outcome.
// Matches Polymarket-style odds where losers' pool funds winners.
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
  if (total === 0 || counts[pick] === 0) return Math.round(betAmount * 2);
  const multiplier = total / counts[pick];
  return Math.round(betAmount * multiplier);
}

// Cashout value: current pari-mutuel odds with a 25% early-exit fee.
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
  if (total === 0 || counts[pick] === 0) return Math.round(betAmount * 2 * CASHOUT_RATE);
  const multiplier = total / counts[pick];
  return Math.round(betAmount * multiplier * CASHOUT_RATE);
}
