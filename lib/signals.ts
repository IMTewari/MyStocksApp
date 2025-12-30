
// lib/signals.ts
import { ema, rsi } from "./indicators";

type Candles = { c: number }[];
type Holding = {
  symbol: string;
  qty: number;
  avg: number;   // average buy price
  ltp: number;   // last traded price (numeric; we normalized it in the page)
  candles?: Candles; // optional daily closes
};

export type RedFlag = { type: string; message: string; severity: "info" | "warn" | "risk" };
export type Tip     = { action: "buy" | "add" | "trim" | "hold" | "exit"; reason: string; confidence: "low" | "med" | "high" };

const TH = {
  // Portfolio risk
  concentration: 0.25,          // >25% allocation

  // Drawdown (with candles)
  ddWarn: 0.20,                  // 20%
  ddExit: 0.25,                  // 25%

  // RSI bands
  rsiOversold: 30,
  rsiOverbought: 70,
  rsiAddFloor: 40,
  rsiAddCeil: 65,

  // P&L fallback (no candles required)
  pnlWarn: -0.30,               // –30%
  pnlExit: -0.60,               // –60%
};

function computeDrawdown(ltp: number, candles?: Candles): number {
  if (!candles || candles.length === 0) return 0;
  const closes = candles.map(x => x.c).filter(c => Number.isFinite(c) && c > 0);
  if (closes.length === 0) return 0;
  const window = closes.slice(-250);
  const recentHigh = Math.max(...window);
  const price = (Number.isFinite(ltp) && ltp > 0) ? ltp : window.at(-1)!;
  if (!Number.isFinite(recentHigh) || recentHigh <= 0) return 0;
  const dd = 1 - (price / recentHigh);
  return Math.max(0, Math.min(dd, 0.99));
}

export function computeSignals(holdings: Holding[]) {
  const total = holdings.reduce((s, h) => s + h.qty * h.ltp, 0);
  const flags: Record<string, RedFlag[]> = {};
  const tips:  Record<string, Tip> = {};
  const health: Record<string, number> = {}; // 0–100 (optional UI use)

  for (const h of holdings) {
    const alloc  = total ? (h.qty * h.ltp) / total : 0;
    const pnlPct = h.avg > 0 ? (h.ltp - h.avg) / h.avg : 0;

    const list: RedFlag[] = [];
    let score = 100; // start healthy

    // 1) Concentration
    if (alloc > TH.concentration) {
      list.push({
        type: "concentration",
        message: `>25% allocation (${Math.round(alloc * 100)}%)`,
        severity: "risk",
      });
      score -= 20;
    }

    // 2) Candle-aware metrics IF we have candles
    const hasCandles = !!(h.candles && h.candles.length > 50);
    let drawdown = 0, e5 = 0, e20 = 0, lastRsi = 50;

    if (hasCandles) {
      const closes = h.candles!.map(x => x.c).filter(c => Number.isFinite(c));
      if (closes.length > 50) {
        drawdown = computeDrawdown(h.ltp, h.candles);
        e5 = ema(closes, 5).at(-1)!;
        e20 = ema(closes, 20).at(-1)!;
        lastRsi = rsi(closes, 14).at(-1)!;

        // Drawdown flags
        if (drawdown > TH.ddWarn) {
          list.push({
            type: "52w_drawdown",
            message: `Down ${Math.round(drawdown * 100)}% from recent high`,
            severity: drawdown > 0.35 ? "risk" : "warn",
          });
          score -= drawdown > 0.35 ? 25 : 15;
        }

        // Momentum break
        if (e5 < e20) {
          list.push({ type: "momentum_break", message: "5EMA below 20EMA", severity: "warn" });
          score -= 15;
        }

        // RSI info
        if (lastRsi < TH.rsiOversold) list.push({ type: "oversold",   message: `RSI ${lastRsi.toFixed(1)}`, severity: "info" });
        if (lastRsi > TH.rsiOverbought) list.push({ type: "overbought", message: `RSI ${lastRsi.toFixed(1)}`, severity: "info" });
      }
    }

    // 3) Fallback P&L‑based risk (ALWAYS)
    if (pnlPct <= TH.pnlExit) {
      list.push({
        type: "deep_loss",
        message: `Unrealized loss ${Math.round(pnlPct * -100)}%`,
        severity: "risk",
      });
      score -= 35;
    } else if (pnlPct <= TH.pnlWarn) {
      list.push({
        type: "large_loss",
        message: `Unrealized loss ${Math.round(pnlPct * -100)}%`,
        severity: "warn",
      });
      score -= 20;
    }

    // 4) Next Actions (decisive, even without candles)
    let action: Tip["action"] = "hold";
    let reason = "Neutral";
    let confidence: Tip["confidence"] = "med";

    if (hasCandles) {
      // Your “AI-ish” rules using trend + RSI + drawdown
      if (e5 > e20 && drawdown < TH.ddWarn && lastRsi > TH.rsiAddFloor && lastRsi < TH.rsiAddCeil) {
        action = "add"; reason = "Uptrend intact with healthy RSI";
      }
      if (e5 < e20 && lastRsi > (TH.rsiOverbought - 5)) {
        action = "trim"; reason = "Momentum weakening (5<20 EMA, high RSI)";
      }
      if (e5 < e20 && drawdown > TH.ddExit) {
        action = "exit"; reason = "Trend down + deep drawdown"; confidence = "high";
      }
    }

    // Fallback decisions when candles are missing or inconclusive
    if (!hasCandles) {
      if (pnlPct <= TH.pnlExit) { action = "exit"; reason = "Very deep loss; cut risk and redeploy"; confidence = "high"; }
      else if (pnlPct <= TH.pnlWarn) { action = "trim"; reason = "Large loss; reduce exposure while you reassess"; confidence = "med"; }
      else if (alloc > TH.concentration) { action = "trim"; reason = "High concentration; rebalance"; confidence = "med"; }
      else { action = "hold"; reason = "Insufficient history; monitor"; confidence = "low"; }
    }

    flags[h.symbol] = list;
    tips[h.symbol]  = { action, reason, confidence };
    health[h.symbol]= Math.max(0, Math.min(100, score));
  }

  return { flags, tips, health };
}
