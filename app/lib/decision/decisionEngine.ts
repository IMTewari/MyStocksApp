// decisionEngine.ts

export type FinalAction = "BUY" | "HOLD" | "SELL" | "EXIT" | "AVOID";
export type LensDecision = "BUY" | "HOLD" | "SELL";

export interface LensOutcome {
  decision: LensDecision;
  reason: string;
}

export interface ScriptInsight {
  symbol: string;

  technical: LensOutcome;
  fundamental: LensOutcome;
  market: LensOutcome;
  aiCommentary: string;

  finalAction: FinalAction;
  finalRationale: string;
}

/**
 * Investment-committee–style decision aggregator
 */
export function aggregateDecision(
  technical: LensOutcome,
  fundamental: LensOutcome,
  market: LensOutcome
): { action: FinalAction; rationale: string } {
  // Hard exits
  if (fundamental.decision === "SELL" && technical.decision === "SELL") {
    return {
      action: "SELL",
      rationale:
        "Weak fundamentals reinforced by poor technical structure",
    };
  }

  // Tactical rallies vs fundamentals
  if (
    market.decision === "BUY" &&
    fundamental.decision === "SELL"
  ) {
    return {
      action: "HOLD",
      rationale:
        "Tactical opportunity acknowledged but fundamentals limit conviction",
    };
  }

  if (
    technical.decision === "BUY" &&
    fundamental.decision === "BUY"
  ) {
    return {
      action: "BUY",
      rationale:
        "Technical strength aligned with supportive fundamentals",
    };
  }

  if (
    technical.decision === "SELL" &&
    fundamental.decision !== "BUY"
  ) {
    return {
      action: "SELL",
      rationale:
        "Technical weakness outweighs other considerations",
    };
  }

  return {
    action: "HOLD",
    rationale:
      "Mixed signals; maintaining position while monitoring",
  };
}
