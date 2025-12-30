
// lib/signals.ts
import { ema, rsi } from "./indicators";
type Candles = { c: number }[];
type Holding = { symbol: string; qty: number; avg: number; ltp: number; candles?: Candles };

export type RedFlag = { type: string; message: string; severity: "info"|"warn"|"risk" };
export type Tip = { action: "buy"|"add"|"trim"|"hold"|"exit"; reason: string; confidence: "low"|"med"|"high" };

// Helper: safe drawdown using last 250 valid closes and an ltp fallback
function computeDrawdown(ltp: number, candles: Candles | undefined): number {
  if (!candles || candles.length === 0) return 0;
  // Keep only positive closes
  const closes = candles.map(x => x.c).filter(c => Number.isFinite(c) && c > 0);
  if (closes.length === 0) return 0;

  // Use ~1 year of sessions (adjust if you want a shorter window)
  const window = closes.slice(-250);
  const recentHigh = Math.max(...window);

  // If LTP is not yet available, use most recent close as price
  const price = (Number.isFinite(ltp) && ltp > 0) ? ltp : window.at(-1)!;

  if (!Number.isFinite(recentHigh) || recentHigh <= 0) return 0;

  const dd = 1 - (price / recentHigh);
  // Clamp to [0, 0.99] to avoid extreme values due to data glitches
  return Math.max(0, Math.min(dd, 0.99));
}

export function computeSignals(holdings: Holding[]) {
  const total = holdings.reduce((s, h) => s + h.qty * h.ltp, 0);
  const flags: Record<string, RedFlag[]> = {};
  const tips: Record<string, Tip> = {};

  for (const h of holdings) {
    const value = h.qty * h.ltp;
    const alloc = total ? value / total : 0;
    const list: RedFlag[] = [];

    if (alloc > 0.25) {
      list.push({ type: "concentration",
        message: `>25% allocation (${Math.round(alloc*100)}%)`,
        severity: "risk"
      });
    }

    // ✅ Use robust drawdown
    const drawdown = computeDrawdown(h.ltp, h.candles);
    if (drawdown > 0.2) {
      list.push({
        type: "52w_drawdown",
        message: `Down ${Math.round(drawdown * 100)}% from recent high`,
        severity: drawdown > 0.35 ? "risk" : "warn"
      });
    }

    if (h.candles && h.candles.length > 50) {
      const closes = h.candles.map(x => x.c).filter(c => Number.isFinite(c));
      if (closes.length > 50) {
        const e5 = ema(closes, 5).at(-1)!;
        const e20 = ema(closes, 20).at(-1)!;

        if (e5 < e20) list.push({ type: "momentum_break", message: "5EMA below 20EMA", severity: "warn" });

        const lastRsi = rsi(closes, 14).at(-1)!;
        if (lastRsi < 30) list.push({ type: "oversold", message: `RSI ${lastRsi.toFixed(1)}`, severity: "info" });
        if (lastRsi > 70) list.push({ type: "overbought", message: `RSI ${lastRsi.toFixed(1)}`, severity: "info" });

        let action: Tip["action"] = "hold", reason = "Neutral", confidence: Tip["confidence"] = "med";
        if (e5 > e20 && drawdown < 0.15 && lastRsi > 40 && lastRsi < 65) { action = "add"; reason = "Uptrend intact"; }
        if (e5 < e20 && lastRsi > 65) { action = "trim"; reason = "Momentum weakening"; }
        if (e5 < e20 && drawdown > 0.25) { action = "exit"; reason = "Trend & drawdown risk"; confidence = "high"; }
        tips[h.symbol] = { action, reason, confidence };
      }
    }

    flags[h.symbol] = list;
  }
  return { flags, tips };
}
