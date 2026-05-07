// app/lib/decision/deriveTechnicalEvidence.ts

import { ema, rsi } from "./technicalIndicators";

export type Evidence<T> =
  | { status: "KNOWN"; value: T }
  | { status: "UNKNOWN"; reason: string };

export function deriveTechnicalEvidence(candles: number[]) {
  if (candles.length < 200) {
    return {
      below200dma: {
        status: "UNKNOWN",
        reason: "Insufficient historical data for 200DMA",
      } as Evidence<boolean>,
      momentumUp: {
        status: "UNKNOWN",
        reason: "Insufficient data for EMA momentum",
      } as Evidence<boolean>,
      rsiAbove50: {
        status: "UNKNOWN",
        reason: "Insufficient data for RSI",
      } as Evidence<boolean>,
    };
  }

  const close = candles;

  const ema20 = ema(close, 20);
  const ema50 = ema(close, 50);
  const ema200 = ema(close, 200);
  const rsi14 = rsi(close, 14);

  return {
    below200dma: {
      status: "KNOWN",
      value: close.at(-1)! < ema200.at(-1)!,
    } as Evidence<boolean>,

    momentumUp: {
      status: "KNOWN",
      value: ema20.at(-1)! > ema50.at(-1)!,
    } as Evidence<boolean>,

    rsiAbove50: {
      status: "KNOWN",
      value: rsi14.at(-1)! > 50,
    } as Evidence<boolean>,
  };
}
