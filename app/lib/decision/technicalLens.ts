export function technicalLens(input: {
  below200dma: boolean;
  momentumUp: boolean;
}): { decision: "BUY" | "HOLD" | "SELL"; reason: string } {
  if (input.below200dma && !input.momentumUp) {
    return {
      decision: "SELL",
      reason: "Below 200 DMA with no positive momentum",
    };
  }

  if (!input.below200dma && input.momentumUp) {
    return {
      decision: "BUY",
      reason: "Above long-term trend with improving momentum",
    };
  }

  return {
    decision: "HOLD",
    reason: "Trend intact but momentum inconclusive",
  };
}
``
