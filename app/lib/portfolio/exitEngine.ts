// app/lib/portfolio/exitEngine.ts

import { ExitSignalInput, ExitSignal } from "./types";

export function scoreExit(input: ExitSignalInput): ExitSignal {
  let score = 0;
  const reasons: string[] = [];

  // --- Trend Breakdown ---
  if (input.below_200dma) {
    score += 30;
    reasons.push("Below 200-DMA (primary trend broken)");
  }

  // --- Drawdown Risk ---
  if ((input.pnl_pct ?? 0) <= -20) {
    score += 30;
    reasons.push("Deep drawdown (>20%)");
  }

  // --- Momentum Collapse ---
  if ((input.week_change_pct ?? 0) <= -8) {
    score += 20;
    reasons.push("Sharp weekly momentum loss");
  }

  // --- Capitulation signal ---
  if ((input.rsi ?? 50) < 30) {
    score += 10;
    reasons.push("RSI below 30 (capitulation)");
  }

  const severity =
    score >= 60 ? "EXIT_NOW" :
    score >= 40 ? "WATCH_CLOSELY" :
    "OK";

  return {
    symbol: input.symbol,
    name: input.name,
    severity,
    score,
    rationale: reasons,
  };
}
