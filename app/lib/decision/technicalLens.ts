import { LensOutcome } from "./decisionEngine";

export type Evidence<T> =
  | { status: "KNOWN"; value: T }
  | { status: "UNKNOWN"; reason: string };

export interface TechnicalInput {
  below200dma: Evidence<boolean>;
  momentumUp: Evidence<boolean>;
}

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
        reason:
          "Below long‑term trend with confirmed momentum breakdown",
        confidence: 75,
      };
    }

    if (!input.below200dma.value && input.momentumUp.value) {
      return {
        decision: "BUY",
        reason:
          "Above long‑term trend with confirmed positive momentum",
        confidence: 70,
      };
    }
  }

  return {
    decision: "HOLD",
    reason:
      "Technical evidence incomplete or inconclusive",
    confidence: 30,
  };
}
