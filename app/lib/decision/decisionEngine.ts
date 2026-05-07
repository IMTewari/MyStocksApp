// app/lib/decision/decisionEngine.ts

import { ContextualEvidence } from "./contextualEvidence";

/**
 * Lens-level decisions (pure signal outputs)
 */
export type LensDecision = "BUY" | "HOLD" | "SELL";

/**
 * Final portfolio action (DO NOT NARROW)
 */
export type FinalAction =
  | "BUY"
  | "HOLD"
  | "SELL"
  | "EXIT"
  | "AVOID";

/**
 * Standard output from any analytical lens
 */
export interface LensOutcome {
  decision: LensDecision;
  reason: string;
  confidence: number; // 0–100
}

/**
 * Output shown per script in UI
 */
export interface ScriptInsight {
  symbol: string;

  technical: LensOutcome;
  fundamental: LensOutcome;
  market: LensOutcome;

  /**
   * External, fact-based context
   * (geopolitics, macro, commodities, policy)
   */
  contextualEvidence: ContextualEvidence[];

  /**
   * AI narrative explanation (NO decision power)
   */
  aiCommentary: string;

  /**
   * Aggregated portfolio action
   */
  finalAction: FinalAction;
  finalConfidence: number;
  finalRationale: string;
}

/**
 * Aggregate multiple lenses into one portfolio decision.
 *
 * Rules:
 * - No assumptions
 * - Unknown / weak evidence penalizes confidence
 * - EXIT reserved for strong negative alignment
 * - AVOID used when information quality is too low
 */
export function aggregateDecision(
  technical: LensOutcome,
  fundamental: LensOutcome,
  market: LensOutcome
): {
  action: FinalAction;
  confidence: number;
  rationale: string;
} {
  // Weighted confidence (fundamentals dominate by design)
  const baseConfidence =
    technical.confidence * 0.3 +
    fundamental.confidence * 0.5 +
    market.confidence * 0.2;

  // Penalize uncertainty explicitly
  const uncertaintyPenalty =
    [technical, fundamental, market].filter(
      o => o.confidence < 40
    ).length * 15;

  const confidence = Math.max(
    0,
    Math.round(baseConfidence - uncertaintyPenalty)
  );

  // Strong aligned downside → EXIT
  if (
    technical.decision === "SELL" &&
    fundamental.decision === "SELL"
  ) {
    return {
      action: "EXIT",
      confidence,
      rationale:
        "Technical and fundamental signals jointly indicate capital risk",
    };
  }

  // Structural downside → SELL
  if (fundamental.decision === "SELL") {
    return {
      action: "SELL",
      confidence,
      rationale:
        "Fundamental deterioration outweighs tactical considerations",
    };
  }

  // Strong aligned upside → BUY
  if (
    technical.decision === "BUY" &&
    fundamental.decision === "BUY"
  ) {
    return {
      action: "BUY",
      confidence,
      rationale:
        "Technical strength aligned with supportive fundamentals",
    };
  }

  // Moderate evidence → HOLD
  if (confidence >= 40) {
    return {
      action: "HOLD",
      confidence,
      rationale:
        "Evidence incomplete or conflicting; monitoring without action",
    };
  }

  // Low evidence quality → AVOID
  return {
    action: "AVOID",
    confidence,
    rationale:
      "Insufficient reliable information to justify exposure",
  };
}
