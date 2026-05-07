import { aggregateDecision } from "./decisionEngine";
import { technicalLens } from "./technicalLens";
import { fundamentalLens } from "./fundamentalLens";
import { marketLens } from "./marketLens";
import {import { generateAICommentary } from "./aiCommentary";
    symbol,
    technical,
    fundamental,
    market,
    aiCommentary: generateAICommentary({
      symbol,
      sector: data.sector,
      context: data.context,
    }),
    finalAction: action,
    finalRationale: rationale,
  };
}

export function buildInsight(symbol: string, data: any) {
  const technical = technicalLens(data.technical);
  const fundamental = fundamentalLens(data.fundamental);
  const market = marketLens(data.market);

  const { action, rationale } = aggregateDecision(
    technical,
    fundamental,
    market
  );

