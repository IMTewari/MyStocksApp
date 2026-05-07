import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./technicalLens";

export interface MarketInput {
  recentDrawdownPct: Evidence<number>;
  liquidityReturning: Evidence<boolean>;
  macroRiskHigh: Evidence<boolean>;
}

export function marketLens(
  input: MarketInput
): LensOutcome {
  if (
    input.recentDrawdownPct.status !== "KNOWN" ||
    input.liquidityReturning.status !== "KNOWN" ||
    input.macroRiskHigh.status !== "KNOWN"
  ) {
    return {
      decision: "HOLD",
      reason:
        "Market context unclear; refraining from regime call",
      confidence: 30,
    };
  }

  if (
    input.recentDrawdownPct.value > 12 &&
    input.liquidityReturning.value &&
    !input.macroRiskHigh.value
  ) {
    return {
      decision: "HOLD",
      reason:
        "Tactical recovery after drawdown; not a confirmed regime shift",
      confidence: 55,
    };
  }

  if (input.macroRiskHigh.value) {
    return {
      decision: "HOLD",
      reason:
        "Elevated macro risk; capital preservation prioritized",
      confidence: 40,
    };
  }

  return {
    decision: "HOLD",
    reason:
      "No decisive macro impulse",
    confidence: 35,
  };
}
