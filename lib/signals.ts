
// lib/signals.ts
import { ema, rsi } from "./indicators";

type Candles = { c: number }[];
type Holding = { symbol: string; qty: number; avg: number; ltp: number; candles?: Candles };

export type RedFlag = { type: string; message: string; severity: "info" | "warn" | "risk" };
export type Tip = { action: "buy" | "add" | "trim" | "hold" | "exit"; reason: string; confidence: "low" | "med" | "high" };

// --- robust drawdown helper ---
function computeDrawdown(ltp: number, candles: Candles | undefined): number {
  if (!candles || candles.length === 0) return 0;
  const closes = candles.map(x => x.c).filter(c => Number.isFinite(c) && c > 0);
  if (closes.length === 0) return 0;

  const window = closes.slice(-250);            // ~1Y trading days
  const recentHigh = Math.max(...window);
  const price = (Number.isFinite(ltp) && ltp > 0) ? ltp : window.at(-1)!;
  if (!Number.isFinite(recentHigh) || recentHigh <= 0) return 0;

  const dd = 1 - (price / recentHigh);
  return Math.max(0, Math.min(dd, 0.99));      // clamp to avoid extreme noise
}

// Optional: parameterize thresholds in one place
const THRESHOLDS = {
  concentration: 0.25,      // 25%
  drawdownWarn: 0.20,       // 20%
  drawdownExit: 0.25,       // 25%
  rsiOversold: 30,
  rsiOverbought: 70,
  rsiAddFloor: 40,
  rsiAddCeil: 65,
};

export function computeSignals(holdings: Holding[]) {
  const total = holdings.reduce((s, h) => s + h.qty * h.ltp, 0);
  const flags: Record<string, RedFlag[]> = {};
  const tips: Record<string, Tip> = {};

  for (const h of holdings) {
    const value = h.qty * h.ltp;
    const alloc = total ? value / total : 0;
    const list: RedFlag[] = [];

    // --- concentration (your first rule) ---
    if (alloc > THRESHOLDS.concentration) {
      list.push({
        type: "concentration",
        message: `>25% allocation (${Math.round(alloc * 100)}%)`,
        severity: "risk",
      });
    }

    // Drawdown
    const drawdown = computeDrawdown(h.ltp, h.candles);
    if (drawdown > THRESHOLDS.drawdownWarn) {
      list.push({
        type: "52w_drawdown",
        message: `Down ${Math.round(drawdown * 100)}% from recent high`,
        severity: drawdown > 0.35 ? "risk" : "warn",
      });
    }

    // Momentum & RSI‑based suggestions only if we have enough candles
    if (h.candles && h.candles.length > 50) {
      const closes = h.candles.map(x => x.c).filter(c => Number.isFinite(c));
      if (closes.length > 50) {
        const e5 = ema(closes, 5).at(-1)!;
        const e20 = ema(closes, 20).at(-1)!;
        const lastRsi = rsi(closes, 14).at(-1)!;

        // --- oversold/overbought (your second rule) ---
        if (lastRsi < THRESHOLDS.rsiOversold) {
          list.push({ type: "oversold", message: `RSI ${lastRsi.toFixed(1)}`, severity: "info" });
        }
        if (lastRsi > THRESHOLDS.rsiOverbought) {
          list.push({ type: "overbought", message: `RSI ${lastRsi.toFixed(1)}`, severity: "info" });
        }

        // Momentum break (kept from earlier)
        if (e5 < e20) {
          list.push({ type: "momentum_break", message: "5EMA below 20EMA", severity: "warn" });
        }

        // --- next actions (your third block) ---
        let action: Tip["action"] = "hold";
        let reason = "Neutral";
        let confidence: Tip["confidence"] = "med";

        if (e5 > e20 &&
            drawdown < THRESHOLDS.drawdownWarn &&
            lastRsi > THRESHOLDS.rsiAddFloor &&
            lastRsi < THRESHOLDS.rsiAddCeil) {
          action = "add";
          reason = "Uptrend intact with healthy RSI";
        }

        if (e5 < e20 && lastRsi > THRESHOLDS.rsiOverbought - 5) { // ~>65
          action = "trim";
          reason = "Momentum weakening (5<20 EMA, high RSI)";
        }

        if (e5 < e20 && drawdown > THRESHOLDS.drawdownExit) {
          action = "exit";
          reason = "Trend down + deep drawdown";
          confidence = "high";
        }

        tips[h.symbol] = { action, reason, confidence };
      }
    }

    flags[h.symbol] = list;
  }

  return { flags, tips };
}
