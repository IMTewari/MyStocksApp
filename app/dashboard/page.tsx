"use client";

import { useEffect, useMemo, useState } from "react";
import { computeSignals } from "@/lib/signals";
import { CoachSummary } from "./Coach";

import ScriptDecisionCard from "@/app/components/ScriptDecisionCard";
import { buildInsight } from "@/app/lib/decision/buildInsight";
import { Evidence } from "@/app/lib/decision/technicalLens";

type HoldingRow = {
  instrument_token: number;
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  last_price: number;
};

export default function Dashboard() {
  const [rows, setRows] = useState<HoldingRow[]>([]);
  const [tips, setTips] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any[]>([]);

  /* ===============================
     Load portfolio
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
     LTP polling
     =============================== */
  useEffect(() => {
    if (!rows.length) return;

    const instruments = rows.map(
      r => `${r.exchange}:${r.tradingsymbol}`
    );

    const tick = async () => {
      try {
        const params = instruments
          .map(i => `i=${encodeURIComponent(i)}`)
          .join("&");

        const ltp = await fetch(`/api/kite/ltp?${params}`).then(r =>
          r.json()
        );

        setRows(prev =>
          prev.map(r => {
            const key = `${r.exchange}:${r.tradingsymbol}`;
            const px = ltp[key]?.last_price;
            return {
              ...r,
              last_price: Number.isFinite(px)
                ? Number(px)
                : r.last_price,
            };
          })
        );
      } catch {}
    };

    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [rows]);

  /* ===============================
     Compute technical flags
     =============================== */
  useEffect(() => {
    (async () => {
      if (!rows.length) return;

      const enriched: any[] = [];

      for (const r of rows) {
        try {
          const url = `/api/data/ohlc?symbol=${encodeURIComponent(
            r.tradingsymbol
          )}&exchange=${encodeURIComponent(r.exchange)}&days=365`;

          const cd = await fetch(url).then(res => res.json());

          enriched.push({
            symbol: r.tradingsymbol,
            qty: r.quantity,
            avg: r.average_price,
            ltp: r.last_price,
            candles: cd.candles || [],
          });
        } catch {
          enriched.push({
            symbol: r.tradingsymbol,
            qty: r.quantity,
            avg: r.average_price,
            ltp: r.last_price,
            candles: [],
          });
        }
      }

      const s = computeSignals(enriched);
      setTips(s.tips);
      setFlags(s.flags);
    })();
  }, [rows]);

  /* ===============================
     Build insights (NO assumptions)
     =============================== */
  useEffect(() => {
    if (!rows.length) return;

    (async () => {
      const out: any[] = [];

      for (const r of rows) {
        const insight = await buildInsight(r.tradingsymbol, {
          technical: {
            below200dma: flags[r.tradingsymbol]
              ? {
                  status: "KNOWN",
                  value: flags[r.tradingsymbol].some(
                    (f: any) => f.type === "below_200dma"
                  ),
                }
              : {
                  status: "UNKNOWN",
                  reason: "No long-term trend flag available",
                },

            momentumUp: {
              status: "UNKNOWN",
              reason: "Momentum model not implemented",
            },
          },

          fundamental: {
            pe: { status: "UNKNOWN", reason: "PE not loaded" },
            pe5yMedian: {
              status: "UNKNOWN",
              reason: "PE history not loaded",
            },
            promoterHolding: {
              status: "UNKNOWN",
              reason: "Promoter data not loaded",
            },
            promoterHolding3mAgo: {
              status: "UNKNOWN",
              reason: "Promoter history not loaded",
            },
          },

          market: {
            recentDrawdownPct: {
              status: "UNKNOWN",
              reason: "Drawdown not computed",
            },
            liquidityReturning: {
              status: "UNKNOWN",
              reason: "Liquidity regime unknown",
            },
            macroRiskHigh: {
              status: "UNKNOWN",
              reason: "Macro risk model not wired",
            },
          },
        });

        out.push(insight);
      }

      setInsights(out);
    })();
  }, [rows, flags]);

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
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
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
