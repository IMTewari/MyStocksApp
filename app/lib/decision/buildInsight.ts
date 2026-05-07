// app/lib/decision/buildInsight.ts

import { deriveTechnicalEvidence } from "./deriveTechnicalEvidence";
import { technicalLens } from "./technicalLens";
import { fundamentalLens } from "./fundamentalLens";
import { marketLens } from "./marketLens";
import { aggregateDecision } from "./decisionEngine";
import { getBusinessArchetype } from "./businessArchetype";
import { ContextualEvidence } from "./contextualEvidence";

export async function buildInsight(
  symbol: string,
  data: {
    candles: number[];        // stock close prices
    indexCandles: number[];   // benchmark close prices (NIFTY, etc.)
    fundamental: any;
    market: any;
    contextualEvidence: ContextualEvidence[];
  }
) {
  // Business identity (deterministic)
  const archetype = getBusinessArchetype(symbol);

  // ✅ FIXED: pass BOTH arguments
  const technicalEvidence = deriveTechnicalEvidence(
    data.candles,
    data.indexCandles
  );

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
      `Decision based on canonical technical facts and ${archetype} structure.`,

    finalAction: final.action,
    finalConfidence: final.confidence,
    finalRationale: final.rationale,
  };
}
