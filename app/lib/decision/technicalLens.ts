// app/lib/decision/technicalLens.ts

import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./deriveTechnicalEvidence";

/**
 * Technical inputs are factual, derived evidence.
 * No assumptions, no placeholders.
 */
export interface TechnicalInput {
  below200dma: Evidence<boolean>;
  momentumUp: Evidence<boolean>;
  rsiAbove50: Evidence<boolean>;
}

/**
 * Canonical technical lens.
 * Interprets structural state — not prediction.
 */
export function technicalLens(
  input: TechnicalInput
): LensOutcome {
  // All facts known → strong signals allowed
  if (
    input.below200dma.status === "KNOWN" &&
    input.momentumUp.status === "KNOWN" &&
    input.rsiAbove50.status === "KNOWN"
  ) {
    // Structural weakness
    if (input.below200dma.value && !input.momentumUp.value) {
      return {
        decision: "SELL",
        reason: "Below long-term trend with weakening momentum",
        confidence: 65,
      };
    }

    // Structural strength
    if (
      !input.below200dma.value &&
      input.momentumUp.value &&
      input.rsiAbove50.value
    ) {
      return {
        decision: "BUY",
        reason: "Above trend with positive momentum and strength",
        confidence: 60,
      };
    }

    // Positive bias but not decisive
    if (!input.below200dma.value && input.rsiAbove50.value) {
      return {
        decision: "HOLD",
        reason: "Holding above trend with positive bias",
        confidence: 50,
      };
    }
  }

  // Default conservative posture
  return {
    decision: "HOLD",
    reason: "No decisive technical edge",
    confidence: 40,
  };
}
