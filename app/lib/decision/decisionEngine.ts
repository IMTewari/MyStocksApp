// app/lib/decision/decisionEngine.ts

import { BusinessArchetype } from "./businessArchetype";
import { ContextualEvidence } from "./contextualEvidence";

export type LensDecision = "BUY" | "HOLD" | "SELL";

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
  archetype: BusinessArchetype;

  technical: LensOutcome;
  fundamental: LensOutcome;
  market: LensOutcome;

  contextualEvidence: ContextualEvidence[];
  aiCommentary: string;

  finalAction: FinalAction;
  finalConfidence: number;
  finalRationale: string;
}

/**
 * Aggregate decisions WITH semantic awareness.
 */
export function aggregateDecision(
  technical: LensOutcome,
  fundamental: LensOutcome,
  market: LensOutcome,
  archetype: BusinessArchetype
): {
  action: FinalAction;
  confidence: number;
  rationale: string;
} {
  // Base weighted confidence
  const base =
    technical.confidence * 0.4 +
    fundamental.confidence * 0.4 +
    market.confidence * 0.2;

  // Penalize uncertainty
  const uncertaintyPenalty =
    [technical, fundamental, market].filter(x => x.confidence < 40).length * 15;

  const confidence = Math.max(0, Math.round(base - uncertaintyPenalty));

  // Structural EXIT
  if (technical.decision === "SELL" && fundamental.decision === "SELL") {
    return {
      action: "EXIT",
      confidence,
      rationale:
        "Technical and fundamental weakness align for this business type",
    };
  }

  // Archetype‑aware BUY gating
  if (
    technical.decision === "BUY" &&
    fundamental.decision === "BUY"
  ) {
    return {
      action: "BUY",
      confidence,
      rationale:
        `Positive structure aligns for ${archetype} business`,
    };
  }

  // Default HOLD with semantics
  return {
    action: confidence > 30 ? "HOLD" : "AVOID",
    confidence,
    rationale:
      `Insufficient confirmation for ${archetype} risk profile`,
  };
}
