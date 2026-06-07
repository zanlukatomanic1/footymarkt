import { describe, it, expect } from "vitest";
import { sentimentPct, estimateReward, estimateCashout, BASE_REWARD, CASHOUT_RATE } from "./coins";
import type { Sentiment } from "./types";

const s = (home: number, draw: number, away: number): Sentiment => ({
  match_id: "m",
  home_count: home,
  draw_count: draw,
  away_count: away,
  total_count: home + draw + away,
});

describe("sentimentPct", () => {
  it("returns zeros when total is 0", () => {
    expect(sentimentPct(s(0, 0, 0))).toEqual({ home: 0, draw: 0, away: 0 });
  });

  it("computes percentages summing to 100", () => {
    const pct = sentimentPct(s(2, 3, 5));
    expect(pct.home).toBe(20);
    expect(pct.draw).toBe(30);
    expect(pct.away).toBe(50);
    expect(pct.home + pct.draw + pct.away).toBe(100);
  });

  it("handles a one-sided market", () => {
    expect(sentimentPct(s(10, 0, 0))).toEqual({ home: 100, draw: 0, away: 0 });
  });
});

describe("estimateReward", () => {
  it("returns 2× bet when there are no predictions yet", () => {
    expect(estimateReward("home", s(0, 0, 0), false, 100)).toBe(200);
    expect(estimateReward("draw", s(0, 0, 0), false, 50)).toBe(100);
  });

  it("uses BASE_REWARD when betAmount is omitted", () => {
    expect(estimateReward("home", s(0, 0, 0), false)).toBe(BASE_REWARD * 2);
  });

  it("scales by (1 + (1 - share)) of the chosen outcome", () => {
    // home has 50% share → multiplier = 1.5 → 100 * 1.5 = 150
    expect(estimateReward("home", s(5, 3, 2), false, 100)).toBe(150);
  });

  it("rewards rare picks more than popular picks", () => {
    const sentiment = s(8, 1, 1); // 80% home, 10% draw, 10% away
    const popular = estimateReward("home", sentiment, false, 100); // share 0.8 → 1.2× → 120
    const rare    = estimateReward("draw", sentiment, false, 100); // share 0.1 → 1.9× → 190
    expect(popular).toBe(120);
    expect(rare).toBe(190);
    expect(rare).toBeGreaterThan(popular);
  });

  it("includeSelf adds the user's pick to counts before computing share", () => {
    // Before: home=1, total=1, share=1.0, multiplier=1.0 → 100
    // includeSelf=true on a fresh draw pick: draw=0→1, total=1→2, share=0.5, multiplier=1.5 → 150
    expect(estimateReward("draw", s(1, 0, 0), true, 100)).toBe(150);
  });

  it("rounds to integer coins", () => {
    // home=1, draw=1, away=1: share=1/3, multiplier=5/3 ≈ 1.6667 → 100 * 1.6667 = 166.67 → 167
    expect(estimateReward("home", s(1, 1, 1), false, 100)).toBe(167);
  });

  it("scales linearly with bet amount", () => {
    const sentiment = s(5, 3, 2);
    expect(estimateReward("home", sentiment, false, 100)).toBe(150);
    expect(estimateReward("home", sentiment, false, 1000)).toBe(1500);
    expect(estimateReward("home", sentiment, false, 10)).toBe(15);
  });
});

describe("estimateCashout", () => {
  it("applies a 25% fee on top of the current multiplier", () => {
    // home 50% share → multiplier 1.5 → 100 * 1.5 * 0.75 = 112.5 → 113
    expect(estimateCashout("home", s(5, 3, 2), 100)).toBe(113);
  });

  it("returns bet * CASHOUT_RATE when there are no predictions yet", () => {
    // No data → fallback: bet * 0.75 (multiplier of 1)
    expect(estimateCashout("home", s(0, 0, 0), 100)).toBe(Math.round(100 * CASHOUT_RATE));
    expect(estimateCashout("home", s(0, 0, 0), 100)).toBe(75);
  });

  it("is always less than the corresponding reward (fee bites)", () => {
    const sentiment = s(5, 3, 2);
    const reward  = estimateReward("home", sentiment, false, 100);
    const cashout = estimateCashout("home", sentiment, 100);
    expect(cashout).toBeLessThan(reward);
  });

  it("pays more when the market has moved against the pick", () => {
    // User backed draw; if everyone else is on home, draw share is small → bigger payout
    const lonely  = estimateCashout("draw", s(8, 1, 1), 100); // share 0.1 → 1.9× × 0.75 = 142.5 → 143
    const crowded = estimateCashout("draw", s(1, 8, 1), 100); // share 0.8 → 1.2× × 0.75 = 90
    expect(lonely).toBe(143);
    expect(crowded).toBe(90);
    expect(lonely).toBeGreaterThan(crowded);
  });
});
