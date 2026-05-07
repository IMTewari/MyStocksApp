// app/lib/decision/deriveTechnicalEvidence.ts

import { ema, rsi } from "./technicalIndicators";

/**
 * Factual evidence container.
 * If something cannot be computed, it must be UNKNOWN.
 */
export type Evidence<T> =
  | { status: "KNOWN"; value: T }
  | { status: "UNKNOWN"; reason: string };

/**
 * Canonical technical evidence derived strictly from price.
 * No assumptions, no opinions, no placeholders.
 */
export function deriveTechnicalEvidence(closePrices: number[]) {
  // Guard: insufficient history
  if (!closePrices || closePrices.length < 200) {
    return {
      below200dma: {
        status: "UNKNOWN",
        reason: "Less than 200 data points available",
      } as Evidence<boolean>,

      momentumUp: {
        status: "UNKNOWN",
        reason: "Insufficient data for EMA momentum",
      } as Evidence<boolean>,

      rsiAbove50: {
        status: "UNKNOWN",
        reason: "Insufficient data for RSI computation",
      } as Evidence<boolean>,
    };
  }

  // === Canonical derived facts ===
  const ema20 = ema(closePrices, 20);
  const ema50 = ema(closePrices, 50);
  const ema200 = ema(closePrices, 200);
  const rsi14 = rsi(closePrices, 14);

  const lastPrice = closePrices[closePrices.length - 1];
  const lastEma20 = ema20[ema20.length - 1];
  const lastEma50 = ema50[ema50.length - 1];
  const lastEma200 = ema200[ema200.length - 1];
  const lastRsi = rsi14[rsi14.length - 1];

  return {
    /**
     * Structural trend state (price vs long-term trend)
     */
    below200dma: {
      status: "KNOWN",
      value: lastPrice < lastEma200,
    } as Evidence<boolean>,

    /**
     * Momentum structure (short-term vs medium-term)
     */
    momentumUp: {
      status: "KNOWN",
      value: lastEma20 > lastEma50,
    } as Evidence<boolean>,

    /**
     * Directional bias indicator
     */
    rsiAbove50: {
      status: "KNOWN",
      value: lastRsi > 50,
    } as Evidence<boolean>,
  };
}
