.ts

import { BusinessArchetype } from "./businessArchetype";
import { ContextualEvidence } from "./contextualEvidence";

/* ===============================
   Types
   =============================== */

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

/* ===============================
   Decision Aggregation (UPDATED)
   =============================== */

/**
 * Decision policy:
 * - Strongest available signal determines direction
 * - Missing / weak signals reduce confidence but DO NOT veto
 * - Avoid only when overall conviction is truly low
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
  // 1️⃣ Collect lenses that actually have signal
  const lenses = [technical, fundamental, market].filter(
    l => l.confidence > 0
  );

  // Safety fallback (should never happen)
  if (!lenses.length) {
    return {
      action: "AVOID",
      confidence: 0,
      rationale: "No usable signals available",
    };
  }

  // 2️⃣ Pick strongest signal
  const primary = lenses.sort(
    (a, b) => b.confidence - a.confidence
  )[0];

  // 3️⃣ Base confidence from strongest signal
  let confidence = primary.confidence;

  // 4️⃣ Discount for weak / missing confirmation
  const weakCount = [technical, fundamental, market].filter(
    l => l.confidence < 30
  ).length;

  confidence = Math.max(confidence - weakCount * 10, 10);

  // 5️⃣ Decide final action
  let action: FinalAction = "HOLD";

  if (primary.decision === "BUY" && confidence >= 40) {
    action = "BUY";
  } else if (primary.decision === "SELL" && confidence >= 40) {
    action = "SELL";
  } else if (confidence < 20) {
    action = "AVOID";
  }

  return {
    action,
    confidence,
    rationale:
      `Decision driven by strongest signal (${primary.reason}); other signals discounted for ${archetype} profile`,
  };
}
