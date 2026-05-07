import { ema, rsi } from "./indicators";import { ema, rsi } from =============================== */

type Candles = {
  c: number;
}[];

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
   Thresholds (professional defaults)
   =============================== */

const TH = {
  concentration: 0.25,
  rsiLow: 35,
  rsiHigh: 65,
  drawdownWarn: 0.20,
  drawdownExit: 0.30,
  pnlExit: -0.50,
  dmaTolerance: 0.02, // 2% = soft trend buffer
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
   Signal Engine
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

    const above200 = h.ltp > ema200;
    const ema50Above200 = ema50 > ema200;
    const ema50Near200 =
      Math.abs(ema50 - ema200) / ema200 < TH.dmaTolerance;

    /* ===============================
       STRUCTURAL REGIME (NON‑NEGOTIABLE)
       =============================== */

    let regime:
      | "strong_uptrend"
      | "soft_uptrend"
      | "downtrend";

    if (above200 && ema50Above200) {
      regime = "strong_uptrend";
    } else if (above200 && ema50Near200) {
      regime = "soft_uptrend";
    } else {
      regime = "downtrend";
    }

    /* ===============================
       Risk context flags
       =============================== */

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

    /* ===============================
       DECISION LOGIC
       =============================== */

    let action: Tip["action"] = "hold";
    let reason = "";
    let confidence: Tip["confidence"] = "low";

    /* === Capital protection override === */
    if (
      regime === "downtrend" &&
      (pnlPct <= TH.pnlExit || drawdown > TH.drawdownExit)
    ) {
      action = "exit";
      reason = "Below 200 DMA with sustained weakness; capital protection";
      confidence = "high";
    }

    /* === STRONG UPTREND === */
    else if (regime === "strong_uptrend") {
      if (ema20 > ema50 && lastRsi >= 45 && lastRsi <= 60) {
        action = "add";
        reason =
          "Above 200 DMA with strong structure and supportive momentum";
        confidence = "med";
      } else {
        action = "hold";
        reason =
          "Structural uptrend intact; consolidation phase in progress";
        confidence = "low";
      }
    }

    /* === SOFT UPTREND === */
    else if (regime === "soft_uptrend") {
      action = "hold";
      reason =
        "Above 200 DMA, trend intact but strength moderate; monitoring";
      confidence = "low";
    }

    /* === DOWNTREND (no forced panic) === */
    else {
      action = "hold";
      reason =
        "Below 200 DMA; downtrend persists, avoiding additional exposure";
      confidence = "low";
    }

    flags[h.symbol] = list;
    tips[h.symbol] = { action, reason, confidence };
  }

  return { flags, tips };
}

/* ===============================
   Types
