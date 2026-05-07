// app/lib/decision/buildInsight.ts

import { aggregateDecision } from "./decisionEngine";
import { technicalLens } from "./technicalLens";
import { fundamentalLens } from "./fundamentalLens";
export async function buildInsight(import { marketLens } from "./marketLens";
  symbol: string,
  data: {
    candles: number[];
    fundamental: any;
    market: any;
    contextualEvidence: any[];
  }
) {
  const technicalEvidence = deriveTechnicalEvidence(data.candles);

  const technical = technicalLens(technicalEvidence);
  const fundamental = fundamentalLens(data.fundamental);
  const market = marketLens(data.market);

  const final = aggregateDecision(technical, fundamental, market);

  return {
    symbol,
    technical,
    fundamental,
    market,
    contextualEvidence: data.contextualEvidence,
    aiCommentary:
      "Assessment based on observed technical structure and available evidence.",
    finalAction: final.action,
    finalConfidence: final.confidence,
    finalRationale: final.rationale,
  };
}
``
import { deriveTechnicalEvidence } from "./deriveTechnicalEvidence";

