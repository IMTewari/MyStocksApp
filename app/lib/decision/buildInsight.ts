import { aggregateDecision } from "./decisionEngine";
import { technicalLens } from "./technicalLens";
import { fundamentalLens } from "./fundamentalLens";
import { marketLens } from "./marketLens";
import { generateAICommentary } from "./aiCommentary";

/**
 * Builds one ScriptInsight per symbol.
 * This file must contain ONLY imports + functions.
 */
export async function buildInsight(
  symbol: string,
  data: {
    technical: {
      below200dma: boolean;
      momentumUp: boolean;
    };
    fundamental: {
      pe: number;
      pe5yMedian: number;
      promoterHolding: number;
      promoterHolding3mAgo: number;
    };
    market: {
      recentDrawdownPct: number;
      liquidityReturning: boolean;
      macroRiskHigh: boolean;
    };
    sector: string;
    context: string;
  }
) {
  const technical = technicalLens(data.technical);
  const fundamental = fundamentalLens(data.fundamental);
  const market = marketLens(data.market);

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
    aiCommentary: generateAICommentary({
      symbol,
      sector: data.sector,
      context: data.context,
    }),
    finalAction: final.action,
    finalConfidence: final.confidence,
    finalRationale: final.rationale,
  };
}
