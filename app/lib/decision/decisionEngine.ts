export type FinalAction = "BUY" | "HOLD" | "SELL" | "EXIT" | "AVOID";
export type LensDecision = "BUY" | "HOLD" | "SELL";

export interface LensOutcome {
  decision: LensDecision;
  reason: string;
  confidence: number; // 0–100
}

export interface ScriptInsight {
  symbol: string;

  technical: LensOutcome;
  fundamental: LensOutcome;
  market: LensOutcome;

  aiCommentary: string;

  finalAction: FinalAction;
  finalConfidence: number;
  finalRationale: string;
}

/**
 * Aggregate all lenses into a single decision.
 * Final confidence is a weighted blend.
 */
export function aggregateDecision(
  t: LensOutcome,
  f: LensOutcome,
  m: LensOutcome
): {
  action: FinalAction;
  confidence: number;
  rationale: string;
} {
  const confidence = Math.round(
    t.confidence * 0.3 +
      f.confidence * 0.5 +
      m.confidence * 0.2
  );

  if (f.decision === "SELL" && t.decision === "SELL") {
    return {
      action: "SELL",
      confidence,
      rationale:
        "Weak fundamentals reinforced by deteriorating technical structure",
    };
  }

  if (m.decision === "BUY" && f.decision === "SELL") {
    return {
      action: "HOLD",
      confidence,
      rationale:
        "Tactical momentum acknowledged, but fundamentals limit conviction",
    };
  }

  if (t.decision === "BUY" && f.decision === "BUY") {
    return {
      action: "BUY",
      confidence,
      rationale:
        "Technical strength aligned with supportive fundamentals",
    };
  }

  if (t.decision === "SELL") {
    return {
      action: "SELL",
      confidence,
      rationale:
        "Technical weakness outweighs supportive context",
    };
  }

  return {
    action: "HOLD",
    confidence,
    rationale:
      "Mixed signals; maintaining position with caution",
  };
}
