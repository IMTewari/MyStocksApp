import { ScriptInsight } from "./decisionEngine";

export const mockInsights: ScriptInsight[] = [
  {
    symbol: "SML100CASE",

    technical: {
      decision: "HOLD",
      reason:
        "Below 200 DMA but strong short-term bounce after 16% drawdown",
      confidence: 55,
    },

    fundamental: {
      decision: "HOLD",
      reason:
        "Index exposure with valuations normalized after sharp correction",
      confidence: 60,
    },

    market: {
      decision: "BUY",
      reason:
        "Fear unwind and liquidity return driving small-cap rally",
      confidence: 65,
    },

    aiCommentary:
      "Recent rally reflects a tactical recovery common after deep small-cap drawdowns. Volatility remains elevated.",

    finalAction: "HOLD",
    finalConfidence: 60,
    finalRationale:
      "Tactical upside exists, but structural clarity insufficient for aggressive allocation",
  },

  {
    symbol: "INFY",

    technical: {
      decision: "HOLD",
      reason:
        "Stabilizing near support but remains below long-term averages",
      confidence: 45,
    },

    fundamental: {
      decision: "SELL",
      reason:
        "Valuation premium unresolved amid global IT slowdown",
      confidence: 80,
    },

    market: {
      decision: "HOLD",
      reason:
