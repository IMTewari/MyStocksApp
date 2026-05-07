import { ema, rsi } from "./indicators";

type Candles = { c: number }[];
type Holding = {
  symbol: string;
  qty: number;
  avg: number;
  ltp: number;
  candles: Candles; // ✅ candles are REQUIRED by contract
};

export type RedFlag = {
  type: string;
  message: string;
  severity: "info" | "warn" | "risk";
};

export type Tip = {
  action: "buy" | "add" | "trim" | "hold" | "exit";
  reason: string;
  confidence: "low" | "med" | "high";
};

const TH = {
  concentration: 0.25,
  ddWarn: 0.20,
  ddExit: 0.25,
  rsiOversold: 30,
  rsiOverbought: 70,
  rsiAddFloor: 40,
  rsiAddCeil: 65,
  pnlWarn: -0.30,
  pnlExit: -0.60,
};

/* ===============================
   Helpers
   =============================== */
function computeDrawdown(ltp: number, candles: Candles): number {
  const closes = candles.map(x => x.c).filter(c => Number.isFinite(c) && c > 0);
  if (closes.length === 0) return 0;

  const window = closes.slice(-250);
  const recentHigh = Math.max(...window);
  const price = Number.isFinite(ltp) && ltp > 0 ? ltp : window[window.length - 1];

  if (!Number.isFinite(recentHigh) || recentHigh <= 0) return 0;

  const dd = 1 - price / recentHigh;
  return Math.max(0, Math.min(dd, 0.99));
}

/* ===============================
   Signal Engine (Contract‑Based)
   =============================== */
export function computeSignals(holdings: Holding[]) {
  const total = holdings.reduce((s, h) => s + h.qty * h.ltp, 0);

  const flags: Record<string, RedFlag[]> = {};
  const tips: Record<string, Tip> = {};

  for (const h of holdings) {
    const alloc = total ? (h.qty * h.ltp) / total : 0;
    const pnlPct = h.avg > 0 ? (h.ltp - h.avg) / h.avg : 0;

    const list: RedFlag[] = [];

    // Concentration risk
    if (alloc > TH.concentration) {
      list.push({
        type: "concentration",
        message: `>25% allocation (${Math.round(alloc * 100)}%)`,
        severity: "risk",
      });
    }

    const closes = h.candles.map(x => x.c).filter(c => Number.isFinite(c));
    let drawdown = 0;
    let e5 = 0;
    let e20 = 0;
    let lastRsi = 50;

    if (closes.length > 50) {
      drawdown = computeDrawdown(h.ltp, h.candles);
      e5 = ema(closes, 5).at(-1)!;
      e20 = ema(closes, 20).at(-1)!;
      lastRsi = rsi(closes, 14).at(-1)!;

      if (drawdown > TH.ddWarn) {
        list.push({
          type: "52w_drawdown",
          message: `Down ${Math.round(drawdown * 100)}% from recent high`,
          severity: drawdown > 0.35 ? "risk" : "warn",
        });
      }

      if (e5 < e20) {
        list.push({
          type: "momentum_break",
          message: "5EMA below 20EMA",
          severity: "warn",
        });
      }

      if (lastRsi < TH.rsiOversold) {
        list.push({
          type: "oversold",
          message: `RSI ${lastRsi.toFixed(1)}`,
          severity: "info",
        });
      }

      if (lastRsi > TH.rsiOverbought) {
        list.push({
          type: "overbought",
          message: `RSI ${lastRsi.toFixed(1)}`,
          severity: "info",
        });
      }
    }

    // P&L based alerts (always valid)
    if (pnlPct <= TH.pnlExit) {
      list.push({
        type: "deep_loss",
        message: `Unrealized loss ${Math.round(pnlPct * -100)}%`,
        severity: "risk",
      });
    } else if (pnlPct <= TH.pnlWarn) {
      list.push({
        type: "large_loss",
        message: `Unrealized loss ${Math.round(pnlPct * -100)}%`,
        severity: "warn",
      });
    }

    /* ===============================
       Decision Logic (No Guessing)
       =============================== */
    let action: Tip["action"] = "hold";
    let reason = "Trend unclear; monitoring";
    let confidence: Tip["confidence"] = "low";

    if (e5 && e20) {
      if (e5 > e20 && drawdown < TH.ddWarn && lastRsi > TH.rsiAddFloor && lastRsi < TH.rsiAddCeil) {
        action = "add";
        reason = "Uptrend intact with healthy momentum";
        confidence = "med";
      }

      if (e5 < e20 && lastRsi > TH.rsiOverbought - 5) {
        action = "trim";
        reason = "Momentum weakening after extended move";
        confidence = "med";
      }

      if (e5 < e20 && drawdown > TH.ddExit) {
        action = "exit";
        reason = "Primary trend broken with deep drawdown";
        confidence = "high";
      }
    }

    // Capital protection overrides
    if (pnlPct <= TH.pnlExit) {
      action = "exit";
      reason = "Very deep loss; capital protection";
      confidence = "high";
    } else if (pnlPct <= TH.pnlWarn && action === "hold") {
      action = "trim";
      reason = "Large loss; risk reduction";
      confidence = "med";
    }

    flags[h.symbol] = list;
    tips[h.symbol] = { action, reason, confidence };
  }

  return { flags, tips };
}
