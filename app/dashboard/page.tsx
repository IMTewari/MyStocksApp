"use client";

import { useEffect, useMemo, useState } from "react";
import { computeSignals } from "@/lib/signals";
import { CoachSummary } from "./Coach";

import ScriptDecisionCard from "@/app/components/ScriptDecisionCard";
import { buildInsight } from "@/app/lib/decision/buildInsight";
import { known, unknown } from "@/app/lib/decision/evidence";
import { ContextualEvidence } from "@/app/lib/decision/contextualEvidence";

/* ===============================
   Types
   =============================== */

type HoldingRow = {
  instrument_token: number;
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  last_price: number;
};

type Candle = { c: number };

/* ===============================
   Mock fetchers (replace with real APIs)
   =============================== */

async function fetchPE(symbol: string): Promise<{
  pe: number | null;
  pe5yMedian: number | null;
}> {
  try {
    const res = await fetch(`/api/fundamentals/pe?symbol=${symbol}`);
    const data = await res.json();
    return {
      pe: data.pe ?? null,
      pe5yMedian: data.pe5yMedian ?? null,
    };
  } catch {
    return { pe: null, pe5yMedian: null };
  }
}

async function fetchVix(): Promise<number | null> {
  try {
    const res = await fetch(`/api/market/vix`);
    const data = await res.json();
    return typeof data.vix === "number" ? data.vix : null;
  } catch {
    return null;
  }
}

/* ===============================
   Component
   =============================== */

export default function Dashboard() {
  const [rows, setRows] = useState<HoldingRow[]>([]);
  const [candlesBySymbol, setCandlesBySymbol] = useState<
    Record<string, Candle[]>
  >({});
  const [indexCandles, setIndexCandles] = useState<number[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [tips, setTips] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  /* -------------------------------
     Load portfolio
     ------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/kite/portfolio");
        const p = await res.json();

        if (p.error) {
          setError("Not authenticated");
          return;
        }

        setRows(
          (p.holdings || []).map((h: any) => ({
            instrument_token: h.instrument_token,
            tradingsymbol: h.tradingsymbol,
            exchange: h.exchange,
            quantity: h.quantity,
            average_price: h.average_price,
            last_price: Number(h.last_price) || 0,
          }))
        );
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  /* -------------------------------
     Fetch stock candles
     ------------------------------- */
  useEffect(() => {
    if (!rows.length) return;

    (async () => {
      const next: Record<string, Candle[]> = {};

      for (const r of rows) {
        try {
          const res = await fetch(
            `/api/data/ohlc?symbol=${r.tradingsymbol}&exchange=${r.exchange}&days=365`
          );
          const data = await res.json();
          next[r.tradingsymbol] = data.candles || [];
        } catch {
          next[r.tradingsymbol] = [];
        }
      }

      setCandlesBySymbol(next);
    })();
  }, [rows]);

  /* -------------------------------
     Fetch index candles (NIFTY)
     ------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          "/api/data/ohlc?symbol=NIFTY%2050&exchange=NSE&days=365"
        );
        const data = await res.json();
        setIndexCandles((data.candles || []).map((c: any) => c.c));
      } catch {
        setIndexCandles([]);
      }
    })();
  }, []);

  /* -------------------------------
     Existing coach signals
     ------------------------------- */
  useEffect(() => {
    if (!rows.length) return;

    const enriched = rows.map(r => ({
      symbol: r.tradingsymbol,
      qty: r.quantity,
      avg: r.average_price,
      ltp: r.last_price,
      candles: candlesBySymbol[r.tradingsymbol] || [],
    }));

    const s = computeSignals(enriched);
    setTips(s.tips);
    setFlags(s.flags);
  }, [rows, candlesBySymbol]);

  /* -------------------------------
     Build insights (THIS is where Evidence conversion happens)
     ------------------------------- */
  useEffect(() => {
    if (!rows.length) return;

    (async () => {
      const vix = await fetchVix();
      const out: any[] = [];

      for (const r of rows) {
        const rawCandles = candlesBySymbol[r.tradingsymbol] || [];
        const stockCloses = rawCandles.map(c => c.c);
        const { pe, pe5yMedian } = await fetchPE(r.tradingsymbol);

        const insight = await buildInsight(r.tradingsymbol, {
          candles: stockCloses,
          indexCandles,

          // ✅ CONVERT TO EVIDENCE — THIS IS THE ONLY PLACE
          fundamental: {
            pe: pe != null ? known(pe) : unknown<number>("PE unavailable"),
            pe5yMedian:
              pe5yMedian != null
                ? known(pe5yMedian)
                : unknown<number>("PE history unavailable"),
            promoterHolding: unknown<number>("Not wired"),
            promoterHolding3mAgo: unknown<number>("Not wired"),
          },

          market: {
            recentDrawdownPct: unknown<number>("Not used"),
            liquidityReturning: unknown<boolean>("Not used"),
            macroRiskHigh:
              vix != null ? known(vix > 20) : unknown<boolean>("VIX unavailable"),
          },

          contextualEvidence: [] as ContextualEvidence[],
        });

        out.push(insight);
      }

      setInsights(out);
    })();
  }, [rows, candlesBySymbol, indexCandles]);

  const valuation = useMemo(
    () => rows.reduce((a, r) => a + r.last_price * r.quantity, 0),
    [rows]
  );

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <h1>Portfolio Coach</h1>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <CoachSummary rows={rows} flags={flags} tips={tips} />

      <div>Valuation: ₹{Math.round(valuation).toLocaleString()}</div>

      <h2 style={{ marginTop: 32 }}>AI Investment Decisions</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {insights.map(insight => (
          <ScriptDecisionCard key={insight.symbol} insight={insight} />
        ))}
      </div>
    </main>
  );
}
