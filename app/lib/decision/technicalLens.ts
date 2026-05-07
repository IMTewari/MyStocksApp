// app/lib/decision/technicalLens.ts

import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./deriveTechnicalEvidence";

/**
 * Re-export Evidence so callers can import it
 * from the technical boundary without knowing internals.
 */
export type { Evidence };

export interface TechnicalInput {
  below200dma: Evidence<boolean>;
  momentumUp: Evidence<boolean>;
  rsiAbove50: Evidence<boolean>;
}

/**
 * Canonical technical lens.
 * Consumes ONLY factual, derived evidence.
 * No assumptions, no gap-fills.
 */
export function technicalLens(
  input: TechnicalInput
): LensOutcome {
  if (
    input.below200dma.status === "KNOWN" &&
    input.momentumUp.status === "KNOWN"
  ) {
    if (input.below200dma.value && !input.momentumUp.value) {
      return {
        decision: "SELL",
        reason: "Below long-term trend with weak momentum",
        confidence: 70,
      };
    }

    if (!input.below200dma.value && input.momentumUp.value) {
      return {
        decision: "BUY",
        reason: "Above long-term trend with positive momentum",
        confidence: 65,
      };
    }
  }

  return {
    decision: "HOLD",
    reason: "Neutral or mixed technical structure",
    confidence: 45,
  };
}
