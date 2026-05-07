// app/lib/decision/fundamentalLens.ts

import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./deriveTechnicalEvidence";

export interface FundamentalInput {
  pe: Evidence<number>;
  pe5yMedian: Evidence<number>;
  promoterHolding: Evidence<number>;
  promoterHolding3mAgo: Evidence<number>;
}

export function fundamentalLens(
  input: FundamentalInput
): LensOutcome {
  // If any core fundamental is unknown, remain conservative
  if (
    input.pe.status !== "KNOWN" ||
    input.pe5yMedian.status !== "KNOWN" ||
    input.promoterHolding.status !== "KNOWN" ||
    input.promoterHolding3mAgo.status !== "KNOWN"
  ) {
    return {
      decision: "HOLD",
      reason: "Fundamental data incomplete or unavailable",
      confidence: 25,
    };
  }

  const peExpensive =
    input.pe.value > input.pe5yMedian.value * 1.15;

  const promoterReducing =
    input.promoterHolding.value <
    input.promoterHolding3mAgo.value;

  if (peExpensive && promoterReducing) {
    return {
      decision: "SELL",
      reason: "Valuation stretched with declining promoter holding",
      confidence: 70,
    };
  }

  if (!peExpensive && !promoterReducing) {
    return {
      decision: "BUY",
      reason: "Valuation reasonable with stable promoter holding",
      confidence: 55,
    };
  }

  return {
    decision: "HOLD",
    reason: "Mixed fundamental signals",
    confidence: 40,
  };
}
``
