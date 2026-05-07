// app/lib/decision/buildInsight.ts

import { aggregateDecision } from "./decisionEngine";
import { technicalLens } from "./technicalLens";
import { fundamentalLens } from "./fundamentalLens";
import { marketLens } from "./marketLens";
import { deriveTechnicalEvidence } from "./deriveTechnicalEvidence";
import { ContextualEvidence } from "./contextualEvidence";

export async function buildInsight(
  symbol: string,
  data: {
    candles: number[];
    fundamental: any;
    market: any;
    contextualEvidence: ContextualEvidence[];
  }
) {
  // 1️⃣ Canonical technical facts (derived, not assumed)
  const technicalEvidence = deriveTechnicalEvidence(data.candles);

  const technical = technicalLens(technicalEvidence);
  const fundamental = fundamentalLens(data.fundamental);
  const market = marketLens(data.market);

  // 2️⃣ Aggregate decisions conservatively
  const final = aggregateDecision(
    technical,
    fundamental,
    market
  );

  return {
    symbol,
    technical,
    fundamental,
    market,
    contextualEvidence: data.contextualEvidence,
    aiCommentary:
      "Assessment based on canonical technical facts, verified data, and external context. No assumptions were applied.",
    finalAction: final.action,
    finalConfidence: final.confidence,
    finalRationale: final.rationale,
  };
}
