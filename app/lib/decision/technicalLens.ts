import { LensDecision, LensOutcome } from "./decisionEngine";

export interface TechnicalInput {
  below200dma: boolean;
  momentumUp: boolean;
}

export function technicalLens(input: TechnicalInput): LensOutcome {
  if (input.below200dma && !input.momentumUp) {
    return {
      decision: "SELL" as LensDecision,
      reason: "Below 200 DMA with no positive momentum",
      confidence: 75,
    };
  }

  if (!input.below200dma && input.momentumUp) {
    return {
      decision: "BUY" as LensDecision,
      reason: "Above long-term trend with improving momentum",
      confidence: 70,
    };
  }

  return {
    decision: "HOLD" as LensDecision,
    reason: "Trend intact but momentum inconclusive",
    confidence: 45,
  };
}
