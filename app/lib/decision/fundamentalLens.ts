import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./technicalLens";

export interface FundamentalInput {
  pe: Evidence<number>;
  pe5yMedian: Evidence<number>;
  promoterHolding: Evidence<number>;
  promoterHolding3mAgo: Evidence<number>;
}

export function fundamentalLens(
  input: FundamentalInput
): LensOutcome {
  if (
    input.pe.status !== "KNOWN" ||
    input.pe5yMedian.status !== "KNOWN" ||
    input.promoterHolding.status !== "KNOWN" ||
    input.promoterHolding3mAgo.status !== "KNOWN"
  ) {
    return {
      decision: "HOLD",
      reason:
        "Fundamental data incomplete; no valuation inference made",
      confidence: 25,
    };
  }

  const peExpensive = input.pe.value >
    input.pe5yMedian.value * 1.15;

  const promoterReducing =
    input.promoterHolding.value <
    input.promoterHolding3mAgo.value;

  if (peExpensive && promoterReducing) {
    return {
      decision: "SELL",
      reason:
        "Valuation stretched and promoter holding declining",
      confidence: 80,
    };
  }

  if (!peExpensive && !promoterReducing) {
    return {
      decision: "HOLD",
      reason:
        "Valuation and ownership stable but not compelling",
      confidence: 55,
    };
  }

  return {
    decision: "HOLD",
    reason:
      "Mixed fundamental signals",
    confidence: 40,
  };
}
