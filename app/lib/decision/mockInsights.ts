// mockInsights.ts

import { ScriptInsight } from "./decisionEngine";

export const mockInsights: ScriptInsight[] = [
  {
    symbol: "SML100CASE",

    technical: {
      decision: "HOLD",
      reason:
        "Below 200 DMA but strong short-term bounce after 16% drawdown",
    },

    fundamental: {
      decision: "HOLD",
      reason:
        "Index exposure; valuations normalized after broad correction",
    },

    market: {
      decision: "BUY",
      reason:
        "Fear unwind after geopolitical shock; liquidity returning to smallcaps",
    },

    aiCommentary:
      "Recent 15% rally reflects a tactical recovery common after sharp smallcap drawdowns. Volatility remains high.",

    finalAction: "HOLD",
    finalRationale:
      "Tactical upside exists, but structural and valuation clarity insufficient for aggressive buying",
  },

  {
    symbol: "INFY",

    technical: {
      decision: "HOLD",
      reason:
        "Stabilizing near support but remains below long-term averages",
    },

    fundamental: {
      decision: "SELL",
      reason:
        "Valuation premium unresolved amid global IT spending slowdown",
    },

    market: {
      decision: "HOLD",
      reason:
        "IT sector headwinds persist due to rates and macro uncertainty",
    },

    aiCommentary:
      "While business quality remains strong, sector-wide margin pressure continues to cap upside.",

    finalAction: "SELL",
    finalRationale:
      "Weak fundamentals outweigh tentative technical stabilization",
  },

  {
    symbol: "CYIENTDLM",

    technical: {
      decision: "HOLD",
      reason:
        "Consolidating above key support, no breakdown observed",
    },

    fundamental: {
      decision: "BUY",
      reason:
        "Strong positioning in electronics, defense, and power supply chains",
    },

    market: {
      decision: "BUY",
      reason:
        "Capex, defense indigenization, and manufacturing tailwinds strengthening",
    },

    aiCommentary:
      "Structural demand drivers support accumulation despite muted short-term momentum.",

    finalAction: "BUY",
    finalRationale:
      "Strategic tailwinds justify buying on dips",
  },
];
``
