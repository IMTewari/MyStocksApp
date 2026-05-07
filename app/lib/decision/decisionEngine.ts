export type LensDecision = "BUY" | "HOLD" | "SELL";

/**
 NOT NARROW)
 */
export type FinalAction =
  | "BUY"
  | "HOLD"
  | "SELL"
  | "EXIT"
  | "AVOID";

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
 * Portfolio-grade aggregation.
 * No assumptions. UNKNOWN depresses confidence.
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
  const baseConfidence =
    t.confidence * 0.3 +
    f.confidence * 0.5 +
    m.confidence * 0.2;

  const unknownPenalty =
    [t, f, m].filter(x => x.confidence < 40).length * 15;

  const confidence = Math.max(
    0,
    Math.round(baseConfidence - unknownPenalty)
  );

  // Strong negative alignment → EXIT
  if (t.decision === "SELL" && f.decision === "SELL") {
    return {
      action: "EXIT",
      confidence,
      rationale:
        "Technical and fundamental signals jointly indicate capital risk",
    };
  }

  // Structural negative → SELL
  if (f.decision === "SELL") {
    return {
      action: "SELL",
      confidence,
      rationale:
        "Fundamental deterioration outweighs tactical considerations",
    };
  }

  // Strong positive alignment → BUY
  if (t.decision === "BUY" && f.decision === "BUY") {
    return {
      action: "BUY",
      confidence,
      rationale:
        "Positive technical structure aligned with supportive fundamentals",
    };
  }

  // Evidence weak or incomplete → HOLD
  if (confidence >= 40) {
    return {
      action: "HOLD",
      confidence,
      rationale:
        "Evidence insufficient for decisive action; monitoring",
    };
  }

  // High uncertainty → AVOID
  return {
    action: "AVOID",
    confidence,
    rationale:
      "Insufficient reliable information to justify exposure",
  };
}
