export interface FundamentalInput {
  pe: number;
  pe5yMedian: number;
  promoterHolding: number;
  promoterHolding3mAgo: number;
}

export function fundamentalLens(input: FundamentalInput) {
  const peExpensive = input.pe > input.pe5yMedian * 1.15;
  const promoterReducing =
    input.promoterHolding < input.promoterHolding3mAgo;

  if (peExpensive && promoterReducing) {
    return {
      decision: "SELL" as const,
      reason:
        "Valuation stretched versus history and promoter holding declining",
      confidence: 80,
    };
  }

  if (!peExpensive && !promoterReducing) {
    return {
      decision: "BUY" as const,
      reason:
        "Valuation reasonable with stable promoter ownership",
      confidence: 70,
    };
  }

  return {
    decision: "HOLD" as const,
    reason:
      "Fundamentals stable but not strong enough for action",
    confidence: 50,
  };
}
