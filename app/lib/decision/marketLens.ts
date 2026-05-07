// app/lib/decision/marketLens.ts

import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./deriveTechnicalEvidence";

export interface MarketInput {
  recentDrawdownPct: Evidence<number>;
  liquidityReturning: Evidence<boolean>;
  macroRiskHigh: Evidence<boolean>;
}

/**
 * Market lens evaluates broad risk environment.
 * It does NOT predict direction.
 */
export function marketLens(
  input: MarketInput
): LensOutcome {
  // If macro context is unknown, stay conservative
  if (
    input.recentDrawdownPct.status !== "KNOWN" ||
    input.liquidityReturning.status !== "KNOWN" ||
    input.macroRiskHigh.status !== "KNOWN"
  ) {
    return {
      decision: "HOLD",
      reason: "Market regime information incomplete",
      confidence: 25,
    };
  }

  // Stress regime
  if (input.macroRiskHigh.value) {
    return {
      decision: "SELL",
      reason: "Elevated macro risk environment",
      confidence: 55,
    };
  }

  // Liquidity recovery after drawdown
  if (
    input.recentDrawdownPct.value > 10 &&
    input.liquidityReturning.value
  ) {
    return {
      decision: "HOLD",
      reason: "Markets stabilizing after drawdown",
      confidence: 40,
    };
  }

  // Neutral macro regime
  return {
    decision: "HOLD",
    reason: "Neutral market environment",
    confidence: 35,
  };
}
