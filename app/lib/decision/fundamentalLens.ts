import { LensDecision, LensOutcome } from "./decisionEngine";

/**
 * Raw fundamental data required by the lens
 */
export interface FundamentalInput {
  pe: number;
  pe5yMedian: number;
  promoterHolding: number;
  promoterHolding3mAgo: number;
}

/**
 * Fundamental analysis lens
 * Deterministic, explainable, strictly typed
 */
export function fundamentalLens(
  input: FundamentalInput
): LensOutcome {
  const peExpensive = input.pe > input.pe5yMedian * 1.15;
  const promoterReducing =
    input.promoterHolding < input.promoterHolding3mAgo;

  if (peExpensive && promoterReducing) {
    return {
      decision: "SELL" as LensDecision,
      reason:
        "Valuation stretched vs history and promoter holding declining",
      confidence: 80,
    };
  }

  if (!peExpensive && !promoterReducing) {
    return {
      decision: "BUY" as LensDecision,
      reason:
        "Valuation reasonable with stable promoter ownership",
      confidence: 70,
    };
  }

  return {
    decision: "HOLD" as LensDecision,
    reason:
      "Fundamentals stable but not strong enough for action",
    confidence: 50,
  };
}
