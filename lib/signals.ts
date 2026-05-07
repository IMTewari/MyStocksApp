import { ema, rsi } from "./indicators";

type Candles = { c: number }[];

type Holding = {
  symbol: string;
  qty: number;
  avg: number;
  ltp: number;
  candles: Candles;
};

export type RedFlag = {
  type: string;
  message: string;
  severity: "info" | "warn" | "risk";
};

export type Tip = {
  action: "add" | "trim" | "hold" | "exit";
  reason: string;
  confidence: "low" | "med" | "high";
};

/* ===============================
   Professional thresholds
   =============================== */
const TH = {
  concentration: 0.25,
  rsiLow: 35,
  rsiHigh: 65,
  drawdownWarn: 0.20,
  drawdownExit: 0.30,
  pnlExit: -0.50,
};

/* ===============================
   Helpers
   =============================== */
function computeDrawdown(closes: number[], price: number): number {
  const window = closes.slice(-250);
  if (!window.length) return 0;

  const high = Math.max(...window);
  if (high <= 0) return 0;

  return Math.max(0, Math.min(1 - price / high, 1));
}

/* ===============================
   Professional Signal Engine
   =============================== */
export function computeSignals(holdings: Holding[]) {
  const totalValue = holdings.reduce((s, h) => s + h.qty * h.ltp, 0);

  const flags: Record<string, RedFlag[]> = {};
  const tips: Record<string, Tip> = {};

  for (const h of holdings) {
    const alloc = totalValue ? (h.qty * h.ltp) / totalValue : 0;
    const pnlPct = h.avg > 0 ? (h.ltp - h.avg) / h.avg : 0;

    const list: RedFlag[] = [];

    /* ===== Concentration risk ===== */
    if (alloc > TH.concentration) {
      list.push({
        type: "concentration",
        message: `High allocation (${Math.round(alloc * 100)}%)`,
        severity: "risk",
      });
    }

    const closes = h.candles.map(x => x.c).filter(Number.isFinite);

    const ema20 = ema(closes, 20).at(-1)!;
    const ema50 = ema(closes, 50).at(-1)!;
    const ema200 = ema(closes, 200).at(-1)!;
    const lastRsi = rsi(closes, 14).at(-1)!;
    const drawdown = computeDrawdown(closes, h.ltp);

    /* ===== Primary trend (non‑negotiable) ===== */
    let regime: "uptrend" | "downtrend" | "range";

    if (h.ltp > ema200 && ema50 > ema200) {
      regime = "uptrend";
    } else if (h.ltp < ema200 && ema50 < ema200) {
      regime = "downtrend";
    } else {
      regime = "range";
    }

    /* ===== Risk context ===== */
    if (drawdown > TH.drawdownWarn) {
      list.push({
        type: "drawdown",
        message: `Down ${Math.round(drawdown * 100)}% from recent high`,
        severity: drawdown > TH.drawdownExit ? "risk" : "warn",
      });
    }

    if (lastRsi < TH.rsiLow) {
      list.push({
        type: "oversold",
        message: `RSI ${lastRsi.toFixed(1)}`,
        severity: "info",
      });
    }

    if (lastRsi > TH.rsiHigh) {
      list.push({
        type: "overbought",
        message: `RSI ${lastRsi.toFixed(1)}`,
        severity: "info",
      });
    }

    /* ===== Decision ===== */
    let action: Tip["action"] = "hold";
    let reason = "";
    let confidence: Tip["confidence"] = "low";

    // Capital protection first
    if (
      pnlPct <= TH.pnlExit ||
      (regime === "downtrend" && drawdown > TH.drawdownExit)
    ) {
      action = "exit";
      reason = "Below 200 DMA with sustained weakness; capital protection";
      confidence = "high";
    }

    // Structural uptrend
    else if (regime === "uptrend") {
      if (ema20 > ema50 && lastRsi >= 45 && lastRsi <= 60) {
        action = "add";
        reason =
          "Above 200 DMA with supportive structure and healthy momentum";
        confidence = "med";
      } else if (lastRsi < 45) {
        reason =
          "Above 200 DMA, but momentum weak; waiting for confirmation";
      } else {
        reason =
          "Primary uptrend intact; no immediate risk‑reward advantage";
      }
    }

    // Range
    else if (regime === "range") {
      reason =
        "Price oscillating between 20 and 50 DMA; trend not established";
    }

    // Downtrend without panic
    else {
      reason =
        "Below 200 DMA; downtrend persists, avoiding additional exposure";
    }

    flags[h.symbol] = list;
    tips[h.symbol] = { action, reason, confidence };
  }

  return { flags, tips };
}
