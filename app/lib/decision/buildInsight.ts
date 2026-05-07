// app/lib/decision/buildInsight.ts

import { deriveTechnicalEvidence } from "./deriveTechnicalEvidence";
import { technicalLens } from "./technicalLens";
import { fundamentalimport { ContextualEvidence } from "./contextualEvidence";import { fundamentalLens } from "./fundamentalLens";
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
  const archetype = getBusinessArchetype(symbol);

  const technicalEvidence = deriveTechnicalEvidence(data.candles);
  const technical = technicalLens(technicalEvidence);
  const fundamental = fundamentalLens(data.fundamental);
  const market = marketLens(data.market);

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
      `Evaluation performed using canonical structure for ${archetype} business.`,

    finalAction: final.action,
    finalConfidence: final.confidence,
    finalRationale: final.rationale,
  };
}
import { marketLens } from "./marketLens";
import { aggregateDecision } from "./decisionEngine";
