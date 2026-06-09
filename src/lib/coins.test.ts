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

  it("pari-mutuel: multiplier = total / pick_count", () => {
    // home has 5/10 picks → multiplier = 10/5 = 2 → 100 * 2 = 200
    expect(estimateReward("home", s(5, 3, 2), false, 100)).toBe(200);
  });

  it("rewards rare picks more than popular picks", () => {
    const sentiment = s(8, 1, 1); // 80% home, 10% draw, 10% away
    const popular = estimateReward("home", sentiment, false, 100); // 10/8 = 1.25× → 125
    const rare    = estimateReward("draw", sentiment, false, 100); // 10/1 = 10× → 1000
    expect(popular).toBe(125);
    expect(rare).toBe(1000);
    expect(rare).toBeGreaterThan(popular);
  });

  it("includeSelf adds the user's pick to counts before computing multiplier", () => {
    // Before: home=1, total=1. includeSelf=true on draw: draw=0→1, total=1→2, multiplier=2/1=2 → 200
    expect(estimateReward("draw", s(1, 0, 0), true, 100)).toBe(200);
  });

  it("rounds to integer coins", () => {
    // home=1, total=3: multiplier=3/1=3 → 300
    expect(estimateReward("home", s(1, 1, 1), false, 100)).toBe(300);
  });

  it("scales linearly with bet amount", () => {
    const sentiment = s(5, 3, 2); // home: 10/5 = 2×
    expect(estimateReward("home", sentiment, false, 100)).toBe(200);
    expect(estimateReward("home", sentiment, false, 1000)).toBe(2000);
    expect(estimateReward("home", sentiment, false, 10)).toBe(20);
  });
});

describe("estimateCashout", () => {
  it("applies a 25% fee on top of the pari-mutuel multiplier", () => {
    // home 5/10 → multiplier 2 → 100 * 2 * 0.75 = 150
    expect(estimateCashout("home", s(5, 3, 2), 100)).toBe(150);
  });

  it("returns 2× bet * CASHOUT_RATE when there are no predictions yet", () => {
    expect(estimateCashout("home", s(0, 0, 0), 100)).toBe(Math.round(100 * 2 * CASHOUT_RATE));
    expect(estimateCashout("home", s(0, 0, 0), 100)).toBe(150);
  });

  it("is always less than the corresponding reward (fee bites)", () => {
    const sentiment = s(5, 3, 2);
    const reward  = estimateReward("home", sentiment, false, 100);
    const cashout = estimateCashout("home", sentiment, 100);
    expect(cashout).toBeLessThan(reward);
  });

  it("pays more when the market has moved against the pick", () => {
    // User backed draw; if everyone else is on home, draw share is small → bigger payout
    const lonely  = estimateCashout("draw", s(8, 1, 1), 100); // 10/1=10× * 0.75 = 750
    const crowded = estimateCashout("draw", s(1, 8, 1), 100); // 10/8=1.25× * 0.75 = 94
    expect(lonely).toBe(750);
    expect(crowded).toBe(94);
    expect(lonely).toBeGreaterThan(crowded);
  });
});
