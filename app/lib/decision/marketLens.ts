export function marketLens(input: {
  recentDrawdownPct: number;
  liquidityReturning: boolean;
  macroRiskHigh: boolean;
}) {
  if (input.recentDrawdownPct > 12 && input.liquidityReturning) {
    return {
      decision: "BUY",
      reason:
        "Sharp prior drawdown followed by liquidity-driven recovery",
    };
  }

  if (input.macroRiskHigh) {
    return {
      decision: "HOLD",
      reason:
        "Elevated macro uncertainty limits aggressive positioning",
    };
  }

  return {
    decision: "HOLD",
    reason: "No dominant market impulse",
  };
}
