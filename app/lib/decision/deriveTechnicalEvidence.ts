// app/lib/decision/deriveTechnicalEvidence.ts

import { ema, rsi } from "./technicalIndicators";
import { deriveRelativeStrength } from "./deriveRelativeStrength";

export type Evidence<T> =
  | { status: "KNOWN"; value: T }
  | { status: "UNKNOWN"; reason: string };

export function deriveTechnicalEvidence(
  closePrices: number[],
  indexPrices: number[]     // ← NEW
) {
  if (!closePrices || closePrices.length < 200) {
    return {
      below200dma: {
        status: "UNKNOWN",
        reason: "Insufficient history",
      } as Evidence<boolean>,

      momentumUp: {
        status: "UNKNOWN",
        reason: "Insufficient history",
      } as Evidence<boolean>,

      rsiAbove50: {
        status: "UNKNOWN",
        reason: "Insufficient history",
      } as Evidence<boolean>,

      relativeStrength: {
        status: "UNKNOWN",
        reason: "Index comparison unavailable",
      } as Evidence<number>,
    };
  }

  const ema20 = ema(closePrices, 20);
  const ema50 = ema(closePrices, 50);
  const ema200 = ema(closePrices, 200);
  const rsi14 = rsi(closePrices, 14);

  const rs =
    indexPrices &&
    deriveRelativeStrength(closePrices, indexPrices);

  return {
    below200dma: {
      status: "KNOWN",
      value: closePrices.at(-1)! < ema200.at(-1)!,
    } as Evidence<boolean>,

    momentumUp: {
      status: "KNOWN",
      value: ema20.at(-1)! > ema50.at(-1)!,
    } as Evidence<boolean>,

    rsiAbove50: {
      status: "KNOWN",
      value: rsi14.at(-1)! > 50,
    } as Evidence<boolean>,

    relativeStrength:
      rs === null
        ? {
            status: "UNKNOWN",
            reason: "RS unavailable",
          }
        : {
            status: "KNOWN",
            value: rs,
          },
  };
}
``
