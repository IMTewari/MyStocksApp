
// Composite rule-based exit score (0..100)
// Higher => more severe; >=70 => EXIT_NOW, >=40 => WATCH_CLOSELY
import { ExitSignalInput, ExitSignal } from "./types";

export function scoreExit(input: ExitSignalInput): ExitSignal {
  const reasons: string[] = [];
  let score = 0;

  // 1D / 1W momentum + volume
  if ((input.day_change_pct ?? 0) <= -3) { score += 15; reasons.push("1D drop ≥ 3%"); }
  if ((input.week_change_pct ?? 0) <= -7) { score += 20; reasons.push("1W drop ≥ 7%"); }
  if ((input.volume_ratio ?? 1) >= 1.5) { score += 10; reasons.push("Volume spike ≥ 1.5×"); }

  // Trend health
  if (input.below_200dma) { score += 20; reasons.push("Below 200-DMA"); }
  if ((input.rsi ?? 50) < 30) { score += 10; reasons.push("RSI < 30 (oversold)"); }

  // News sentiment
  if ((input.news_sentiment ?? 0) < -0.3) { score += 10; reasons.push("Negative news sentiment"); }

  // Stop-loss breach (user-defined)
  if ((input.stop_loss_pct ?? 0) > 0 && (input.pnl_pct ?? 0) <= -(input.stop_loss_pct ?? 0)) {
    score += 25; reasons.push("Stop-loss breached");
  }

  // Cap to 100
  score = Math.min(100, score);

  const severity: ExitSignal["severity"] =
    score >= 70 ? "EXIT_NOW" :
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
