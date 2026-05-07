// app

import { LensOutcome } from "./decisionEngine";
import { Evidence } from "./deriveTechnicalEvidence";

export interface TechnicalInput {
  below200dma: Evidence<boolean>;
  momentumUp: Evidence<boolean>;
  rsiAbove50: Evidence<boolean>;
}

export function technicalLens(input: TechnicalInput): LensOutcome {
  if (
    input.below200dma.status === "KNOWN" &&
    input.momentumUp.status === "KNOWN" &&
    input.rsiAbove50.status === "KNOWN"
  ) {
    // Strong structural weakness
    if (input.below200dma.value && !input.momentumUp.value) {
      return {
        decision: "SELL",
        reason: "Below long-term trend with weakening momentum",
        confidence: 65,
      };
    }

    // Strong upside structure
    if (
      !input.below200dma.value &&
      input.momentumUp.value &&
      input.rsiAbove50.value
    ) {
      return {
        decision: "BUY",
        reason: "Above long-term trend with confirmed strength",
        confidence: 60,
      };
    }

    // Relative strength but not breakout
    if (!input.below200dma.value && input.rsiAbove50.value) {
      return {
        decision: "HOLD",
        reason: "Holding above trend with positive bias",
        confidence: 50,
      };
    }
  }

  return {
    decision: "HOLD",
    reason: "No decisive technical edge",
    confidence: 40,
  };
}
