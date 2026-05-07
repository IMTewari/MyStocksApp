// app/lib/decision/deriveTechnicalEvidence.ts evidence container.
 * If something cannot be computed, it must be UNKNOWN.
 */
export type Evidence<T> =
  | { status: "KNOWN"; value: T }
  | { status: "UNKNOWN"; reason: string };

/**
 * Canonical technical evidence derived from price ONLY.
 * No assumptions, no opinions, no market context.
 */
export function deriveTechnicalEvidence(closePrices: number[]) {
  // Guard: insufficient history
  if (!closePrices || closePrices.length < 200) {
    return {
      below200dma: {
        status: "UNKNOWN",
        reason: "Less than 200 data points",
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

  // === Derived facts (deterministic) ===
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
     * Structural trend state
     * This is an uncontested canonical fact.
     */
    below200dma: {
      status: "KNOWN",
      value: lastPrice < lastEma200,
    } as Evidence<boolean>,

    /**
     * Momentum structure
     * Short-term directional state, not sentiment.
     */
    momentumUp: {
      status: "KNOWN",
      value: lastEma20 > lastEma50,
    } as Evidence<boolean>,

    /**
     * Directional bias
     * RSI is used ONLY as a state indicator.
     */
    rsiAbove50: {
      status: "KNOWN",
      value: lastRsi > 50,
    } as Evidence<boolean>,
  };
}

import { ema, rsi } from "./technicalIndicators";

/**
