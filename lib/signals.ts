
import { ema, rsi } from "./indicators";
type Candles = { c: number }[];
type Holding = { symbol: string; qty: number; avg: number; ltp: number; candles?: Candles };

export type RedFlag = { type: string; message: string; severity: "info"|"warn"|"risk" };
export type Tip = { action: "buy"|"add"|"trim"|"hold"|"exit"; reason: string; confidence: "low"|"med"|"high" };

export function computeSignals(holdings: Holding[]) {
  const total = holdings.reduce((s, h) => s + h.qty * h.ltp, 0);
  const flags: Record<string, RedFlag[]> = {};
  const tips: Record<string, Tip> = {};

  for (const h of holdings) {
    const value = h.qty * h.ltp;
    const alloc = total ? value / total : 0;
    const list: RedFlag[] = [];

    if (alloc > 0.25) list.push({ type: "concentration", message: `>25% allocation (${Math.round(alloc*100)}%)`, severity: "risk" });

    const drawdown = h.candles ? 1 - (h.ltp / Math.max(...h.candles.map(x => x.c))) : 0;
    if (drawdown > 0.2) list.push({ type: "drawdown", message: `Down ${Math.round(drawdown*100)}% from recent high`, severity: "warn" });

    if (h.candles && h.candles.length > 50) {
      const closes = h.candles.map(x => x.c);
      const e5 = ema(closes, 5).at(-1)!;
      const e20 = ema(closes, 20).at(-1)!;
      const lastRsi = rsi(closes, 14).at(-1)!;

      if (e5 < e20) list.push({ type: "momentum_break", message: "5EMA below 20EMA", severity: "warn" });
      if (lastRsi < 30) list.push({ type: "oversold", message: `RSI ${lastRsi.toFixed(1)}`, severity: "info" });
      if (lastRsi > 70) list.push({ type: "overbought", message: `RSI ${lastRsi.toFixed(1)}`, severity: "info" });

      let action: Tip["action"] = "hold", reason = "Neutral", confidence: Tip["confidence"] = "med";
      if (e5 > e20 && drawdown < 0.15 && lastRsi > 40 && lastRsi < 65) { action = "add"; reason = "Uptrend intact"; }
      if (e5 < e20 && lastRsi > 65) { action = "trim"; reason = "Momentum weakening"; }
      if (e5 < e20 && drawdown > 0.25) { action = "exit"; reason = "Trend & drawdown risk"; confidence = "high"; }
      tips[h.symbol] = { action, reason, confidence };
    }

    flags[h.symbol] = list;
  }
  return { flags, tips };
}
