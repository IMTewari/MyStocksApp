// app/lib/decision/buildInsight.ts

import { deriveTechnicalEvidence } from "./deriveTechnicalEvidence";
import { technicalLens } from "./technicalLens";
import { fundamentalLens } from "./fundamentalLens";
import { marketLens } from "./marketLens";
import { aggregateDecision } from "./decisionEngine";
import { ContextualEvidence } from "./contextualEvidence";
import { getBusinessArchetype } from "./businessArchetype";

export async function buildInsight(
  symbol: string,
  data: {
    candles: number[];
    fundamental: any;
    market: any;
    contextualEvidence: ContextualEvidence[];
  }
) {
  // Canonical business identity
  const archetype = getBusinessArchetype(symbol);

  // Canonical technical facts (derived, not assumed)
  const technicalEvidence = deriveTechnicalEvidence(data.candles);

  const technical = technicalLens(technicalEvidence);
  const fundamental = fundamentalLens(data.fundamental);
  const market = marketLens(data.market);

  // Aggregate with semantic awareness
  const final = aggregateDecision(
    technical,
    fundamental,
    market,
    archetype
  );

  return {
    symbol,
    archetype,

    technical,
    fundamental,
    market,

    contextualEvidence: data.contextualEvidence,

    aiCommentary:
      `Evaluation based on canonical technical facts and ${archetype} business structure.`,

    finalAction: final.action,
    finalConfidence: final.confidence,
    finalRationale: final.rationale,
  };
}
