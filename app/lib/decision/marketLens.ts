import { LensDecision, LensOutcome } from "./decisionEngine";

export interface MarketInput {
  recentDrawdownPct: number;
  liquidityReturning: boolean;
  macroRiskHigh: boolean;
}

export function marketLens(input: MarketInput): LensOutcome {
  if (input.recentDrawdownPct > 12 && input.liquidityReturning) {
    return {
      decision: "BUY" as LensDecision,
      reason:
        "Sharp prior drawdown followed by liquidity-led recovery",
      confidence: 65,
    };
  }

  if (input.macroRiskHigh) {
    return {
      decision: "HOLD" as LensDecision,
      reason:
        "Elevated macro uncertainty limits aggressive positioning",
      confidence: 45,
    };
  }

  return {
    decision: "HOLD" as LensDecision,
    reason: "No dominant market impulse",
    confidence: 40,
  };
}
