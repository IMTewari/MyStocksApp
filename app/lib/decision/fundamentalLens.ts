export function fundamentalLens(input: {
  pe: number;
  peBand: "HIGH" | "FAIR" | "LOW";
  promoterTrend: "UP" | "FLAT" | "DOWN";
}) {
  if (input.peBand === "HIGH" && input.promoterTrend === "DOWN") {
    return {
      decision: "SELL",
      reason:
        "Valuation stretched with declining promoter confidence",
    };
  }

  if (input.peBand === "LOW" && input.promoterTrend !== "DOWN") {
    return {
      decision: "BUY",
      reason:
        "Valuation attractive with stable promoter ownership",
    };
  }

  return {
    decision: "HOLD",
    reason: "Fundamentals stable but not compelling",
  };
}
``
