import type { Outcome, Sentiment } from "./types";

export const BASE_REWARD = 100;

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
  includeSelf: boolean
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
  if (total === 0) return Math.round(BASE_REWARD * 2);
  const share = counts[pick] / total;
  const multiplier = 1 + (1 - share);
  return Math.round(BASE_REWARD * multiplier);
}
