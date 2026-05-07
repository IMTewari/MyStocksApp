// app/lib/decision/technicalLens.ts

import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./deriveTechnicalEvidence";

/**
 * TechnicalInput MUST match deriveTechnicalEvidence() output.
 */
export interface TechnicalInput {
  below200dma: Evidence<boolean>;
  momentumUp: Evidence<boolean>;
  rsiAbove50: Evidence<boolean>;
  relativeStrength: Evidence<number>;
}

/**
 * Technical lens:
 * - Relative strength is the PRIMARY discriminator
 * - Structural signals are secondary
 */
export function technicalLens(
  input: TechnicalInput
): LensOutcome {

  // ✅ Relative strength DOMINATES (key change)
  if (input.relativeStrength.status === "KNOWN") {

    // Outperformance vs index (≈ +2% over lookback)
    if (input.relativeStrength.value > 0.02) {
      return {
        decision: "BUY",
        reason: "Sustained outperformance versus benchmark",
        confidence: 60,
      };
    }

    // Underperformance vs index (≈ −2% over lookback)
    if (input.relativeStrength.value < -0.02) {
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

  // Neutral / no edge
  return {
    decision: "HOLD",
    reason: "No decisive technical edge detected",
    confidence: 45,
  };
}
