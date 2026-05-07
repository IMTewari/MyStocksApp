export function technicalLens(input: TechnicalInput): LensOutcome {
  if (input.relativeStrength.status === "KNOWN") {
    if (input.relativeStrength.value > 0.05) {
      return {
        decision: "BUY",
        reason: "Sustained outperformance vs index",
        confidence: 60,
      };
    }

    if (input.relativeStrength.value < -0.05) {
      return {
        decision: "SELL",
        reason: "Persistent underperformance vs index",
        confidence: 60,
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
    reason: "No decisive edge vs market",
    confidence: 45,
  };
}
``
