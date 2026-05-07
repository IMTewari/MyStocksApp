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

export function aggregateDecision(
  t: LensOutcome,
  f: LensOutcome,
  m: LensOutcome
): { action: FinalAction; rationale: string } {
  if (f.decision === "SELL" && t.decision === "SELL") {
    return {
      action: "SELL",
      rationale:
        "Weak fundamentals reinforced by deteriorating technical structure",
    };
  }

  if (m.decision === "BUY" && f.decision === "SELL") {
    return {
      action: "HOLD",
      rationale:
        "Tactical momentum acknowledged, but fundamentals limit conviction",
    };
  }

  if (t.decision === "BUY" && f.decision === "BUY") {
    return {
      action: "BUY",
      rationale:
        "Technical strength aligned with supportive fundamentals",
    };
  }

  if (t.decision === "SELL") {
    return {
      action: "SELL",
      rationale:
        "Technical weakness outweighs supportive context",
    };
  }

  return {
    action: "HOLD",
    rationale: "Mixed signals; maintaining position",
  };
}
