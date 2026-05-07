// app/lib/decision/technicalLens.ts

import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./deriveTechnicalEvidence";

export interface TechnicalInput {
  below200dma: Evidence<boolean>;
  momentumUp: Evidence<boolean>;
  rsiAbove50: Evidence<boolean>;
  relativeStrength: Evidence<number>;
}

export function technicalLens(
  input: TechnicalInput
): LensOutcome {
  // Relative strength is the differentiator
  if (
    input.relativeStrength.status === "KNOWN"
  ) {
    if (input.relativeStrength.value > 0.08) {
      return {
        decision: "BUY",
        reason: "Consistent outperformance vs index",
        confidence: 65,
      };
    }

    if (input.relativeStrength.value < -0.08) {
      return {
        decision: "SELL",
        reason: "Persistent underperformance vs index",
        confidence: 65,
      };
    }
  }

  // Structural fallback
  if (
    input.below200dma.status === "KNOWN" &&
    input.below200dma.value
  ) {
    return {
      decision: "HOLD",
      reason: "Below long-term trend",
      confidence: 40,
    };
  }

  return {
    decision: "HOLD",
    reason: "No relative edge detected",
    confidence: 45,
  };
}
``
