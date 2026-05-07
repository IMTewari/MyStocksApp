// app/lib/decision/technicalLens.ts

import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./deriveTechnicalEvidence";

/**
 * Canonical technical input shape.
 * This MUST match what deriveTechnicalEvidence() returns.
 */
export interface TechnicalInput {
  below200dma: Evidence<boolean>;
  momentumUp: Evidence<boolean>;
  rsiAbove50: Evidence<boolean>;
  relativeStrength: Evidence<number>;
}

/**
 * Technical lens interprets STRUCTURE, not prediction.
 */
export function technicalLens(
  input: TechnicalInput
): LensOutcome {

  // Relative strength dominates decision-making
  if (input.relativeStrength.status === "KNOWN") {
    if (input.relativeStrength.value > 0.05) {
      return {
        decision: "BUY",
        reason: "Sustained outperformance versus benchmark",
        confidence: 60,
      };
    }

    if (input.relativeStrength.value < -0.05) {
      return {
        decision: "SELL",
        reason: "Persistent underperformance versus benchmark",
        confidence: 60,
      };
    }
  }

  // Structural weakness fallback
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

  // Default neutral posture
  return {
    decision: "HOLD",
    reason: "No decisive technical edge detected",
    confidence: 45,
  };
}
