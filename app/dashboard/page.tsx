"use client";

import { useEffect, useMemo, useState } from "react";
import { computeSignals } from "@/lib/signals";
import { CoachSummary } from "./Coach";

import ScriptDecisionCard from "@/app/components/ScriptDecisionCard";
import { buildInsight } from "@/app/lib/decision/buildInsight";
import { ContextualEvidence } from "@/app/lib/decision/contextualEvidence";

type HoldingRow = {
  instrument_token: number;
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  last_price: number;
};

type Candle = { c: number };

export default function Dashboard() {
  const [rows, setRows] = useState<HoldingRow[]>([]);
  const [tips, setTips] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const [candlesBySymbol, setCandlesBySymbol] = useState<
    Record<string, Candle[]>
  >({});

  const [indexCandles, setIndexCandles] = useState<number[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  /* ===============================
     Load Portfolio
     =============================== */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/kite/portfolio");
        const p = await res.json();

        if (p.error) {
          setError(
            "Not authenticated. Click 'Login with Zerodha' on home page."
          );
          return;
        }

        const list: HoldingRow[] = (p.holdings || []).map((h: any) => ({
          instrument_token: h.instrument_token,
          tradingsymbol: h.tradingsymbol,
          exchange: h.exchange,
          quantity: h.quantity,
          average_price: h.average_price,
          last_price: Number.isFinite(h.last_price)
            ? Number(h.last_price)
            : 0,
        }));

        setRows(list);
      } catch (e: any) {
        setError(e?.message || "Failed to load portfolio");
      }
    })();
  }, []);

  /* ===============================
     Fetch Index Candles (Benchmark)
     =============================== */
  useEffect(() => {
    (async () => {
      try {
        // Example: NIFTY 50
        const url =
          "/api/data/ohlc?symbol=NIFTY%2050&exchange=NSE&days=365";
        const res = await fetch(url);
        const data = await res.json();

        const closes = (data.candles || []).map((c: any) => c.c);
        setIndexCandles(closes);
      } catch {
        setIndexCandles([]);
      }
    })();
  }, []);

  /* ===============================
     Fetch OHLC Candles for Holdings
     =============================== */
  useEffect(() => {
    if (!rows.length) return;

    (async () => {
      const next: Record<string, Candle[]> = {};

      for (const r of rows) {
        try {
          const url = `/api/data/ohlc?symbol=${encodeURIComponent(
            r.tradingsymbol
          )}&exchange=${encodeURIComponent(r.exchange)}&days=365`;

          const res = await fetch(url);
          const data = await res.json();

          next[r.tradingsymbol] = data.candles || [];
        } catch {
          next[r.tradingsymbol] = [];
        }
      }

      setCandlesBySymbol(next);
    })();
  }, [rows]);

  /* ===============================
     Existing Coach Logic (UNCHANGED)
     =============================== */
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

  /* ===============================
     Build AI / Decision Insights
     =============================== */
  useEffect(() => {
    if (!rows.length) return;

    (async () => {
      const out: any[] = [];

      for (const r of rows) {
        const rawCandles = candlesBySymbol[r.tradingsymbol] || [];
        const stockCloses = rawCandles.map(c => c.c);

        const insight = await buildInsight(r.tradingsymbol, {
          candles: stockCloses,
          indexCandles,

          fundamental: {
            pe: { status: "UNKNOWN", reason: "PE not wired" },
            pe5yMedian: {
              status: "UNKNOWN",
              reason: "Historical PE not wired",
            },
            promoterHolding: {
              status: "UNKNOWN",
              reason: "Promoter data not wired",
            },
            promoterHolding3mAgo: {
              status: "UNKNOWN",
              reason: "Promoter history not wired",
            },
          },

          market: {
            recentDrawdownPct: {
              status: "UNKNOWN",
              reason: "Drawdown not computed",
            },
            liquidityReturning: {
              status: "UNKNOWN",
              reason: "Liquidity regime not identified",
            },
            macroRiskHigh: {
              status: "UNKNOWN",
              reason: "Macro risk model not wired",
            },
          },

          contextualEvidence: [] as ContextualEvidence[],
        });

        out.push(insight);
      }

      setInsights(out);
    })();
  }, [rows, candlesBySymbol, indexCandles]);

  const valuation = useMemo(
    () =>
      rows.reduce(
        (acc, r) => acc + r.last_price * r.quantity,
        0
      ),
    [rows]
  );

  /* ===============================
     Render
     =============================== */
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>
        Portfolio Coach
      </h1>

      {error && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          {error}
        </div>
      )}

      <CoachSummary rows={rows} flags={flags} tips={tips} />

      <div style={{ marginBottom: 16, color: "#666" }}>
        Valuation: ₹{Math.round(valuation).toLocaleString()}
      </div>

      <h2 style={{ marginTop: 32 }}>
        AI Investment Decisions
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {insights.map(insight => (
          <ScriptDecisionCard
            key={insight.symbol}
            insight={insight}
          />
        ))}
      </div>
    </main>
  );
}
