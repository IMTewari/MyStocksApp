import { aggregateDecision } from "./decisionEngine";
import { technicalLens, Evidence } from "./technicalLens";
import { fundamentalLens } from "./fundamentalLens";
import { marketLens } from "./marketLens";

export async function buildInsight(
  symbol: string,
  data: {
    technical: {
      below200dma: Evidence<boolean>;
      momentumUp: Evidence<boolean>;
    };
    fundamental: {
      pe: Evidence<number>;
      pe5yMedian: Evidence<number>;
      promoterHolding: Evidence<number>;
      promoterHolding3mAgo: Evidence<number>;
    };
    market: {
      recentDrawdownPct: Evidence<number>;
      liquidityReturning: Evidence<boolean>;
      macroRiskHigh: Evidence<boolean>;
    };
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
    aiCommentary:
      "Decision reflects available evidence only; no assumptions made.",
    finalAction: final.action,
    finalConfidence: final.confidence,
    finalRationale: final.rationale,
  };
}
