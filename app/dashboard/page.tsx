"use client";

import { useEffect, useMemo, useState } from "react";
import { computeSignals } from "@/lib/signals";
import { CoachSummary } from "./Coach";

import ScriptDecisionCard from "@/app/components/ScriptDecisionCard";
import { buildInsight } from "@/app/lib/decision/buildInsight";

``

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
     LTP polling (FIXED &)
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
      } catch {
        // silent
      }
    };

    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [rows]);

  /* ===============================
     Compute existing coach signals
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

  useEffect(() => {
  if (!rows.length) return;

  (async () => {
    const out: any[] = [];

    for (const r of rows) {
      try {
        // Map YOUR existing data to insight inputs
        const insight = await buildInsight(r.tradingsymbol, {
          technical: {
            below200dma: flags[r.tradingsymbol]?.some(
              (f: any) => f.type === "below_200dma"
            ) ?? false,
            momentumUp: true, // plug real momentum later
          },
          market: {
            recentDrawdownPct: 15, // can compute
            liquidityReturning: true,
            macroRiskHigh: false,
          },
          sector: "General",
          context: "recent market volatility and risk adjustment",
        });

        out.push(insight);
      } catch (e) {
        console.error("Insight build failed", r.tradingsymbol, e);
      }
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

  const total = valuation;

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

      {/* EXISTING SUMMARY (UNCHANGED) */}
      <CoachSummary rows={rows} flags={flags} tips={tips} />

      <div style={{ marginBottom: 16, color: "#666" }}>
        Valuation: ₹{Math.round(valuation).toLocaleString()}
      </div>

      {/* 🔹 EXISTING HOLDINGS VIEW (UNCHANGED) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map(r => {
          const pnl =
            (r.last_price - r.average_price) * r.quantity;
          const value = r.last_price * r.quantity;
          const allocationPct = total
            ? Math.round((value / total) * 100)
            : 0;

          const f = flags[r.tradingsymbol] || [];
          const t = tips[r.tradingsymbol];

          return (
            <div
              key={r.tradingsymbol}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {r.tradingsymbol}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#666",
                    }}
                  >
                    Qty {r.quantity} · Avg ₹{r.average_price} ·
                    Alloc {allocationPct}%
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600 }}>
                    LTP ₹{r.last_price.toFixed(2)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color:
                        pnl >= 0 ? "green" : "crimson",
                    }}
                  >
                    P&amp;L ₹{pnl.toFixed(2)}
                  </div>
                </div>
              </div>

              {t && (
                <div style={{ marginTop: 6, fontSize: 14 }}>
                  <strong>Coach:</strong>{" "}
                  {t.action.toUpperCase()} — {t.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ======================================================
         ✅ NEW SECTION: AI INVESTMENT DECISIONS (SAFE ADD-ON)
         ====================================================== */}

      <h2 style={{ marginTop: 32 }}>
        AI Investment Decisions
      </h2>

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
``
    </main>
  );
}
